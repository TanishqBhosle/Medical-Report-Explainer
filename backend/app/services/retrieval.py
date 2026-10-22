from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeSource, KnowledgeChunk
from app.core.logging import logger


class RetrievalService:
    @staticmethod
    def retrieve_relevant_chunks(
        db: Session,
        query: str,
        test_names: Optional[List[str]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search for relevant medical knowledge chunks.
        Matches canonical test names and keyword tokens.
        """
        # Ensure only active sources
        query_words = set(query.lower().split()) if query else set()

        candidates = (
            db.query(KnowledgeChunk, KnowledgeSource)
            .join(KnowledgeSource, KnowledgeChunk.source_id == KnowledgeSource.id)
            .filter(KnowledgeSource.is_active == True)
            .all()
        )

        scored_results = []
        for chunk, source in candidates:
            score = 0.0
            chunk_test = (chunk.canonical_test_name or "").lower()
            chunk_body = chunk.chunk_text.lower()

            # Exact or partial match with test_names
            if test_names:
                for tn in test_names:
                    tn_clean = tn.lower()
                    if tn_clean in chunk_test or chunk_test in tn_clean:
                        score += 5.0
                    elif any(part in chunk_body for part in tn_clean.split() if len(part) > 3):
                        score += 2.0

            # Keyword matching from query
            for word in query_words:
                if len(word) > 3:
                    if word in chunk_test:
                        score += 3.0
                    if word in chunk_body:
                        score += 1.0

            if score > 0:
                scored_results.append({
                    "chunk_id": chunk.id,
                    "source_id": source.id,
                    "title": source.title,
                    "publisher": source.publisher,
                    "source_url": source.source_url,
                    "canonical_test_name": chunk.canonical_test_name,
                    "chunk_text": chunk.chunk_text,
                    "relevance_score": score
                })

        # Sort descending by relevance score
        scored_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_results = scored_results[:top_k]

        logger.info(f"Retrieved {len(top_results)} relevant knowledge chunks for query='{query[:50]}' and tests={test_names}")
        return top_results
