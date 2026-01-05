import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from './client.entity';
import { Session } from './session.entity';
import { Design } from './design.entity';

@Entity('projects')
@Index(['client_id', 'status'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['proposed', 'approved', 'in_progress', 'completed', 'cancelled'],
    default: 'proposed',
  })
  @Index()
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ type: 'jsonb' })
  details: {
    style: string;
    body_part: string;
    estimated_size_cm: number;
    color_vs_blackwork: string;
    estimated_sessions: number;
    estimated_hours_total: number;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_price_estimate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  deposit_required: number;

  @Column({ type: 'boolean', default: false })
  deposit_paid: boolean;

  @Column({ type: 'text', nullable: true })
  artist_notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Client, (client) => client.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => Session, (session) => session.project)
  sessions: Session[];

  @OneToMany(() => Design, (design) => design.project)
  designs: Design[];
}
