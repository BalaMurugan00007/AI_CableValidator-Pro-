import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GoogleGenAI } from "@google/genai";
import { IecStandardsService } from "../iec-standards/iec-standards.service";
import { Design } from "./entities/design.entity";
import { CableProcess } from "./entities/cable-process.entity";
import { ProcessSpecification } from "./entities/process-specification.entity";

@Injectable()
export class DesignValidationService {
  private ai: GoogleGenAI;

  constructor(
    @InjectRepository(Design)
    private designRepo: Repository<Design>,
    private readonly iecStandardsService: IecStandardsService
  ) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  // 1. Save Design to DB
  async saveDesign(data: any): Promise<Design> {
    const { design_number, standard, processes } = data;

    // Check if exists
    let design = await this.designRepo.findOne({ where: { design_number } });
    if (design) {
      // Update existing (simple overwrite for now)
      await this.designRepo.remove(design);
    }

    design = new Design();
    design.design_number = design_number;
    design.standard = standard;
    design.processes = processes.map((p: any) => {
      const proc = new CableProcess();
      proc.name = p.name;
      proc.specifications = p.specifications.map((s: any) => {
        const spec = new ProcessSpecification();
        spec.key = s.key;
        spec.value = s.value;
        return spec;
      });
      return proc;
    });

    return this.designRepo.save(design);
  }

  // 2. Validate Design (Fetch from DB -> AI)
  async validateDesign(designId: number) {
    try {
      // A. Fetch from DB
      const design = await this.designRepo.findOne({
        where: { id: designId },
        relations: ["processes", "processes.specifications"],
      });

      if (!design) {
        throw new NotFoundException("Design not found");
      }

      // B. Prepare Data for AI
      // Flatten for prompt
      const designSummary = design.processes.map(p => {
        const specs = p.specifications.map(s => `  - ${s.key}: ${s.value}`).join('\n');
        return `Process: ${p.name}\n${specs}`;
      }).join('\n\n');

      // C. Fetch Standards (Optional: still useful if standard matches IEC)
      // We try to extract some basic params to see if we have ground truth in DB
      const lookupParams: any = {};
      // Simple heuristic to find voltage/conductor for DB lookup
      design.processes.forEach(p => {
        p.specifications.forEach(s => {
          const k = s.key.toLowerCase();
          const v = s.value.toLowerCase();
          if (k.includes('voltage')) lookupParams.voltage = s.value;
          if (k.includes('material') && p.name.toLowerCase().includes('conductor')) lookupParams.conductor_material = v.includes('cu') ? 'Cu' : 'Al';
          if (k.includes('size') || k.includes('csa')) {
            const match = v.match(/(\d+(\.\d+)?)/);
            if (match) lookupParams.csa = match[0];
          }
        });
      });

      const dbStandards = await this.iecStandardsService.findStandards(lookupParams);
      const standardsText = JSON.stringify(dbStandards, null, 2);

      // D. Construct Prompt
      const prompt = `
You are a senior cable design engineer.
Your task is to validate a cable design against the user-selected standard: "${design.standard}".

----------------------------------
DESIGN DATA (Fetched from Database):
Design Number: ${design.design_number}
Standard: ${design.standard}

${designSummary}
----------------------------------

----------------------------------
INTERNAL DB STANDARDS (Reference only, if applicable):
${standardsText}
----------------------------------

INSTRUCTIONS:
1. Validate the design against "${design.standard}".
2. If the standard is IEC 60502-1, use the "INTERNAL DB STANDARDS" as ground truth.
3. **CRITICAL RULE FOR STATUS:**
   - **PASS**: Value matches standard or is safely above minimum.
   - **WARN**: Value is slightly below standard (within 10% tolerance) OR is an unusual configuration (e.g., 16mm² Aluminum). Use "Borderline" or "Review Required" in overall_status.
   - **FAIL**: Value is significantly below standard (>10% deviation) or strictly forbidden.

4. For each Process, evaluate its Specifications.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "validation": [
    {
      "process": string,
      "specification": string,
      "provided": string,
      "expected": string,
      "status": "PASS" | "WARN" | "FAIL",
      "comment": string
    }
  ],
  "overall_status": string, // Use "Design Compliant", "Design Non-Compliant", or "Borderline / Review Required"
  "reasoning": string,
  "suggestion": string,
  "confidence": {
    "overall": number
  }
}
      `;

      const result = await this.callGeminiWithRetry(prompt);
      const rawText = result.text;
      if (!rawText) throw new Error("Empty AI response");

      const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedText);

      // Ensure confidence is max 1.0 (100%)
      if (parsed.confidence && parsed.confidence.overall > 1) {
        parsed.confidence.overall = 1.0;
      }

      // E. Save Result to DB
      design.overall_status = parsed.overall_status;
      design.reasoning = parsed.reasoning;
      design.suggestion = parsed.suggestion;
      await this.designRepo.save(design);

      return parsed;

    } catch (err: any) {
      console.error(" Design validation failed:", err);
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException("AI validation failed");
    }
  }

  // Retry wrapper
  private async callGeminiWithRetry(prompt: string, retries = 1): Promise<any> {
    try {
      return await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
    } catch (err: any) {
      if (err?.status === 503 && retries > 0) {
        await new Promise((res) => setTimeout(res, 1500));
        return this.callGeminiWithRetry(prompt, retries - 1);
      }
      throw err;
    }
  }
}
