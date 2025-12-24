import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IecConductor } from './entities/iec-conductor.entity';
import { IecInsulation } from './entities/iec-insulation.entity';
import { IecSheathRule } from './entities/iec-sheath-rule.entity';
import { IecStandardsService } from './iec-standards.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([IecConductor, IecInsulation, IecSheathRule])
    ],
    providers: [IecStandardsService],
    exports: [IecStandardsService],
})
export class IecStandardsModule { }
