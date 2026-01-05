# Healing Module

Post-session follow-up and healing checkpoint management.

## Responsibilities
- Automated healing checkpoint scheduling (Days 7, 14, 21)
- Photo collection and analysis
- Healing status tracking (pending → submitted → reviewed)
- Integration with portfolio (Day 21 photos)
- Problem detection and alerts

## Files
- `healing.module.ts` - Module definition
- `healing.service.ts` - Business logic
- `healing.controller.ts` - REST API endpoints
- `checkpoint-scheduler.service.ts` - Automated scheduling
- `photo-analyzer.service.ts` - Gemini Vision integration
- `dto/` - Data transfer objects
