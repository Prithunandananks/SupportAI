from unittest.mock import MagicMock, patch  # noqa: E402
mock_embed_provider = MagicMock()
mock_embed_provider.dimension = 384
patcher = patch("app.services.embedding.EmbeddingProviderFactory.create", return_value=mock_embed_provider)
patcher.start()


qdrant_patcher = patch("qdrant_client.AsyncQdrantClient", return_value=MagicMock())
qdrant_patcher.start()
