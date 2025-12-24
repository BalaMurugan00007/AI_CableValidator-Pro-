import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { CableProcess } from './cable-process.entity';

@Entity()
export class ProcessSpecification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    key: string; // e.g., "Material", "Thickness", "CSA"

    @Column()
    value: string; // e.g., "PVC", "0.8 mm", "16 sqmm"

    @ManyToOne(() => CableProcess, (process) => process.specifications, { onDelete: 'CASCADE' })
    process: CableProcess;
}
