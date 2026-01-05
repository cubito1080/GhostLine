# Payments Module

Payment processing and Stripe integration.

## Responsibilities
- Payment intent creation
- Payment status tracking (pending → succeeded → failed → refunded)
- Deposit management
- Stripe webhook handling
- Payment history and receipts

## Files
- `payments.module.ts` - Module definition
- `payments.service.ts` - Business logic
- `payments.controller.ts` - REST API + Stripe webhooks
- `stripe.service.ts` - Stripe SDK wrapper
- `dto/` - Data transfer objects
