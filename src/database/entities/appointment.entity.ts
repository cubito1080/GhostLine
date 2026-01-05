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
import { Client } from './client.entity';

@Entity('appointments')
@Index(['artist_id', 'start_time'])
@Index(['client_id', 'status'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'timestamp' })
  @Index()
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  duration_hours: number; // Calculated duration (e.g., 2.5, 6.0, 8.0)

  @Column({
    type: 'enum',
    enum: ['large', 'small'],
    default: 'small',
  })
  @Index()
  session_type: 'large' | 'small'; // Large (6-8h) or Small (<3h)

  @Column({
    type: 'enum',
    enum: ['proposed', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'proposed',
  })
  @Index()
  status: 'proposed' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

  @Column({ type: 'varchar', length: 500, nullable: true })
  google_calendar_event_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  reminder_24h_sent: boolean;

  @Column({ type: 'boolean', default: false })
  reminder_1h_sent: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Artist, (artist) => artist.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist;

  @ManyToOne(() => Client, (client) => client.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;
}
