import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('search_cache')
@Index(['query_hash', 'artist_id'])
export class SearchCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'varchar', length: 64 })
  query_hash: string; // SHA-256 hash of normalized query

  @Column({ type: 'text' })
  original_query: string;

  @Column({ type: 'jsonb' })
  results: {
    image_ids: string[];
    relevance_scores?: number[];
  };

  @Column({ type: 'int', default: 1 })
  hit_count: number;

  @Column({ type: 'timestamp' })
  @Index()
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
