# AI Context & Logic Module

High-level application logic for handling LLM inferences and prompt templates. Separated from low-level provider interface (`llm/`).

## Submodules
- `prompts/` — Prompt registry and dynamic templating
- `summarizer/` — Incident analysis and log summarizers
- `embeddings/` — Convert text records into vector formats (using local models)
- `rag/` — Retrieval-Augmented Generation using local knowledge context
