import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('analytics_events')
@Index(['artist_id', 'event_type', 'created_at'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  event_type: string;

  @Column({ type: 'uuid', nullable: true })
  client_id: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>;

  @CreateDateColumn()
  @Index()
  created_at: Date;
}
