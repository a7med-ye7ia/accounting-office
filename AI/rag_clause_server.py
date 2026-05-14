"""
FastAPI: (1) clause-level RAG on one long text, (2) pick one article from a list using only a query.
Uses Ollama embeddings + FAISS when Ollama is up; otherwise falls back to simple word-overlap (no extra deps).

Run: ./run_rag_server.sh   (creates .venv, pip install, uvicorn — avoids system pip PEP 668)
     Or: .venv/bin/pip install -r requirements-rag.txt && .venv/bin/uvicorn rag_clause_server:app --host 0.0.0.0 --port 8765

Env:
  OLLAMA_HOST               default http://127.0.0.1:11434  (127.0.0.1 avoids some IPv6 localhost issues)
  OLLAMA_EMBED_MODEL        default nomic-embed-text  (ollama pull nomic-embed-text)
  OLLAMA_EMBED_TIMEOUT_SEC  default 25 (then lexical fallback if Ollama is down)
  RAG_CORS_ORIGINS          comma-separated origins (default includes Vite :5173)
"""

from __future__ import annotations

import logging
import os
import re
from contextlib import asynccontextmanager
from typing import Literal

import faiss
import httpx
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger("rag_clause_server")


def split_clauses(text: str) -> list[str]:
    if not text or not str(text).strip():
        return []
    parts = re.split(r"(مادة\s*\(\d+\))", text)
    clauses = ["".join(x).strip() for x in zip(parts[1::2], parts[2::2])]
    if not clauses and text.strip():
        return [text.strip()]
    return clauses


class SearchRequest(BaseModel):
    old_text: str = Field(..., description="Full article / contract text to index")
    query: str = Field(..., description="User question or edit instruction (Arabic or mixed)")
    retrieve_k: int = Field(10, ge=1, le=50)
    final_k: int = Field(3, ge=1, le=10)


class SearchResultItem(BaseModel):
    text: str
    score: float


class SearchResponse(BaseModel):
    clause_count: int
    results: list[SearchResultItem]


class ArticleIn(BaseModel):
    id: str | int
    title: str = ""
    subtitle: str | None = None
    content: str = ""


class ArticlePickRequest(BaseModel):
    query: str = Field(..., description="What you want to edit or find (Arabic or mixed)")
    articles: list[ArticleIn] = Field(..., min_length=1)


class ArticlePickResponse(BaseModel):
    article_id: str | int
    title: str
    score: float
    method: Literal["embedding", "lexical"] = "embedding"


# --- lexical fallback (no Ollama) ------------------------------------------
_TOKEN_RE = re.compile(r"[\u0600-\u06FF]+|[\w]+", re.UNICODE)


def _tokens(s: str) -> set[str]:
    return {m.group(0).lower() for m in _TOKEN_RE.finditer(s or "") if len(m.group(0)) >= 2}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def lexical_article_pick(arts: list[ArticleIn], query: str) -> tuple[int, float]:
    qt = _tokens(query)
    if not qt:
        return 0, 0.0
    best_i, best_s = 0, -1.0
    for i, art in enumerate(arts):
        blob = _article_embed_text(art)
        st = _tokens(blob)
        s = _jaccard(qt, st)
        if s > best_s:
            best_s, best_i = s, i
    return best_i, float(max(best_s, 0.0))


def lexical_clause_rank(
    clauses: list[str], query: str, final_k: int, retrieve_k: int
) -> list[tuple[str, float]]:
    qt = _tokens(query)
    fk = min(final_k, len(clauses))
    if not clauses:
        return []
    if not qt:
        return [(clauses[i], 0.0) for i in range(fk)]
    scored = [(c, _jaccard(qt, _tokens(c))) for c in clauses]
    scored.sort(key=lambda x: (-x[1], -len(x[0])))
    cap = min(max(retrieve_k, final_k), len(scored))
    fk = min(final_k, cap)
    return scored[:cap][:fk]


def _article_embed_text(a: ArticleIn, max_chars: int = 10000) -> str:
    parts = [
        f"م.{a.id}",
        (a.title or "").strip(),
        (a.subtitle or "").strip(),
        (a.content or "").strip(),
    ]
    s = "\n".join(p for p in parts if p)
    return s[:max_chars] if len(s) > max_chars else s


_http: httpx.Client | None = None


def _ollama_base() -> str:
    return os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")


def _embed_model() -> str:
    return os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")


def _embed_http_timeout() -> httpx.Timeout:
    sec = float(os.environ.get("OLLAMA_EMBED_TIMEOUT_SEC", "25"))
    return httpx.Timeout(sec, connect=min(10.0, sec))


def _l2_normalize(vecs: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vecs, axis=1, keepdims=True).astype(np.float32)
    norms = np.where(norms == 0, 1.0, norms)
    return (vecs / norms).astype(np.float32)


def ollama_embed_batch(client: httpx.Client, texts: list[str]) -> np.ndarray:
    """Call Ollama /api/embed; returns float32 array shape (n, dim), L2-normalized rows."""
    if not texts:
        return np.zeros((0, 0), dtype=np.float32)
    url = f"{_ollama_base()}/api/embed"
    r = client.post(
        url,
        json={"model": _embed_model(), "input": texts},
        timeout=_embed_http_timeout(),
    )
    r.raise_for_status()
    data = r.json()
    emb = data.get("embeddings")
    if emb is None:
        # single-input older shapes
        one = data.get("embedding")
        if one is not None:
            emb = [one]
        else:
            raise RuntimeError(f"Unexpected Ollama embed response keys: {list(data.keys())}")
    arr = np.asarray(emb, dtype=np.float32)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    return _l2_normalize(arr)


def ollama_embed_chunks(client: httpx.Client, texts: list[str], chunk_size: int = 32) -> np.ndarray:
    parts: list[np.ndarray] = []
    for i in range(0, len(texts), chunk_size):
        batch = texts[i : i + chunk_size]
        parts.append(ollama_embed_batch(client, batch))
    if not parts:
        return np.zeros((0, 0), dtype=np.float32)
    return np.vstack(parts)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _http
    _http = httpx.Client(timeout=300.0)
    yield
    if _http is not None:
        _http.close()
        _http = None


def _cors_allow_origins() -> list[str]:
    raw = os.environ.get(
        "RAG_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    )
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(title="Clause RAG (Ollama)", lifespan=lifespan)
# Do not use allow_origins=["*"] with allow_credentials=True (browser will block).
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health(probe: int | None = None) -> dict:
    """GET /health?probe=1 tries one Ollama embedding (shows ollama_embed_ok / ollama_embed_error)."""
    out: dict = {"status": "ok", "embed_model": _embed_model(), "ollama": _ollama_base()}
    if probe == 1:
        if _http is None:
            out["ollama_embed_ok"] = False
            out["ollama_embed_error"] = "http client not ready"
        else:
            try:
                ollama_embed_batch(_http, ["ok"])
                out["ollama_embed_ok"] = True
            except Exception as e:
                out["ollama_embed_ok"] = False
                out["ollama_embed_error"] = f"{type(e).__name__}: {e}"[:400]
    return out


@app.post("/api/clause-rag/search", response_model=SearchResponse)
def clause_rag_search(body: SearchRequest) -> SearchResponse:
    if _http is None:
        raise RuntimeError("HTTP client not initialized")

    old_text = body.old_text or ""
    query = (body.query or "").strip()
    if not query:
        return SearchResponse(clause_count=0, results=[])

    clauses = split_clauses(old_text)
    if not clauses:
        return SearchResponse(clause_count=0, results=[])

    try:
        doc_vecs = ollama_embed_chunks(_http, clauses)
        if doc_vecs.size == 0 or doc_vecs.shape[0] != len(clauses):
            raise RuntimeError("Embedding dimension mismatch")

        index = faiss.IndexFlatIP(doc_vecs.shape[1])
        index.add(doc_vecs.astype("float32"))

        q_vecs = ollama_embed_batch(_http, [query])
        if q_vecs.shape[0] != 1:
            raise RuntimeError("Expected single query vector")

        rk = min(max(body.retrieve_k, body.final_k), len(clauses))
        scores, indices = index.search(q_vecs.astype("float32"), rk)

        row_scores = scores[0].tolist()
        row_idx = indices[0].tolist()
        ranked: list[tuple[str, float]] = []
        seen: set[int] = set()
        for i, s in zip(row_idx, row_scores):
            ii = int(i)
            if ii < 0 or ii >= len(clauses) or ii in seen:
                continue
            seen.add(ii)
            ranked.append((clauses[ii], float(s)))

        fk = min(body.final_k, len(ranked))
        top = ranked[:fk]
    except Exception as e:
        logger.warning("clause_rag_search: embedding failed, using lexical: %s: %s", type(e).__name__, e)
        top = lexical_clause_rank(clauses, query, body.final_k, body.retrieve_k)

    return SearchResponse(
        clause_count=len(clauses),
        results=[SearchResultItem(text=t, score=s) for t, s in top],
    )


@app.post("/api/article-rag/pick", response_model=ArticlePickResponse)
def article_rag_pick(body: ArticlePickRequest) -> ArticlePickResponse:
    """Best article: Ollama embeddings + FAISS when available; else lexical Jaccard on tokens."""
    if _http is None:
        raise RuntimeError("HTTP client not initialized")

    query = (body.query or "").strip()
    arts = body.articles
    if not query:
        raise HTTPException(status_code=400, detail="query must be non-empty")

    texts = [_article_embed_text(a) for a in arts]
    method: Literal["embedding", "lexical"] = "embedding"
    best_i = 0
    score = 0.0

    try:
        doc_vecs = ollama_embed_chunks(_http, texts)
        if doc_vecs.size == 0 or doc_vecs.shape[0] != len(arts):
            raise RuntimeError("Embedding dimension mismatch")

        index = faiss.IndexFlatIP(doc_vecs.shape[1])
        index.add(doc_vecs.astype("float32"))

        q_vecs = ollama_embed_batch(_http, [query])
        scores, indices = index.search(q_vecs.astype("float32"), 1)
        best_i = int(indices[0][0])
        if best_i < 0 or best_i >= len(arts):
            raise RuntimeError("Invalid FAISS index")
        score = float(scores[0][0])
    except Exception as e:
        logger.warning("article_rag_pick: embedding failed, using lexical: %s: %s", type(e).__name__, e)
        best_i, score = lexical_article_pick(arts, query)
        method = "lexical"

    best = arts[best_i]
    return ArticlePickResponse(
        article_id=best.id,
        title=best.title or f"مادة {best.id}",
        score=score,
        method=method,
    )
