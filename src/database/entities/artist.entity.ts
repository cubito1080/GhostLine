import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Client } from './client.entity';
import { PortfolioImage } from './portfolio-image.entity';
import { Design } from './design.entity';
import { Appointment } from './appointment.entity';
import { Payment } from './payment.entity';

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  whatsapp_business_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'jsonb' })
  rates: {
    hourly_rate?: number;
    session_rate?: number;
    deposit_percentage: number;
    currency: string;
  };

  @Column({ type: 'jsonb' })
  methodology: {
    // ═══ SESSION TYPE CONFIGURATION ═══
    // Differentiate between large and small sessions
    large_session: {
      duration_hours: number; // e.g., 6-8 hours
      max_per_day: number; // Usually 1
      requires_full_day: boolean; // If true, no small sessions allowed same day
    };
    
    small_session: {
      min_duration_hours: number; // e.g., 1 hour
      max_duration_hours: number; // e.g., 3 hours (threshold for "small")
      max_per_day: number; // e.g., 4 small sessions
      break_between_sessions_minutes: number; // e.g., 15-30 minutes
    };
    
    // ═══ WORKING DAYS (0 = Sunday, 1 = Monday, ..., 6 = Saturday) ═══
    working_days: number[]; // e.g., [1, 2, 3, 4, 5] for Mon-Fri
    
    // ═══ DAILY WORKING HOURS ═══
    work_start_time: string; // e.g., "09:00"
    work_end_time: string; // e.g., "18:00"
    
    // ═══ LUNCH/BREAK TIME ═══
    lunch_break_start?: string; // e.g., "13:00"
    lunch_break_end?: string; // e.g., "14:00"
    
    // ═══ PROJECT METHODOLOGY (for multi-session projects) ═══
    trip_structures?: {
      // e.g., "full_sleeve", "back_piece"
      [key: string]: {
        estimated_sessions: number; // Total sessions needed
        session_type: 'large' | 'small'; // Type of sessions for this project
        trip_breakdown: number[]; // e.g., [4, 3, 3] = 3 trips
        min_days_between_trips?: number; // Healing time between trips
      };
    };
    
    // ═══ BOOKING PREFERENCES ═══
    advance_booking_days?: number; // Minimum days in advance for booking
    max_advance_booking_days?: number; // Maximum days in advance
    cancellation_notice_hours?: number; // Minimum hours notice for cancellation
    
    // ═══ SPECIAL CONFIGURATIONS ═══
    accepts_walk_ins?: boolean;
    consultation_required?: boolean;
    consultation_duration_minutes?: number;
  };

  @Column({ type: 'jsonb' })
  style_preferences: {
    specialties: string[];
    refuses: string[];
    portfolio_highlights: string[];
  };

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instagram_handle: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true })
  google_calendar_config: {
    calendar_id?: string;
    access_token?: string;
    refresh_token?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  stripe_config: {
    account_id?: string;
    public_key?: string;
  };

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => Client, (client) => client.artist)
  clients: Client[];

  @OneToMany(() => PortfolioImage, (image) => image.artist)
  portfolio_images: PortfolioImage[];

  @OneToMany(() => Design, (design) => design.artist)
  designs: Design[];

  @OneToMany(() => Appointment, (appointment) => appointment.artist)
  appointments: Appointment[];

  @OneToMany(() => Payment, (payment) => payment.artist)
  payments: Payment[];
}
