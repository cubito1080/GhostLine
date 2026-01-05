# WhatsApp Module

WhatsApp Business API integration and webhook handling.

## Responsibilities
- WhatsApp webhook event processing
- Message sending (text, images, templates)
- Webhook signature validation
- Message status tracking
- Integration with conversation module

## Files
- `whatsapp.module.ts` - Module definition
- `whatsapp.controller.ts` - Webhook endpoints
- `whatsapp.service.ts` - WhatsApp API integration
- `webhook-validator.service.ts` - Signature validation
- `message-handler.service.ts` - Message processing
- `dto/` - Data transfer objects
