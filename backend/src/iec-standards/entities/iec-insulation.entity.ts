import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IecInsulation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    voltage_grade: string; // e.g., '0.6/1 kV'

    @Column()
    insulation_material: string; // e.g., 'PVC', 'XLPE'

    @Column({ type: 'float' })
    csa_min: number; // Range start

    @Column({ type: 'float' })
    csa_max: number; // Range end

    @Column({ type: 'float' })
    nominal_ti: number; // Nominal Thickness of Insulation

    @Column({ type: 'float', default: 0.9 })
    min_ti_factor: number; // Tolerance factor (e.g., 0.9 * nom - 0.1)
}
