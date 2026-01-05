# Conversations Module

WhatsApp conversation state management and orchestration.

## Responsibilities
- Conversation lifecycle management
- State machine for conversation stages (8 stages)
- Context extraction and management
- Message history tracking
- Integration with AI assistant for responses

## Files
- `conversations.module.ts` - Module definition
- `conversations.service.ts` - Business logic
- `conversations.repository.ts` - Data access
- `state-machine.service.ts` - Conversation state transitions
- `context-extractor.service.ts` - Variable extraction from messages
- `dto/` - Data transfer objects
