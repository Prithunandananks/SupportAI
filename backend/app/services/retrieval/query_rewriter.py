import json
import logging
from typing import List, Optional
from app.services.llm.llm_factory import LLMFactory
from app.models.chat import ChatMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

class QueryRewriter:
    """
    Rewrites ambiguous user questions into clearer retrieval queries.
    Also handles multi-query generation for robust retrieval.
    """
    def __init__(self):
        self.llm = LLMFactory.get_llm()

    async def rewrite_and_generate_queries(
        self, question: str, history: Optional[List[ChatMessage]] = None
    ) -> List[str]:
        if not settings.ENABLE_QUERY_REWRITING and not settings.ENABLE_MULTI_QUERY:
            return [question]
            
        history_text = ""
        if history:
            # Only use the most recent history to avoid overloading the prompt
            recent_history = history[-4:]
            for msg in recent_history:
                role = "User" if msg.role == "user" else "Assistant"
                history_text += f"{role}: {msg.content}\n"

        prompt = f"""
You are an expert search query generator.
Your task is to rewrite the user's question into clearer search queries to improve retrieval from a vector database and BM25 index.

User Question: {question}
"""
        if history_text:
            prompt += f"\nRecent Conversation History:\n{history_text}\n"
            
        prompt += """
Based on the question (and history if available), generate retrieval queries.
Generate exactly up to 3 queries:
1. The original question (or a direct, grammatically corrected version).
2. A rewritten question that incorporates necessary context from the history to make it standalone.
3. A semantic variation using synonyms or alternative phrasing.

If rewriting provides no benefit, just return the original question.
Return ONLY a JSON list of strings. Do not include markdown formatting or explanations.
Example: ["original query", "rewritten with context", "semantic variation"]
"""
        queries = [question]
        try:
            response = await self.llm.generate(prompt)
            cleaned_response = response.replace("```json", "").replace("```", "").strip()
            generated_queries = json.loads(cleaned_response)
            
            if isinstance(generated_queries, list):
                for q in generated_queries:
                    q = str(q).strip()
                    if q and q.lower() not in [existing.lower() for existing in queries]:
                        queries.append(q)
        except Exception as e:
            logger.error(f"Error generating queries: {e}", exc_info=True)
            
        if not settings.ENABLE_MULTI_QUERY:
            # If multi-query is disabled, just return the best rewritten query (if available)
            if len(queries) > 1 and settings.ENABLE_QUERY_REWRITING:
                return [queries[1]]
            return [queries[0]]

        # Limit to configured max
        return queries[:settings.MAX_RETRIEVAL_QUERIES]
