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
import { Project } from './project.entity';
import { HealingCheckpoint } from './healing-checkpoint.entity';

@Entity('sessions')
@Index(['project_id', 'session_number'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'int' })
  session_number: number;

  @Column({ type: 'timestamp' })
  @Index()
  session_date: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  duration_hours: number;

  @Column({ type: 'text', nullable: true })
  work_completed: string;

  @Column({ type: 'varchar', array: true, default: '{}' })
  photos_s3_keys: string[];

  @Column({ type: 'text', nullable: true })
  artist_notes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount_charged: number;

  @Column({ type: 'boolean', default: false })
  payment_received: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => HealingCheckpoint, (checkpoint) => checkpoint.session)
  healing_checkpoints: HealingCheckpoint[];
}
