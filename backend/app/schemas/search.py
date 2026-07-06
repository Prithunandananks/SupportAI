from typing import List, Dict, Any
from pydantic import BaseModel

class HybridScoredPoint(BaseModel):
    id: str
    score: float
    payload: Dict[str, Any]

class HybridSearchResponse(BaseModel):
    points: List[HybridScoredPoint]
