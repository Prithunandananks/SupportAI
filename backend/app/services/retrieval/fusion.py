from typing import List, Dict, Any
import uuid
from app.schemas.search import HybridScoredPoint, HybridSearchResponse

def reciprocal_rank_fusion(
    vector_results: List[Any],
    bm25_results: List[List[Dict[str, Any]]],
    k: int = 60,
    limit: int = 5
) -> HybridSearchResponse:
    """
    Combines dense and lexical search results using Reciprocal Rank Fusion.
    vector_results: A list of Qdrant query_points responses (each contains .points).
    bm25_results: A list of lists of dicts with 'payload' from BM25Service.
    """
    fused_scores = {}
    payload_map = {}
    
    # 1. Process Dense Vector Results
    for vec_res in vector_results:
        if hasattr(vec_res, "points"):
            for rank, point in enumerate(vec_res.points):
                payload = point.payload or {}
                doc_id = payload.get("document_id")
                chunk_idx = payload.get("chunk_index")
                if doc_id is None or chunk_idx is None:
                    continue
                    
                uid = f"{doc_id}_{chunk_idx}"
                
                if uid not in fused_scores:
                    fused_scores[uid] = 0.0
                    payload_map[uid] = payload
                    
                fused_scores[uid] += 1.0 / (k + rank)
            
    # 2. Process Lexical BM25 Results
    for bm25_res_list in bm25_results:
        for rank, point_dict in enumerate(bm25_res_list):
            payload = point_dict.get("payload", {})
            doc_id = payload.get("document_id")
            chunk_idx = payload.get("chunk_index")
            if doc_id is None or chunk_idx is None:
                continue
                
            uid = f"{doc_id}_{chunk_idx}"
            
            if uid not in fused_scores:
                fused_scores[uid] = 0.0
                payload_map[uid] = payload
                
            fused_scores[uid] += 1.0 / (k + rank)
        
    # 3. Sort by fused score descending
    sorted_uids = sorted(fused_scores.keys(), key=lambda uid: fused_scores[uid], reverse=True)
    
    # 4. Take top 'limit'
    top_uids = sorted_uids[:limit]
    
    # 5. Build HybridSearchResponse
    hybrid_points = []
    for uid in top_uids:
        hybrid_points.append(
            HybridScoredPoint(
                id=str(uuid.uuid4()),
                score=fused_scores[uid],
                payload=payload_map[uid]
            )
        )
        
    return HybridSearchResponse(points=hybrid_points)
