# Architecture Overview

## Project Structure

This document provides a comprehensive overview of the Ghostline backend architecture, following Clean Architecture and Domain-Driven Design principles.

## Directory Structure

```
backend-tattoo/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── common/                    # Cross-cutting concerns
│   │   ├── decorators/            # Custom decorators
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth guards
│   │   ├── interceptors/          # Response transformers, logging
│   │   ├── pipes/                 # Validation pipes
│   │   └── utils/                 # Utility functions
│   │
│   ├── config/                    # Configuration files
│   │   ├── database.config.ts     # Database configuration
│   │   ├── stripe.config.ts       # Stripe configuration
│   │   ├── aws.config.ts          # AWS S3/Lambda configuration
│   │   ├── google.config.ts       # Google Calendar configuration
│   │   ├── whatsapp.config.ts     # WhatsApp API configuration
│   │   ├── gemini.config.ts       # Gemini AI configuration
│   │   ├── redis.config.ts        # Redis configuration
│   │   └── env.validation.ts      # Environment variable validation
│   │
│   ├── database/                  # Data access layer
│   │   ├── entities/              # TypeORM entities (14 tables)
│   │   │   ├── artist.entity.ts
│   │   │   ├── client.entity.ts
│   │   │   ├── conversation.entity.ts
│   │   │   ├── message.entity.ts
│   │   │   ├── project.entity.ts
│   │   │   ├── appointment.entity.ts
│   │   │   ├── session.entity.ts
│   │   │   ├── healing-checkpoint.entity.ts
│   │   │   ├── portfolio-image.entity.ts
│   │   │   ├── design.entity.ts
│   │   │   ├── payment.entity.ts
│   │   │   ├── gap-filler-queue.entity.ts
│   │   │   ├── prospect-interaction.entity.ts
│   │   │   └── analytics-event.entity.ts
│   │   │
│   │   ├── repositories/          # Custom repositories
│   │   │   ├── base.repository.ts
│   │   │   ├── artist.repository.ts
│   │   │   ├── client.repository.ts
│   │   │   ├── conversation.repository.ts
│   │   │   ├── appointment.repository.ts
│   │   │   ├── portfolio-image.repository.ts
│   │   │   ├── gap-filler-queue.repository.ts
│   │   │   └── analytics.repository.ts
│   │   │
│   │   ├── migrations/            # Database migrations
│   │   │   └── 1704499200000-InitialSchema.ts
│   │   │
│   │   ├── seeds/                 # Seed data
│   │   │   ├── artist.seed.ts
│   │   │   └── test-clients.seed.ts
│   │   │
│   │   ├── database.module.ts     # Database module
│   │   └── data-source.ts         # TypeORM DataSource
│   │
│   ├── modules/                   # Business domain modules
│   │   │
│   │   ├── artists/               # Artist management
│   │   │   ├── artists.module.ts
│   │   │   ├── artists.service.ts
│   │   │   ├── artists.controller.ts
│   │   │   └── dto/
│   │   │
│   │   ├── clients/               # Client CRM
│   │   │   ├── clients.module.ts
│   │   │   ├── clients.service.ts
│   │   │   ├── clients.controller.ts
│   │   │   └── dto/
│   │   │
│   │   ├── conversations/         # Conversation state machine
│   │   │   ├── conversations.module.ts
│   │   │   ├── conversations.service.ts
│   │   │   ├── state-machine.service.ts
│   │   │   ├── context-extractor.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── projects/              # Tattoo project lifecycle
│   │   │   ├── projects.module.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── projects.controller.ts
│   │   │   ├── pricing.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── appointments/          # Appointment scheduling
│   │   │   ├── appointments.module.ts
│   │   │   ├── appointments.service.ts
│   │   │   ├── appointments.controller.ts
│   │   │   ├── availability.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── sessions/              # Session tracking
│   │   │   ├── sessions.module.ts
│   │   │   ├── sessions.service.ts
│   │   │   ├── sessions.controller.ts
│   │   │   └── dto/
│   │   │
│   │   ├── payments/              # Payment processing
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── stripe.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── healing/               # Healing checkpoints
│   │   │   ├── healing.module.ts
│   │   │   ├── healing.service.ts
│   │   │   ├── healing.controller.ts
│   │   │   ├── checkpoint-scheduler.service.ts
│   │   │   ├── photo-analyzer.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── portfolio/             # Portfolio + semantic search
│   │   │   ├── portfolio.module.ts
│   │   │   ├── portfolio.service.ts
│   │   │   ├── portfolio.controller.ts
│   │   │   ├── semantic-search.service.ts
│   │   │   ├── image-analyzer.service.ts
│   │   │   ├── embedding.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── gap-filler/            # Gap-filler queue
│   │   │   ├── gap-filler.module.ts
│   │   │   ├── gap-filler.service.ts
│   │   │   ├── gap-filler.controller.ts
│   │   │   ├── queue-matcher.service.ts
│   │   │   ├── notification-dispatcher.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── whatsapp/              # WhatsApp integration
│   │   │   ├── whatsapp.module.ts
│   │   │   ├── whatsapp.controller.ts
│   │   │   ├── whatsapp.service.ts
│   │   │   ├── webhook-validator.service.ts
│   │   │   ├── message-handler.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── assistant/             # Gemini AI
│   │   │   ├── assistant.module.ts
│   │   │   ├── assistant.service.ts
│   │   │   ├── gemini.service.ts
│   │   │   ├── prompt.manager.ts
│   │   │   ├── context-builder.service.ts
│   │   │   ├── response-generator.service.ts
│   │   │   └── tools/             # Function calling tools
│   │   │       ├── check-availability.tool.ts
│   │   │       ├── generate-payment-link.tool.ts
│   │   │       ├── search-portfolio.tool.ts
│   │   │       ├── calculate-pricing.tool.ts
│   │   │       └── schedule-appointment.tool.ts
│   │   │
│   │   ├── calendar/              # Google Calendar
│   │   │   ├── calendar.module.ts
│   │   │   ├── calendar.service.ts
│   │   │   ├── google-calendar.service.ts
│   │   │   ├── appointment.repository.ts
│   │   │   └── dto/
│   │   │
│   │   ├── designs/               # File storage
│   │   │   ├── designs.module.ts
│   │   │   ├── designs.controller.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── processing.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── analytics/             # Business intelligence
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── events.service.ts
│   │   │   ├── metrics.service.ts
│   │   │   └── dto/
│   │   │
│   │   └── notifications/         # Multi-channel notifications
│   │       ├── notifications.module.ts
│   │       ├── notifications.service.ts
│   │       ├── whatsapp-sender.service.ts
│   │       ├── email-sender.service.ts
│   │       ├── template-renderer.service.ts
│   │       ├── templates/
│   │       └── dto/
│   │
│   └── shared/                    # Shared utilities
│       ├── shared.module.ts
│       ├── services/
│       │   ├── cache.service.ts
│       │   ├── queue.service.ts
│       │   ├── logger.service.ts
│       │   └── file-upload.service.ts
│       └── types/
│           ├── enums.ts
│           ├── interfaces.ts
│           └── constants.ts
│
├── docker-compose.yml             # Docker orchestration
├── Dockerfile                     # Container definition
├── .env.example                   # Environment template
└── README.md                      # Project documentation
```

## Architectural Principles

### 1. Separation of Concerns
Each module handles a specific business domain with clear boundaries.

### 2. Dependency Injection
NestJS DI container manages dependencies, improving testability.

### 3. Repository Pattern
Data access is abstracted through repositories, separating business logic from database queries.

### 4. DTO Validation
All input is validated using class-validator decorators.

### 5. Single Responsibility
Each service class has one clear purpose.

## Data Flow

### Typical Request Flow
```
HTTP Request → Controller → Service → Repository → Database
                    ↓
            DTO Validation
                    ↓
            Business Logic
                    ↓
            Response DTO
```

### WhatsApp Webhook Flow
```
WhatsApp API → Webhook Validator → Message Handler → Conversation Service
                                                              ↓
                                                      AI Assistant Service
                                                              ↓
                                                      Gemini AI API
                                                              ↓
                                                      Function Tools
                                                              ↓
                                                      Response Generator
                                                              ↓
                                                      WhatsApp Sender
```

## Module Dependencies

```
app.module
├── DatabaseModule (global)
├── ConfigModule (global)
├── SharedModule (global)
├── ArtistsModule
├── ClientsModule
├── ConversationsModule
│   └── depends on: Clients, Messages
├── ProjectsModule
│   └── depends on: Clients, Artists
├── AppointmentsModule
│   └── depends on: Calendar, Projects
├── PaymentsModule
│   └── depends on: Projects, Clients
├── HealingModule
│   └── depends on: Sessions, Portfolio, Notifications
├── PortfolioModule
│   └── depends on: Artists, Designs
├── GapFillerModule
│   └── depends on: Appointments, Clients, Notifications
├── WhatsAppModule
│   └── depends on: Conversations, Assistant
├── AssistantModule
│   └── depends on: Conversations, Portfolio, Payments, Appointments
├── CalendarModule
│   └── depends on: Appointments
├── DesignsModule
│   └── depends on: Artists
├── AnalyticsModule
└── NotificationsModule
```

## Next Steps

1. Implement core services (artists, clients, conversations)
2. Set up Gemini AI integration
3. Implement WhatsApp webhook handling
4. Add Stripe payment processing
5. Implement semantic search with pgvector
6. Build healing checkpoint automation
7. Complete gap-filler queue logic
8. Add analytics and metrics
