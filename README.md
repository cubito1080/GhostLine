# Ghostline - Tattoo Artist AI Assistant Backend

An intelligent WhatsApp-based AI assistant that automates the complete business workflow for elite tattoo artists. The system handles client conversations, appointment scheduling, image processing, payment collection, and post-session healing checkpoints with semantic portfolio search.

## 🎯 Product Vision

Ghostline transforms tattoo artist operations into a fully automated, AI-powered system:

- **🤖 AI-Powered Conversations:** Gemini AI handles client inquiries, qualifications, and sales 24/7
- **📅 Smart Scheduling:** Automated appointment booking with Google Calendar sync and gap-filler queue
- **💳 Payment Processing:** Stripe integration for deposits and final payments
- **🎨 Portfolio Management:** Semantic search with pgvector embeddings (find "neo-japanese dragons")
- **🩹 Healing Checkpoints:** Automated follow-ups on days 7, 14, 21 with photo analysis
- **🚨 Crisis Management:** Gap-filler queue for cancelled appointments with priority matching
- **📊 Analytics:** Business metrics, conversion tracking, and revenue insights

## 🏗️ Clean Architecture

This project follows **NestJS Clean Architecture** principles with clear separation of concerns:

```
src/
├── modules/          # Business domain modules (one per bounded context)
│   ├── artists/      # Artist profile and configuration
│   ├── clients/      # Customer relationship management (CRM)
│   ├── conversations/# WhatsApp conversation state machine
│   ├── projects/     # Tattoo project lifecycle and pricing
│   ├── appointments/ # Scheduling and availability
│   ├── sessions/     # Individual tattoo sessions
│   ├── payments/     # Stripe payment processing
│   ├── healing/      # Post-session checkpoints (Days 7, 14, 21)
│   ├── portfolio/    # Semantic search + AI image analysis
│   ├── gap-filler/   # Emergency rebooking system
│   ├── whatsapp/     # WhatsApp Business API integration
│   ├── assistant/    # Gemini AI orchestration
│   ├── calendar/     # Google Calendar sync
│   ├── designs/      # Image storage and processing
│   ├── analytics/    # Business intelligence
│   └── notifications/# Multi-channel notifications
├── database/         # Data layer
│   ├── entities/     # TypeORM entities (14 tables)
│   ├── repositories/ # Custom repositories for complex queries
│   ├── migrations/   # Database migrations
│   └── seeds/        # Initial data
├── common/           # Cross-cutting concerns
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   ├── guards/       # Auth guards
│   ├── interceptors/ # Response transformers
│   └── pipes/        # Validation pipes
├── config/           # Configuration files (DB, Stripe, AWS, etc.)
└── shared/           # Shared utilities
    ├── services/     # Cache, Queue, Logger
    └── types/        # Enums, Interfaces, Constants
```

## 📊 Database Schema

14 interconnected tables with **TypeORM + PostgreSQL + pgvector**:

1. **artists** - Artist profiles with rates and methodology
2. **clients** - Client CRM (lead → prospect → active → completed)
3. **conversations** - WhatsApp conversation state (8-stage pipeline)
4. **messages** - Message history
5. **projects** - Multi-session tattoo projects with pricing
6. **appointments** - Scheduled appointments with status tracking
7. **sessions** - Individual tattoo sessions
8. **healing_checkpoints** - Post-session follow-ups (Days 7, 14, 21)
9. **portfolio_images** - Portfolio with 768D vector embeddings for semantic search
10. **designs** - Design files and stencils (S3 integration)
11. **payments** - Stripe payment tracking (deposit/final/tip)
12. **gap_filler_queue** - Emergency rebooking queue
13. **prospect_interactions** - Marketing analytics
14. **analytics_events** - General event tracking

**Key Features:**
- pgvector extension for semantic portfolio search
- Automated healing checkpoint scheduling
- Payment relationship tracking (client + artist)
- Vector similarity search for "find dragons in neo-japanese style"

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | NestJS 11 + TypeScript | Clean architecture, dependency injection |
| **Database** | PostgreSQL 15 + pgvector | Relational data + vector embeddings |
| **ORM** | TypeORM 0.3.19 | Type-safe database operations |
| **AI** | Google Gemini 1.5 Flash | Conversational AI + Vision API |
| **Payments** | Stripe | Payment processing + webhooks |
| **Storage** | AWS S3 | Image and design file storage |
| **Processing** | AWS Lambda (Go + OpenCV) | Stencil generation |
| **Calendar** | Google Calendar API | Appointment synchronization |
| **Messaging** | WhatsApp Business API | Client communication |
| **Cache** | Redis | Session caching, job queue |
| **Container** | Docker + Docker Compose | Development environment |

## 🔄 Critical Business Flows

### 1. WhatsApp Conversation Pipeline
```
Client Message → WhatsApp Webhook → NestJS
    ↓
Conversation Service (load state + history)
    ↓
Gemini AI (generate response with function calling)
    ↓
Execute Tools (check availability, generate payment link, search portfolio)
    ↓
Send Response → Update Conversation State → Save Message
```

### 2. Semantic Portfolio Search
```
User: "Show me neo-japanese dragons"
    ↓
Generate embedding from query (768D vector)
    ↓
pgvector similarity search: SELECT * WHERE embedding <-> query_vector ORDER BY distance
    ↓
Return top 10 matching images with metadata
```

### 3. Healing Checkpoint Automation
```
Session Completed
    ↓
Schedule 3 checkpoints (Day 7, 14, 21)
    ↓
[Day 7] Send WhatsApp: "How's healing? Send photo"
    ↓
Client sends photo → Gemini Vision analyzes
    ↓
[Day 21] Photo automatically added to portfolio with AI tags
```

### 4. Gap Filler Queue
```
Appointment Cancelled
    ↓
Find compatible projects in queue (matching duration, style)
    ↓
Notify top 3 matches via WhatsApp
    ↓
First to accept gets the slot → Update appointment
```

## 🐳 Quick Start with Docker

```bash
# 1. Clone and setup
git clone <repo>
cd backend-tattoo
cp .env.example .env

# 2. Edit .env with your API keys (minimum: GEMINI_API_KEY, WHATSAPP_ACCESS_TOKEN)

# 3. Start everything
docker-compose up -d

# 4. Check health
curl http://localhost:3000/health

# Database: localhost:5432
# Redis: localhost:6379
```

**That's it!** PostgreSQL with pgvector, NestJS, and Redis are running.

## 📦 Environment Variables

```env
# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=ghostline
DATABASE_PASSWORD=your_password
DATABASE_NAME=ghostline_tattoo

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=ghostline-tattoos
AWS_REGION=us-east-1

# Google Gemini
GEMINI_API_KEY=your_gemini_key

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Stripe
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

## � Development Commands

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f [backend|postgres|redis]

# Stop services  
docker-compose down

# Rebuild after code changes
docker-compose up -d --build backend

# Access database directly
docker-compose exec postgres psql -U ghostline -d ghostline_tattoo

# Run migrations
npm run typeorm:migration:run

# Generate new migration
npm run typeorm:migration:generate -- -n MigrationName

# Revert last migration
npm run typeorm:migration:revert

# Reset database (⚠️ deletes all data)
docker-compose down -v && docker-compose up -d
```

## 🏃 Running Locally (Without Docker)

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Run tests
npm run test
npm run test:e2e
npm run test:cov
```

## 📁 Module Overview

Each module follows the same structure for consistency:

```
module-name/
├── module-name.module.ts      # Module definition
├── module-name.service.ts     # Business logic
├── module-name.controller.ts  # REST API endpoints (if applicable)
├── module-name.repository.ts  # Custom database queries (optional)
├── dto/                       # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── query-*.dto.ts
└── README.md                  # Module documentation
```

### Core Business Modules

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **artists** | Artist management | Rates, methodology, style preferences, calendar config |
| **clients** | CRM | Status pipeline (lead → prospect → active), preferences |
| **conversations** | State machine | 8-stage conversation flow, context extraction |
| **projects** | Project lifecycle | Pricing calculations, multi-session planning |
| **appointments** | Scheduling | Availability checking, Google Calendar sync |
| **sessions** | Session tracking | Individual sessions within projects |
| **payments** | Payment processing | Stripe integration, deposit + final payment |
| **healing** | Post-session care | Automated checkpoints (Days 7, 14, 21) |
| **portfolio** | Portfolio + search | Semantic search with pgvector, AI image analysis |
| **gap-filler** | Emergency rebooking | Queue matching for cancelled appointments |
| **analytics** | Business intelligence | Metrics, events, conversion tracking |
| **notifications** | Multi-channel alerts | WhatsApp, email, template rendering |

### Integration Modules

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **whatsapp** | WhatsApp API | Webhook handling, message sending, signature validation |
| **assistant** | Gemini AI | Context building, response generation, function calling |
| **calendar** | Google Calendar | Event sync, OAuth token management |
| **designs** | File storage | S3 upload/download, Lambda stencil processing |

## 🔌 API Endpoints (Planned)

```
# Health Check
GET /health

# Artists
GET    /artists/:id
PATCH  /artists/:id
POST   /artists/:id/configure

# Clients
GET    /clients
GET    /clients/:id
POST   /clients
PATCH  /clients/:id

# Conversations
GET    /conversations/:clientId
POST   /conversations/:id/message

# Projects
GET    /projects
GET    /projects/:id
POST   /projects
POST   /projects/:id/calculate-pricing

# Appointments
GET    /appointments
POST   /appointments
POST   /appointments/check-availability
PATCH  /appointments/:id

# Payments
POST   /payments/create-intent
POST   /payments/webhook (Stripe)

# Portfolio
GET    /portfolio
POST   /portfolio/search
POST   /portfolio/upload

# WhatsApp
POST   /whatsapp/webhook
GET    /whatsapp/webhook (verification)

# Analytics
GET    /analytics/metrics
POST   /analytics/track-event
```

## 🧪 Testing Strategy

```bash
# Unit tests (services, repositories)
npm run test

# E2E tests (API endpoints)
npm run test:e2e

# Test coverage report
npm run test:cov
```

## 🚀 Deployment

Recommended platforms:
- **Railway** - Automatic deployments, PostgreSQL add-on
- **Render** - Free tier available, Docker support
- **AWS ECS/Fargate** - Production-grade with auto-scaling

### Deployment Checklist
- [ ] Set all environment variables
- [ ] Enable pgvector extension in PostgreSQL
- [ ] Run migrations: `npm run typeorm:migration:run`
- [ ] Configure Stripe webhooks
- [ ] Set up WhatsApp webhook URL
- [ ] Configure Google Calendar OAuth
- [ ] Set up AWS S3 bucket and IAM permissions

## 📚 Documentation

- [CHATBOT-FLOW.md](./CHATBOT-FLOW.md) - Conversation flow and business logic
- [LOGICA-TECNICA.md](./LOGICA-TECNICA.md) - Technical implementation details
- [DATABASE.md](./DATABASE.md) - Database schema documentation
- [SETUP.md](./SETUP.md) - Detailed setup instructions

Each module has its own `README.md` with specific documentation.

## 🎯 Roadmap

### Phase 1 - Foundation (Current)
- [x] Database schema with TypeORM
- [x] Docker development environment
- [x] Clean architecture structure
- [ ] Core entity services (artists, clients, conversations)

### Phase 2 - AI Integration
- [ ] Gemini AI conversation handling
- [ ] Function calling tools (availability, payments, portfolio search)
- [ ] Context management and prompt engineering

### Phase 3 - WhatsApp Integration
- [ ] Webhook processing
- [ ] Message state machine
- [ ] Template messages
- [ ] Media handling

### Phase 4 - Business Operations
- [ ] Stripe payment processing
- [ ] Google Calendar sync
- [ ] Appointment scheduling
- [ ] Gap-filler queue

### Phase 5 - Portfolio & Search
- [ ] Semantic search with pgvector
- [ ] Image analysis with Gemini Vision
- [ ] Automatic tagging
- [ ] Portfolio management

### Phase 6 - Automation
- [ ] Healing checkpoints scheduler
- [ ] Automated follow-ups
- [ ] Analytics and metrics
- [ ] Admin dashboard API

## 📝 License

MIT

---

**Built with ❤️ using Clean Architecture principles and NestJS best practices**
