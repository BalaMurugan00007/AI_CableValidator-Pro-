import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { CableProcess } from './cable-process.entity';

@Entity()
export class Design {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    design_number: string; // e.g., "D001"

    @Column()
    standard: string; // e.g., "IEC 60502-1", "BS 6346"

    @OneToMany(() => CableProcess, (process) => process.design, { cascade: true })
    processes: CableProcess[];

    @Column({ nullable: true })
    overall_status: string;

    @Column({ nullable: true })
    reasoning: string;

    @Column({ nullable: true })
    suggestion: string;

    @CreateDateColumn()
    created_at: Date;
}
