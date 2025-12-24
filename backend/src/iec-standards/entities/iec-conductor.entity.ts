import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IecConductor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float' })
  csa: number; // Cross Sectional Area in sqmm

  @Column()
  material: string; // e.g., 'Cu', 'Al'

  @Column()
  class: string; // e.g., '1', '2', '5'

  @Column({ type: 'float', nullable: true })
  nominal_diameter: number; // in mm

  @Column({ nullable: true })
  strand_config: string; // e.g., '7/1.70'
}
