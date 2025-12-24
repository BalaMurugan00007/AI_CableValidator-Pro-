import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IecConductor } from './entities/iec-conductor.entity';
import { IecInsulation } from './entities/iec-insulation.entity';
import { IecSheathRule } from './entities/iec-sheath-rule.entity';

@Injectable()
export class IecStandardsService implements OnModuleInit {
    constructor(
        @InjectRepository(IecConductor)
        private conductorRepo: Repository<IecConductor>,
        @InjectRepository(IecInsulation)
        private insulationRepo: Repository<IecInsulation>,
        @InjectRepository(IecSheathRule)
        private sheathRepo: Repository<IecSheathRule>,
    ) { }

    async onModuleInit() {
        await this.seedConductors();
        await this.seedInsulation();
        await this.seedSheathRules();
    }

    private async seedConductors() {
        const count = await this.conductorRepo.count();
        if (count > 0) return;

        const conductors = [
            { csa: 1.5, material: 'Cu', class: '2', nominal_diameter: 1.56, strand_config: '7/0.53' },
            { csa: 2.5, material: 'Cu', class: '2', nominal_diameter: 2.01, strand_config: '7/0.67' },
            { csa: 4, material: 'Cu', class: '2', nominal_diameter: 2.55, strand_config: '7/0.85' },
            { csa: 6, material: 'Cu', class: '2', nominal_diameter: 3.12, strand_config: '7/1.04' },
            { csa: 10, material: 'Cu', class: '2', nominal_diameter: 4.05, strand_config: '7/1.35' },
            { csa: 16, material: 'Cu', class: '2', nominal_diameter: 5.10, strand_config: '7/1.70' },
            { csa: 25, material: 'Cu', class: '2', nominal_diameter: 6.42, strand_config: '7/2.14' },
            { csa: 35, material: 'Cu', class: '2', nominal_diameter: 7.65, strand_config: '7/2.52' },
            { csa: 50, material: 'Cu', class: '2', nominal_diameter: 8.90, strand_config: '19/1.78' },
            { csa: 70, material: 'Cu', class: '2', nominal_diameter: 10.70, strand_config: '19/2.14' },
            { csa: 95, material: 'Cu', class: '2', nominal_diameter: 12.60, strand_config: '19/2.52' },
        ];

        await this.conductorRepo.save(conductors);
        console.log('✅ Seeded IEC Conductors');
    }

    private async seedInsulation() {
        const count = await this.insulationRepo.count();
        if (count > 0) return;

        const insulations = [
            // PVC 0.6/1 kV
            { voltage_grade: '0.6/1 kV', insulation_material: 'PVC', csa_min: 1.5, csa_max: 25, nominal_ti: 0.8, min_ti_factor: 0.9 },
            { voltage_grade: '0.6/1 kV', insulation_material: 'PVC', csa_min: 35, csa_max: 35, nominal_ti: 1.0, min_ti_factor: 0.9 },
            { voltage_grade: '0.6/1 kV', insulation_material: 'PVC', csa_min: 50, csa_max: 50, nominal_ti: 1.0, min_ti_factor: 0.9 },
            { voltage_grade: '0.6/1 kV', insulation_material: 'PVC', csa_min: 70, csa_max: 70, nominal_ti: 1.2, min_ti_factor: 0.9 },
            { voltage_grade: '0.6/1 kV', insulation_material: 'PVC', csa_min: 95, csa_max: 95, nominal_ti: 1.4, min_ti_factor: 0.9 },

            // XLPE 0.6/1 kV
            { voltage_grade: '0.6/1 kV', insulation_material: 'XLPE', csa_min: 1.5, csa_max: 25, nominal_ti: 0.7, min_ti_factor: 0.9 },
            { voltage_grade: '0.6/1 kV', insulation_material: 'XLPE', csa_min: 35, csa_max: 35, nominal_ti: 0.9, min_ti_factor: 0.9 },
            { voltage_grade: '0.6/1 kV', insulation_material: 'XLPE', csa_min: 50, csa_max: 50, nominal_ti: 1.0, min_ti_factor: 0.9 },
        ];

        await this.insulationRepo.save(insulations);
        console.log('✅ Seeded IEC Insulation');
    }

    private async seedSheathRules() {
        const count = await this.sheathRepo.count();
        if (count > 0) return;

        const rules = [
            { cable_type: 'Unarmoured', fictitious_diameter_min: 0, fictitious_diameter_max: 15, nominal_thickness: 1.4, min_thickness: 1.4 },
            { cable_type: 'Unarmoured', fictitious_diameter_min: 15, fictitious_diameter_max: 25, nominal_thickness: 1.6, min_thickness: 1.6 },
            { cable_type: 'Unarmoured', fictitious_diameter_min: 25, fictitious_diameter_max: 35, nominal_thickness: 1.8, min_thickness: 1.8 },
        ];

        await this.sheathRepo.save(rules);
        console.log('✅ Seeded IEC Sheath Rules');
    }

    async findStandards(params: any) {
        const results: any = {};

        if (params.csa && params.conductor_material) {
            results.conductor = await this.conductorRepo.findOne({
                where: {
                    csa: Number(params.csa),
                    material: params.conductor_material
                }
            });
        }

        if (params.csa && params.insulation_material && params.voltage) {
            results.insulation = await this.insulationRepo
                .createQueryBuilder('ins')
                .where('ins.csa_min <= :csa', { csa: Number(params.csa) })
                .andWhere('ins.csa_max >= :csa', { csa: Number(params.csa) })
                .andWhere('ins.insulation_material = :mat', { mat: params.insulation_material })
                .andWhere('ins.voltage_grade = :volt', { volt: params.voltage })
                .getOne();
        }

        return results;
    }
}
