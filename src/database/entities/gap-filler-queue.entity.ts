import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('gap_filler_queue')
@Index(['artist_id', 'priority', 'created_at'])
export class GapFillerQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'timestamp' })
  @Index()
  available_from: Date;

  @Column({ type: 'timestamp' })
  available_until: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  max_duration_hours: number;

  @Column({ type: 'varchar', array: true, default: '{}' })
  preferred_styles: string[];

  @Column({ type: 'int', default: 5 })
  priority: number; // 1-10, higher = more priority

  @Column({
    type: 'enum',
    enum: ['queued', 'matched', 'expired', 'cancelled'],
    default: 'queued',
  })
  @Index()
  status: 'queued' | 'matched' | 'expired' | 'cancelled';

  @Column({ type: 'uuid', nullable: true })
  matched_appointment_id: string;

  @Column({ type: 'timestamp', nullable: true })
  matched_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
