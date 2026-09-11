#!/usr/bin/env bash
# RAG clause server — uses local venv (avoids PEP 668 / externally-managed-environment).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

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

echo "Starting server on http://0.0.0.0:8765 (Ollama must be on 11434; ollama pull nomic-embed-text)"
exec .venv/bin/uvicorn rag_clause_server:app --host 0.0.0.0 --port 8765 "$@"
