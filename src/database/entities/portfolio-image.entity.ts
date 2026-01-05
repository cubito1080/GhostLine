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

@Entity('portfolio_images')
@Index('idx_portfolio_tags', { synchronize: false }) // GIN index created via migration
@Index('idx_portfolio_embedding', { synchronize: false }) // ivfflat index created via migration
export class PortfolioImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  s3_url: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', array: true, default: '{}' })
  tags: string[]; // GIN indexed

  @Column({ type: 'jsonb', nullable: true })
  auto_generated_metadata: {
    detected_style?: string[];
    body_part?: string;
    color_palette?: string[];
    complexity_score?: number;
    size_estimate?: string;
  };

  @Column({ type: 'varchar', length: 1000, nullable: true })
  embedding: string; // VECTOR(768) - stored as string, handled by pgvector

  @Column({ type: 'boolean', default: true })
  is_public: boolean;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  search_hit_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Artist, (artist) => artist.portfolio_images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist;
}
