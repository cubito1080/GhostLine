// Update Artist Methodology DTO

export class UpdateArtistMethodologyDto {
  // Large session configuration
  large_session?: {
    duration_hours: number;
    max_per_day: number;
    requires_full_day: boolean;
  };

  // Small session configuration
  small_session?: {
    min_duration_hours: number;
    max_duration_hours: number;
    max_per_day: number;
    break_between_sessions_minutes: number;
  };

  // Working days (0=Sunday, 6=Saturday)
  working_days?: number[];

  // Daily schedule
  work_start_time?: string; // Format: "HH:MM"
  work_end_time?: string; // Format: "HH:MM"

  // Project trip structures
  trip_structures?: {
    [projectType: string]: {
      estimated_sessions: number;
      session_type: 'large' | 'small';
      trip_breakdown: number[];
      min_days_between_trips?: number;
    };
  };

  // Booking preferences
  advance_booking_days?: number;
  max_advance_booking_days?: number;
  cancellation_notice_hours?: number;

  // Special settings
  accepts_walk_ins?: boolean;
  consultation_required?: boolean;
  consultation_duration_minutes?: number;
}

// Example configurations for different artist types
export const METHODOLOGY_EXAMPLES = {
  // ═══════════════════════════════════════════════════════════════
  // 🎨 ROCKSTAR ARTIST (Large projects only)
  // ═══════════════════════════════════════════════════════════════
  rockstarArtist: {
    large_session: {
      duration_hours: 8,
      max_per_day: 1,
      requires_full_day: true, // No small sessions same day
    },
    small_session: {
      min_duration_hours: 1,
      max_duration_hours: 3,
      max_per_day: 0, // Doesn't do small sessions
      break_between_sessions_minutes: 0,
    },
    working_days: [1, 2, 3, 4], // Mon-Thu
    work_start_time: '10:00',
    work_end_time: '18:00',
    trip_structures: {
      full_sleeve: {
        estimated_sessions: 10,
        session_type: 'large',
        trip_breakdown: [4, 3, 3],
        min_days_between_trips: 21,
      },
      back_piece: {
        estimated_sessions: 15,
        session_type: 'large',
        trip_breakdown: [5, 5, 5],
        min_days_between_trips: 28,
      },
    },
    advance_booking_days: 30,
    max_advance_booking_days: 180,
    cancellation_notice_hours: 72,
    accepts_walk_ins: false,
    consultation_required: true,
    consultation_duration_minutes: 60,
  },

  // ═══════════════════════════════════════════════════════════════
  // ⚡ FLASH TATTOO ARTIST (Small sessions only)
  // ═══════════════════════════════════════════════════════════════
  flashArtist: {
    large_session: {
      duration_hours: 6,
      max_per_day: 0, // Doesn't do large sessions
      requires_full_day: true,
    },
    small_session: {
      min_duration_hours: 1,
      max_duration_hours: 3,
      max_per_day: 5, // Up to 5 small tattoos per day
      break_between_sessions_minutes: 15,
    },
    working_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
    work_start_time: '11:00',
    work_end_time: '20:00',
    trip_structures: {
      small_tattoo: {
        estimated_sessions: 1,
        session_type: 'small',
        trip_breakdown: [1],
        min_days_between_trips: 0,
      },
      medium_tattoo: {
        estimated_sessions: 2,
        session_type: 'small',
        trip_breakdown: [1, 1],
        min_days_between_trips: 14,
      },
    },
    advance_booking_days: 7,
    max_advance_booking_days: 60,
    cancellation_notice_hours: 24,
    accepts_walk_ins: true,
    consultation_required: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // 🔥 HYBRID ARTIST (Both large and small sessions)
  // ═══════════════════════════════════════════════════════════════
  hybridArtist: {
    large_session: {
      duration_hours: 6,
      max_per_day: 1,
      requires_full_day: true, // If large session, no small ones same day
    },
    small_session: {
      min_duration_hours: 1,
      max_duration_hours: 3,
      max_per_day: 3, // Up to 3 small sessions per day
      break_between_sessions_minutes: 30,
    },
    working_days: [1, 2, 3, 4, 5], // Mon-Fri
    work_start_time: '09:00',
    work_end_time: '18:00',
    trip_structures: {
      small_tattoo: {
        estimated_sessions: 1,
        session_type: 'small',
        trip_breakdown: [1],
      },
      half_sleeve: {
        estimated_sessions: 5,
        session_type: 'large',
        trip_breakdown: [3, 2],
        min_days_between_trips: 21,
      },
      full_sleeve: {
        estimated_sessions: 8,
        session_type: 'large',
        trip_breakdown: [4, 4],
        min_days_between_trips: 21,
      },
    },
    advance_booking_days: 14,
    max_advance_booking_days: 90,
    cancellation_notice_hours: 48,
    accepts_walk_ins: true, // Can fit walk-ins on "small session" days
    consultation_required: true,
    consultation_duration_minutes: 30,
  },

  // ═══════════════════════════════════════════════════════════════
  // 💼 FLEXIBLE ARTIST (Dynamic scheduling)
  // ═══════════════════════════════════════════════════════════════
  flexibleArtist: {
    large_session: {
      duration_hours: 7,
      max_per_day: 1,
      requires_full_day: false, // Can do 1 large + 1 small if time permits
    },
    small_session: {
      min_duration_hours: 0.5,
      max_duration_hours: 2.5,
      max_per_day: 4,
      break_between_sessions_minutes: 20,
    },
    working_days: [2, 3, 4, 5, 6], // Tue-Sat
    work_start_time: '10:00',
    work_end_time: '19:00',
    trip_structures: {
      micro_tattoo: {
        estimated_sessions: 1,
        session_type: 'small',
        trip_breakdown: [1],
      },
      small_piece: {
        estimated_sessions: 2,
        session_type: 'small',
        trip_breakdown: [1, 1],
        min_days_between_trips: 7,
      },
      medium_piece: {
        estimated_sessions: 3,
        session_type: 'large',
        trip_breakdown: [2, 1],
        min_days_between_trips: 14,
      },
    },
    advance_booking_days: 10,
    max_advance_booking_days: 120,
    cancellation_notice_hours: 36,
    accepts_walk_ins: true,
    consultation_required: false,
  },
};

// ═══════════════════════════════════════════════════════════════
// 🤖 VALIDATION LOGIC EXAMPLES
// ═══════════════════════════════════════════════════════════════

export const VALIDATION_SCENARIOS = {
  // Scenario 1: Artist with large session booked - block all small sessions
  largeSessionDay: `
    Day Schedule: Monday
    Booked: 1 Large Session (10:00-18:00, 8 hours)
    
    Validation:
    - ✅ Large session allowed (max_per_day: 1)
    - ❌ No small sessions allowed (requires_full_day: true)
    - Result: "You already have a large session scheduled. No more appointments today."
  `,

  // Scenario 2: Artist with 3 small sessions - can fit 1 more
  smallSessionsDay: `
    Day Schedule: Tuesday
    Booked: 
      - Small Session 1 (09:00-11:00, 2h)
      - Small Session 2 (11:30-13:30, 2h)
      - Small Session 3 (14:30-16:30, 2h)
    
    Validation:
    - Current: 3 small sessions
    - Max allowed: 4 small sessions
    - ✅ Can book 1 more small session
    - ❌ Cannot book large session (would exceed working hours + breaks)
    - Available slots: 16:50-18:00 (1h 10min - too short for standard 2h)
  `,

  // Scenario 3: Hybrid artist - can choose type of day
  hybridChoice: `
    Day Schedule: Wednesday (Empty)
    
    Option A: Book as "Large Session Day"
      - ✅ Book 1 large session (6-8 hours)
      - ❌ No small sessions allowed
      
    Option B: Book as "Small Session Day"
      - ❌ No large sessions
      - ✅ Book up to 3 small sessions (with 30min breaks)
  `,

  // Scenario 4: Flexible artist - can mix
  flexibleMix: `
    Day Schedule: Thursday
    methodology.large_session.requires_full_day: false
    
    Allowed combinations:
    - ✅ 1 large (7h) + 1 small (1-2h) if time permits
    - ✅ 4 small sessions (no large)
    - ✅ 1 large session only
    
    Example: 10:00-17:00 (large) + 17:30-18:30 (small 1h touch-up)
  `,
};
