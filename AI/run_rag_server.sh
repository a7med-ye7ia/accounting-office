#!/usr/bin/env bash
# RAG clause server — uses local venv (avoids PEP 668 / externally-managed-environment).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Reuse the repository's untracked deployment settings when they are available.
if [[ -f "$DIR/../.env" ]]; then
  set -a
  source "$DIR/../.env"
  set +a
fi

if [[ ! -x .venv/bin/python ]]; then
  echo "Creating .venv …"
  python3 -m venv .venv
fi

if ! .venv/bin/python -c "import faiss, fastapi, httpx" 2>/dev/null; then
  echo "Installing dependencies into .venv …"
  .venv/bin/pip install -U pip wheel -q
  .venv/bin/pip install -r requirements-rag.txt
else
  echo "Using existing .venv dependencies."
fi

echo "Starting RAG server on http://0.0.0.0:8765 (expects vLLM embeddings via AI_EMBEDDING_BASE_URL)"
exec .venv/bin/uvicorn rag_clause_server:app --host 0.0.0.0 --port 8765 "$@"
