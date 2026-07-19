# BM25 Scaling Assessment

## Overview
SupportAI currently uses a naive in-memory BM25 implementation for full-text search, alongside Qdrant for vector search. As the platform scales to support enterprise multi-tenant workloads, we must assess the long-term viability of this architecture and plan for future state.

This document evaluates the current architecture against potential alternatives for BM25 (sparse/keyword search).

## Alternatives Evaluated

### A. Current BM25 (In-Memory Python)
Our current implementation uses a pure Python BM25 implementation running inside the application processes.
- **Complexity:** Very Low (no external dependencies).
- **Cost:** Low (no extra infrastructure), but high RAM usage as data scales.
- **Scalability:** Poor. Indexes must be held in memory. Restarting processes loses indexes, requiring costly re-indexing. Multi-node setups require duplicated indexes or sticky routing.
- **Operational Burden:** High at scale due to OOM risks and slow startup times during re-indexing.
- **Migration Effort:** N/A (current baseline).

### B. Tenant Snapshot BM25 (Disk-backed/Pickled)
An iterative improvement where BM25 indexes are serialized to disk per tenant and loaded dynamically.
- **Complexity:** Medium (requires index lifecycle management, LRU caches for active tenants).
- **Cost:** Low to Medium (cheaper than memory, requires persistent storage).
- **Scalability:** Better than in-memory, but still limited by the need to load full tenant indexes into RAM for query execution.
- **Operational Burden:** Medium. Requires managing stale indexes and cache eviction.
- **Migration Effort:** Low.

### C. OpenSearch / Elasticsearch
A dedicated distributed search engine.
- **Complexity:** High (requires deploying, securing, and managing a new cluster).
- **Cost:** High (requires dedicated instances with substantial memory and storage).
- **Scalability:** Excellent. Built for massive scale and native multi-tenancy.
- **Operational Burden:** High. Requires specialized knowledge for tuning, backup, and monitoring.
- **Migration Effort:** High. Requires complete rewrite of the keyword search and ingestion pipeline.

### D. Qdrant Sparse Vectors (Hybrid Search)
Leveraging Qdrant (which we already use for dense vectors) for sparse vector indexing (BM25 equivalents like SPLADE or BM25 embeddings).
- **Complexity:** Low to Medium (we already operate Qdrant; just requires enabling sparse vectors and generating them).
- **Cost:** Low (marginal increase on existing Qdrant cluster).
- **Scalability:** Excellent. Qdrant is built for distributed scale.
- **Operational Burden:** Low. Consolidates infrastructure by reusing the existing Qdrant deployment for both dense and sparse search.
- **Migration Effort:** Medium. Requires updating the embedding pipeline to generate sparse vectors alongside dense vectors, and updating the search queries.

## Recommendation

**D. Qdrant Sparse Vectors** is the recommended architectural path.

### Rationale:
1. **Infrastructure Consolidation:** We already operate Qdrant. Introducing OpenSearch (C) would double our database infrastructure footprint, increasing costs and operational complexity unnecessarily.
2. **Native Hybrid Search:** Qdrant supports querying dense and sparse vectors in a single request, pushing the Reciprocal Rank Fusion (RRF) or score fusion down to the database layer, which is far more efficient than doing it in the application layer.
3. **Scalability:** It completely eliminates the in-memory bottlenecks of our current BM25 implementation (A and B).
4. **Tenant Isolation:** Qdrant already supports payload filtering by `tenant_id`, allowing us to reuse our existing robust multi-tenant isolation patterns for keyword search.

### Next Steps (Not for this sprint)
- Implement a sparse vector encoder (e.g., Splade or a custom BM25 vectorizer) in the ingestion pipeline.
- Migrate existing Qdrant collections to support sparse vectors.
- Update `rag_pipeline.py` to use Qdrant's hybrid search API instead of calling the Python BM25 service.
