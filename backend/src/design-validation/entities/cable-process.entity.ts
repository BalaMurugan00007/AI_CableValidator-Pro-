import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Design } from './design.entity';
import { ProcessSpecification } from './process-specification.entity';

@Entity()
export class CableProcess {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string; // e.g., "Conductor", "Insulation", "Sheath"

    @ManyToOne(() => Design, (design) => design.processes, { onDelete: 'CASCADE' })
    design: Design;

    @OneToMany(() => ProcessSpecification, (spec) => spec.process, { cascade: true })
    specifications: ProcessSpecification[];
}
