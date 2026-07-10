# SupportAI

SupportAI is a production-ready Retrieval-Augmented Generation (RAG) backend and frontend that provides intelligent document-based customer support. It leverages modern architecture components like FastAPI, React, PostgreSQL, and Qdrant.

## Architecture Overview

- **Frontend**: React + TypeScript + Vite + TailwindCSS. Uses HTTP Polling and Server-Sent Events (SSE) for streaming chat.
- **Backend**: FastAPI with async SQLAlchemy and asyncpg.
- **Database**: PostgreSQL for relational storage (users, chat sessions, documents).
- **Vector Store**: Qdrant for semantic chunk storage and hybrid retrieval.
- **Cache**: Redis for temporary session state and rate limiting.
- **LLM Engine**: Groq API for ultra-fast generation.

## Environment Variables

Ensure the following are set in your production environment (or `.env`):

| Variable | Description | Example |
|---|---|---|
| `ENVIRONMENT` | Must be `production` | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:5432/db` |
| `REDIS_URL` | Redis cache URL | `redis://localhost:6379/0` |
| `QDRANT_URL` | Qdrant host URL | `http://localhost:6333` |
| `GROQ_API_KEY` | Your Groq API Key | `gsk_...` |
| `JWT_SECRET` | 32+ byte string for JWT auth | `super_secret` |
| `ALLOWED_ORIGINS` | Comma-separated frontend domains | `https://app.example.com` |
| `MAX_UPLOAD_SIZE` | Max file upload size in bytes | `10485760` (10MB) |
| `RATE_LIMIT_GLOBAL` | Default global API rate limit | `100/minute` |

## Deployment Guide

### Using Docker Compose
1. Ensure Docker and Docker Compose are installed.
2. Clone the repository and configure your `.env` file (see `.env.example`).
3. Run the complete stack:
   ```bash
   docker-compose up -d --build
   ```
4. Apply database migrations (assuming alembic is set up):
   ```bash
   docker-compose exec backend alembic upgrade head
   ```
5. The application will be available at `http://localhost:80` (Frontend) and `http://localhost:8000` (Backend API).

### Production Checklist
Please refer to `PRODUCTION_CHECKLIST.md` before finalizing any live deployments.
