import { Module } from '@nestjs/common';
import { DesignValidationController } from './design-validation.controller';
import { DesignValidationService } from './design-validation.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Design } from './entities/design.entity';
import { CableProcess } from './entities/cable-process.entity';
import { ProcessSpecification } from './entities/process-specification.entity';
import { IecStandardsModule } from '../iec-standards/iec-standards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Design, CableProcess, ProcessSpecification]),
    IecStandardsModule
  ],
  controllers: [DesignValidationController],
  providers: [DesignValidationService],
})
export class DesignValidationModule { }
