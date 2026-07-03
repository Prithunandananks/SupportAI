from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str

    @property
    def is_development(self):
        return self.ENVIRONMENT == "development"
    REDIS_URL: str
    QDRANT_URL: str
    GROQ_API_KEY: str
    JWT_SECRET: str

    @property
    def is_development(self):
        return self.ENVIRONMENT == "development"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    QDRANT_COLLECTION_NAME: str = "knowledge_base"

    EMBEDDING_PROVIDER: str = "sentence-transformers"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200


settings = Settings()
