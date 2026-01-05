# Gap Filler Module

Emergency appointment rebooking and slot optimization.

## Responsibilities
- Gap filler queue management
- Automatic matching when appointments are cancelled
- Client notification for available slots
- Priority-based slot allocation
- Queue status tracking (pending → offered → accepted → rejected)

## Files
- `gap-filler.module.ts` - Module definition
- `gap-filler.service.ts` - Business logic
- `gap-filler.controller.ts` - REST API endpoints
- `queue-matcher.service.ts` - Matching algorithm
- `notification-dispatcher.service.ts` - Send slot offers
- `dto/` - Data transfer objects
