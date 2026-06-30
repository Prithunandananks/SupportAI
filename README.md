# SupportAI

SupportAI is an AI-powered customer support platform.

## Architecture

- **Backend**: FastAPI, PostgreSQL, Redis, Qdrant
- **Frontend**: React + TypeScript
- **AI**: Groq

## Development Setup

1. Create a `.env` file based on `.env.example`.
2. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Verify the health of the services by visiting `http://localhost:8000/ready`.
