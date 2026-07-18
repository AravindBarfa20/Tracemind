from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional

@dataclass
class LLMResponse:
    """Standardized response from an LLM provider."""
    content: str
    model: str
    provider: str
    tokens_used: Optional[int] = None
    latency_ms: float = 0.0
    raw_response: Optional[Dict[str, Any]] = None


class LLMProvider(ABC):
    """Base interface for all LLM providers (Ollama, Groq, OpenAI etc.)."""
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the identifier name of the provider."""
        pass

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """Sends a request to the LLM and returns a standardized LLMResponse."""
        pass

    @abstractmethod
    async def health_check(self) -> dict:
        """Checks if the LLM provider service is active and responsive."""
        pass
