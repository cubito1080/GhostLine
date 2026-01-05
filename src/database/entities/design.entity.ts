import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Artist } from './artist.entity';
import { Project } from './project.entity';

@Entity('designs')
@Index(['project_id', 'version'])
export class Design {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'uuid', nullable: true })
  project_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 500 })
  original_s3_key: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  stencil_s3_key: string;

  @Column({
    type: 'enum',
    enum: ['uploaded', 'processing', 'ready', 'failed'],
    default: 'uploaded',
  })
  @Index()
  status: 'uploaded' | 'processing' | 'ready' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  gemini_analysis: {
    detected_elements?: string[];
    style_classification?: string;
    suggested_placement?: string[];
    complexity_notes?: string;
  };

  @Column({ type: 'boolean', default: false })
  approved_by_client: boolean;

  @Column({ type: 'text', nullable: true })
  client_feedback: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Artist, (artist) => artist.designs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist;

  @ManyToOne(() => Project, (project) => project.designs, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
