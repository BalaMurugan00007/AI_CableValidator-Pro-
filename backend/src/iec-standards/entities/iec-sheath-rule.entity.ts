import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IecSheathRule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    cable_type: string; // e.g., 'Armoured', 'Unarmoured'

    @Column({ type: 'float' })
    fictitious_diameter_min: number;

    @Column({ type: 'float' })
    fictitious_diameter_max: number;

    @Column({ type: 'float' })
    nominal_thickness: number;

    @Column({ type: 'float', default: 0.0 })
    min_thickness: number; // Absolute min if applicable
}
