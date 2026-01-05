# Shared Module

Shared services and utilities used across modules.

## Services
- `cache.service.ts` - Redis caching
- `queue.service.ts` - Job queue management (Bull/BullMQ)
- `logger.service.ts` - Custom logging
- `file-upload.service.ts` - Multipart file handling

## Types
- `enums.ts` - Shared enumerations
- `interfaces.ts` - Common interfaces
- `constants.ts` - Application constants

## Files Structure
```
shared/
├── services/
│   ├── cache.service.ts
│   ├── queue.service.ts
│   ├── logger.service.ts
│   └── file-upload.service.ts
├── types/
│   ├── enums.ts
│   ├── interfaces.ts
│   └── constants.ts
└── shared.module.ts
```
