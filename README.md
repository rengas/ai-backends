# Open Source AI Backend

Making common AI use cases easily accessible and customizable. Skip the heavy lifting of understanding OpenAI or other providers.

![AI Backend Architecture Diagram](images/ai-backend-diagram.png)

## Architecture

Hono is used to create the API.
Zod is used to validate the request and response schemas.
Multiple AI services (OpenAI, Ollama) are supported with intelligent service selection.

The codebase follows a modular design pattern:

- **src/routes/**: Each route is a separate module
- **src/services/**: AI service implementations (OpenAI, Ollama) with abstraction layer
- **src/config/**: Service configuration and management
- **src/utils/**: Shared utility functions and prompt templates
- **src/schemas/**: Shared Zod schemas

### Key Features

- **🔄 Unified Service Layer**: Single API that works with multiple AI providers
- **📝 Flexible Prompting**: Prompt templates that work with multiple AI services
- **🔧 Configurable Models**: Easy model selection and service configuration
- **⚡ Intelligent Fallbacks**: Automatic failover between services
- **🎯 Type Safety**: Full TypeScript support with Zod validation

## Available Endpoints

- **/api/summarize**: Summarize text
- **/api/translate**: Translate text
- **/api/sentiment**: Analyze sentiment
- **/api/keywords**: Extract keywords
- **/api/tweet**: Generate tweets
- **/api/services**: Manage AI service configuration
  - **/api/services/status**: Get service status
  - **/api/services/models**: Get available models
  - **/api/services/health/{service}**: Check service health

## Supported AI Services

### OpenAI
- Uses the official OpenAI TypeScript SDK
- Supports structured output with Zod schemas
- Requires API key configuration

### Ollama
- Connects to local or remote Ollama instances
- Supports structured output (JSON mode)
- Dynamic model selection
- Health checking and model enumeration

### Service Selection
The API automatically chooses the best available service or you can specify which service to use in your requests with the `service` parameter (`openai`, `ollama`, or `auto`).

## Environment Setup

This project supports multiple AI services: OpenAI and Ollama. You can use either or both services.

Create a `.env` file in the root directory of this project and configure your preferred AI services:

### OpenAI Configuration (Cloud-based)

```env
# OpenAI API Key (required for OpenAI service)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1
OPENAI_BASE_URL=custom-openai-base-url-optional
```

### Ollama Configuration (Self-hosted)

```env
# Ollama Configuration (for local/self-hosted models)
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_CHAT_MODEL=llama3.2
OLLAMA_TIMEOUT=30000
```

### General Configuration

```env
# API Access Token
DEFAULT_ACCESS_TOKEN=your-secret-api-key
```

### Complete .env Example

```env
# General Configuration
DEFAULT_ACCESS_TOKEN=your-secret-api-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1

# Ollama Configuration
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_CHAT_MODEL=llama3.2
OLLAMA_TIMEOUT=30000
```

**Important:** Make sure to add `.env` to your `.gitignore` file to avoid committing sensitive information to version control.

### Service Selection Details

The API automatically selects the best available service based on your configuration:
1. **OpenAI** (if `OPENAI_API_KEY` is set)
2. **Ollama** (if `OLLAMA_ENABLED=true` and service is reachable)

You can also specify which service to use in your API requests with the `service` parameter:
- `"service": "openai"` - Force OpenAI
- `"service": "ollama"` - Force Ollama  
- `"service": "auto"` - Auto-select (default)

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build
```

## Testing Examples

### Test the Summarize Endpoint

```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your long text to be summarized goes here.",
    "maxLength": 100,
    "service": "auto"
  }'
```

### Test the Tweet Endpoint

```bash
curl -X POST http://localhost:3000/api/tweet \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI and machine learning trends",
    "service": "ollama",
    "model": "llama3.2"
  }'
```

### Check Service Status

```bash
curl http://localhost:3000/api/services/status
```

### Get Available Models

```bash
curl http://localhost:3000/api/services/models?service=ollama
```

## API Documentation

API documentation is available at `/api/ui` when the server is running.
