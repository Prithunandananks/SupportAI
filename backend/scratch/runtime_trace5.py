import asyncio
from app.db.session import AsyncSessionLocal
from app.services.retrieval.rag_pipeline import RAGPipeline
from app.api.deps import _embedding_service
from app.db.qdrant import qdrant_db
from app.repositories.document_repo import DocumentRepository
from app.services.retrieval.prompt_builder import PromptBuilder
from app.services.search import SearchService
from app.core.config import settings

async def main():
    repo = DocumentRepository(client=qdrant_db.client, collection_name=settings.QDRANT_COLLECTION_NAME)
    search_service = SearchService(embedding=_embedding_service, repo=repo)
    
    question = 'What is the refund policy?'
    rag_pipeline = RAGPipeline(search_service=search_service)
    
    print('--- RAG Pipeline Flow Trace ---')
    
    queries = await rag_pipeline.query_rewriter.rewrite_and_generate_queries(question, [])
    search_results = await search_service.search(queries)
    
    print(f'- Retrieved chunk count: {len(search_results.points)}')
    if not search_results.points:
        print('Data disappeared! Zero chunks retrieved.')
        return
        
    contexts = []
    for result in search_results.points:
        payload = result.payload or {}
        print(f'- Payload keys: {list(payload.keys())}')
        
        text = payload.get('text', '')
        print(f'- Text length: {len(text)}')
        
        if not text:
            print('Data disappeared! Text is empty.')
            return
            
        contexts.append(text)
        
    print(f'- Context length: {len(contexts)}')
    
    prompt = PromptBuilder.build_prompt(
        question=question,
        contexts=contexts,
        history=[],
    )
    if not prompt:
        print('Data disappeared! Prompt is empty.')
        
if __name__ == '__main__':
    asyncio.run(main())
