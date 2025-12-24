export const runtime = "nodejs";

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cableInput = body?.input;

    if (!cableInput || typeof cableInput !== "string") {
      return NextResponse.json(
        { error: "Cable input text is required" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const prompt = `
You are a senior low-voltage cable design engineer.

Your task is to validate a cable design against IEC 60502-1 and IEC 60228
using engineering reasoning.

IMPORTANT RULES:
- Do NOT quote IEC tables or clause numbers.
- Do NOT say “according to table X”.
- Perform validation using your understanding of IEC expectations.
- If information is missing or ambiguous, return WARN.
- If information is clearly non-compliant, return FAIL.
- If compliant, return PASS.
- Validation is advisory and for engineering review.

You MUST return RAW JSON ONLY.
Do NOT use markdown.
Do NOT include explanations outside JSON.

----------------------------------
INPUT (may be structured JSON or free text):

${cableInput}
----------------------------------

OUTPUT FORMAT (STRICT):

{
  "fields": {
    "standard": string | null,
    "voltage": string | null,
    "conductor_material": string | null,
    "conductor_class": string | null,
    "csa": number | null,
    "insulation_material": string | null,
    "insulation_thickness": number | null
  },
  "validation": [
    {
      "field": string,
      "provided": string | null,
      "expected": string,
      "status": "PASS" | "WARN" | "FAIL",
      "comment": string
    }
  ],
  "confidence": {
    "overall": number
  }
}

VALIDATION GUIDELINES:
- Validate conductor class vs standard applicability.
- Validate insulation thickness consistency with voltage, CSA, and material.
- If insulation thickness is slightly ambiguous, return WARN.
- If required parameters are missing, return WARN.
- If voltage rating contradicts insulation/material usage, return FAIL.
- Confidence should reflect completeness and certainty of validation.

RETURN ONLY VALID JSON.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const rawText = result.text;

    if (!rawText) {
      throw new Error("Gemini returned empty response");
    }

    const cleanedText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    return NextResponse.json({ result: parsed });
  } catch (err: any) {
    console.error("🔥 GEMINI ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Cable validation failed" },
      { status: 500 }
    );
  }
}
