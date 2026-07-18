# ADR 002: Provider-Agnostic LLM Layer

## Status
Accepted

## Context
Tracemind requires local-first AI assistant suggestions for logs, traces, and metrics. However, developers may wish to swap to cloud gateways (Groq, OpenAI) depending on system performance or cost considerations.

## Decision
We implemented a provider interface contract `LLMProvider` which concrete classes (`OllamaProvider`, `GroqProvider`, `OpenAICompatProvider`) implement. 

The application utilizes a factory function `create_llm_provider` that checks `LLM_PROVIDER` in settings and returns the corresponding configured class.

## Consequences
- **Pros:** swap LLM providers via simple `.env` edits without changing business logic code.
- **Cons:** We must maintain compatibility of API outputs across model capabilities (like formatting templates).
