# SupportAI - Production Readiness Checklist

This checklist must be reviewed before deploying SupportAI to a production environment.

## 1. Infrastructure & Databases
- [ ] **PostgreSQL**: Deployed in a managed service (e.g. AWS RDS, GCP Cloud SQL) with daily automated backups enabled.
- [ ] **Redis**: Deployed in a managed cache service. Eviction policy should be set appropriately (e.g., `allkeys-lru`).
- [ ] **Qdrant**: Volume persistence configured and mapped properly. Backups of the vector store are scheduled.
- [ ] **Migrations**: Alembic or a database migration tool is initialized and applied to production safely.

## 2. Environment Variables & Secrets
- [ ] `JWT_SECRET` is generated securely (at least 32 bytes of high entropy).
- [ ] `GROQ_API_KEY` is securely stored and restricted if possible.
- [ ] `DATABASE_URL`, `REDIS_URL`, and `QDRANT_URL` point to production hosts, not localhost.
- [ ] `ENVIRONMENT` is set strictly to `production`.
- [ ] `ALLOWED_ORIGINS` strictly contains only the production frontend domains.

## 3. Security
- [ ] **HTTPS / TLS**: Reverse proxy (Nginx, Traefik, ALB) enforces HTTPS. No traffic is served over raw HTTP.
- [ ] **Rate Limiting**: `slowapi` is enabled and configured with appropriate strict limits (`RATE_LIMIT_GLOBAL`).
- [ ] **CORS**: Verified that CORS does not use wildcards (`*`) in production.
- [ ] **File Uploads**: `MAX_UPLOAD_SIZE` is enforced and only specific MIME types are allowed in `documents.py`.

## 4. Performance & Reliability
- [ ] **Connection Pooling**: `DATABASE_POOL_SIZE` is tuned for the expected concurrent load and container instances.
- [ ] **Indexes**: Validated that `chat_sessions`, `chat_messages`, and `documents` have indexes on `user_id` and `created_at`.
- [ ] **Logging**: Structured JSON logging is capturing API metrics (latency, endpoints, errors) and is forwarded to a log aggregator (Datadog, ELK, CloudWatch).
- [ ] **Graceful Degradation**: Application handles Qdrant or Groq timeouts gracefully.

## 5. Deployment & CI/CD
- [ ] GitHub Actions are passing (Type Checks, Linting, Tests).
- [ ] Docker images are built securely (using non-root users where possible).
- [ ] Health Check endpoints (`/api/v1/health` and `/api/v1/ready`) are mapped to the load balancer target groups.
