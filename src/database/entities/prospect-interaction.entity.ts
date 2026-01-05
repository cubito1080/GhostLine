import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('prospect_interactions')
@Index(['artist_id', 'whatsapp_number'])
export class ProspectInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  artist_id: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  whatsapp_number: string;

  @Column({
    type: 'enum',
    enum: [
      'initial_message',
      'follow_up',
      'portfolio_search',
      'abandoned_cart',
      'gap_filler_notification',
    ],
  })
  interaction_type:
    | 'initial_message'
    | 'follow_up'
    | 'portfolio_search'
    | 'abandoned_cart'
    | 'gap_filler_notification';

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    message_content?: string;
    search_query?: string;
    abandoned_at_stage?: string;
    gap_filler_slot?: {
      date: string;
      duration: number;
    };
  };

  @CreateDateColumn()
  @Index()
  created_at: Date;
}
