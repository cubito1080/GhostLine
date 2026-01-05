# AI Assistant Module

Gemini AI integration for conversational responses and function calling.

## Responsibilities
- Gemini AI API integration
- Context building from conversation history
- Response generation
- Function tool execution (check availability, generate payment links, etc.)
- Prompt management and optimization

## Files
- `assistant.service.ts` - Main orchestration
- `gemini.service.ts` - Gemini API wrapper
- `prompt.manager.ts` - Prompt templates and management
- `context-builder.service.ts` - Context construction
- `response-generator.service.ts` - Response generation
- `tools/` - Gemini function calling tools
