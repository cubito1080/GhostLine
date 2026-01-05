# Portfolio Module

Artist portfolio management with AI-powered semantic search.

## Responsibilities
- Portfolio image management
- Automatic image analysis with Gemini Vision
- Tag extraction and categorization
- Semantic search using pgvector embeddings (768 dimensions)
- Image metadata and analytics
- Integration with healing checkpoints (Day 21 photos)

## Files
- `portfolio.module.ts` - Module definition
- `portfolio.service.ts` - Business logic
- `portfolio.controller.ts` - REST API endpoints
- `semantic-search.service.ts` - Vector similarity search
- `image-analyzer.service.ts` - Gemini Vision analysis
- `embedding.service.ts` - Generate embeddings for search
- `dto/` - Data transfer objects
