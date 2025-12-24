import { Controller, Post, Body, Param } from "@nestjs/common";
import { DesignValidationService } from "./design-validation.service";

@Controller("design")
export class DesignValidationController {
  constructor(
    private readonly designValidationService: DesignValidationService
  ) { }

  @Post("save")
  async saveDesign(@Body() body: any) {
    return this.designValidationService.saveDesign(body);
  }

  @Post("validate/:id")
  async validateDesign(@Param("id") id: string) {
    return this.designValidationService.validateDesign(Number(id));
  }
}
