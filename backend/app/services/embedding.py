from abc import ABC, abstractmethod
from typing import List


class EmbeddingProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Return the vector dimension for this provider/model combination."""
        pass

    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        pass

    @abstractmethod
    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass


class SentenceTransformerProvider(EmbeddingProvider):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer

        self._model_name = model_name
        self._model = SentenceTransformer(self._model_name)
        # SentenceTransformers models usually expose their dimension via the pooling layer
        self._dimension = self._model.get_sentence_embedding_dimension()

    @property
    def provider_name(self) -> str:
        return "sentence-transformers"

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def dimension(self) -> int:
        return self._dimension

    async def embed_text(self, text: str) -> List[float]:
        # Utilizing synchronous inference natively;
        # In heavy production this could be dispatched to an executor.
        return self._model.encode(text).tolist()

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._model.encode(texts).tolist()


class EmbeddingProviderFactory:
    @staticmethod
    def create(provider_name: str, model_name: str) -> EmbeddingProvider:
        if provider_name == "sentence-transformers":
            return SentenceTransformerProvider(model_name=model_name)
        else:
            raise NotImplementedError(
                f"Embedding provider '{provider_name}' is not supported."
            )


class EmbeddingService:
    def __init__(self, provider: EmbeddingProvider):
        self.provider = provider

    async def embed_text(self, text: str) -> List[float]:
        return await self.provider.embed_text(text)

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return await self.provider.embed_documents(texts)
