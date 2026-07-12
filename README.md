# SupportAI

SupportAI is an enterprise-grade AI chatbot and administration portal, providing Retrieval-Augmented Generation (RAG) powered conversational support with professional administrative capabilities.

## Features

- **Professional Chat Interface:** A sleek, modern chat UI with streaming responses, code highlighting, copy features, session management, and persistent history.
- **RAG Pipeline:** Integrates with Qdrant and Groq LLMs (via Langchain) for semantic search over uploaded corporate documents, injecting precise knowledge into LLM responses.
- **Admin Dashboard:** Comprehensive admin suite with user analytics, conversation tracking, and document ingestion management.
- **Secure Authentication:** JWT-based user authentication and Role-Based Access Control (RBAC) ensuring strict separation between Customers and Admins.
- **Production-Ready Quality:** Thoroughly tested (Vitest frontend, Pytest backend), structured logging, rate limiting, secure file validation, and optimized build.

## Technology Stack

- **Backend:** FastAPI, SQLAlchemy (SQLite), Qdrant (Vector DB), Pydantic, Pytest
- **Frontend:** React, TypeScript, Vite, TailwindCSS, Vitest, Lucide-React
- **AI / ML:** Sentence Transformers (Embeddings), Groq (LLM), Langchain

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Virtual Environment

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Backend Configuration
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
QDRANT_COLLECTION_NAME=supportai_knowledge
EMBEDDING_PROVIDER=sentence-transformers
EMBEDDING_MODEL=all-MiniLM-L6-v2
CORS_ORIGINS=["http://localhost:5173"]
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # On Windows PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```
The backend API runs on `http://localhost:8000`.

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The frontend runs on `http://localhost:5173`.

## Testing

### Backend
Integration tests run with Pytest. Make sure the virtual environment is activated.
```bash
pytest -v tests/test_integration.py
```

### Frontend
Frontend tests use Vitest and focus on utility functions and interaction hooks.
```bash
npm run test
```

## Architecture

SupportAI is designed as a monolithic API service interacting with a decoupled front-end single-page application.
The RAG architecture utilizes `SentenceTransformers` for embedding ingestion and searches vectors using `Qdrant`. Responses are generated contextually utilizing the `Groq` API and returned to the client using Server-Sent Events (SSE).

## API Overview
- `POST /api/v1/auth/register` - Create a new user.
- `POST /api/v1/auth/login` - Obtain JWT token.
- `POST /api/v1/documents/upload` - Securely upload documents (Admin only).
- `GET /api/v1/documents/` - List documents (Admin only).
- `POST /api/v1/chat/` - Create conversational responses using SSE.
- `GET /api/v1/chat/history` - Retrieve session history.

## Security Practices
- JWT strictly validated per-request
- Strong file upload validation (Extension whitelist, MIME check, limit max file size)
- Request ID tracing for observability
- Scrubbed API error traces to prevent information leaks
