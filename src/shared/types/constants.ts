// Application constants

export const APP_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
  },

  // File upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Healing checkpoints
  CHECKPOINT_DAYS: [7, 14, 21],

  // WhatsApp
  WHATSAPP_API_VERSION: 'v18.0',

  // Stripe
  STRIPE_API_VERSION: '2023-10-16',
};

export const ERROR_MESSAGES = {
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  PAYMENT_FAILED: 'Payment processing failed',
  APPOINTMENT_CONFLICT: 'Appointment time conflict',
};
