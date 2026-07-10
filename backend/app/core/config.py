from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str

    REDIS_URL: str
    QDRANT_URL: str
    GROQ_API_KEY: str
    JWT_SECRET: str
    LLM_MODEL: str

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    QDRANT_COLLECTION_NAME: str = "knowledge_base"

    EMBEDDING_PROVIDER: str = "sentence-transformers"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MAX_HISTORY_MESSAGES: int = 10
    MAX_MESSAGE_LENGTH: int = 1000
    
    ENABLE_QUERY_REWRITING: bool = True
    ENABLE_MULTI_QUERY: bool = True
    MAX_RETRIEVAL_QUERIES: int = 3
    
    # Production configurations
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    RATE_LIMIT_GLOBAL: str = "100/minute"
    STREAM_TIMEOUT: int = 60
    DATABASE_POOL_SIZE: int = 20
    QDRANT_TIMEOUT: int = 10

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
