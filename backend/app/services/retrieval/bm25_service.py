import uuid
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
from app.db.qdrant import qdrant_db
from app.core.config import settings
from app.core.logger import logger

class BM25Service:
    def __init__(self):
        self.corpus = []
        self.payloads = []
        self.bm25 = None

    def add_chunks(self, chunks: List[Any]):
        """Add chunks to the BM25 index."""
        for chunk in chunks:
            if hasattr(chunk, "text"):
                text = chunk.text
                payload = {"text": chunk.text, **chunk.metadata.model_dump()}
            else:
                text = chunk.get("text", "")
                payload = chunk
                
            tokens = text.lower().split()
            self.corpus.append(tokens)
            self.payloads.append(payload)
            
        if self.corpus:
            self.bm25 = BM25Okapi(self.corpus)

    async def initialize_from_db(self):
        """Fetch all chunks from persistent storage to hydrate the in-memory BM25 index."""
        logger.info("Hydrating BM25 index from Qdrant...")
        try:
            scroll_result = await qdrant_db.client.scroll(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                limit=10000,
                with_payload=True,
                with_vectors=False
            )
            points = scroll_result[0]
            
            raw_payloads = [point.payload for point in points if point.payload]
            if raw_payloads:
                self.add_chunks(raw_payloads)
                logger.info(f"Successfully hydrated {len(raw_payloads)} documents into BM25 index.")
            else:
                logger.info("No existing documents found in Qdrant for BM25 hydration.")
        except Exception as e:
            logger.error(f"Failed to hydrate BM25 index: {e}")

    async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Return a ranked list of pseudo-points based on BM25 scores."""
        if not self.bm25 or not self.corpus:
            return []
            
        tokens = query.lower().split()
        
        # Run blocking BM25 calculation in a separate thread
        import asyncio
        scores = await asyncio.to_thread(self.bm25.get_scores, tokens)
        
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:limit]
        
        results = []
        for i in top_indices:
            score = scores[i]
            if score > 0:
                payload = self.payloads[i]
                # Provide a unique ID for the result struct
                point_id = str(uuid.uuid4())
                results.append({
                    "id": point_id,
                    "score": float(score),
                    "payload": payload
                })
                
        return results

bm25_service = BM25Service()
