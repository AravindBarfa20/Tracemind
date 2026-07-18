from typing import Annotated
from fastapi import Depends
from src.core.config import Settings, get_settings
from src.llm.base import LLMProvider, LLMResponse
from src.llm.providers.groq import GroqProvider
from src.llm.providers.ollama import OllamaProvider
from src.llm.providers.openai_compat import OpenAICompatProvider

class FallbackLLMProvider(LLMProvider):
    """Decorator provider that attempts a primary LLM and falls back to secondary on connection errors."""

    def __init__(self, primary: LLMProvider, secondary: LLMProvider):
        self.primary = primary
        self.secondary = secondary

    @property
    def provider_name(self) -> str:
        return self.primary.provider_name

    async def generate(self, *args, **kwargs) -> LLMResponse:
        try:
            return await self.primary.generate(*args, **kwargs)
        except Exception as e:
            # Fallback if connection fails
            err_msg = str(e)
            if "connection" in err_msg.lower() or "connect" in err_msg.lower():
                import logging
                logger = logging.getLogger("src.llm.factory")
                logger.warning(f"Primary LLM ({self.primary.provider_name}) connection failed. Falling back to Groq.")
                return await self.secondary.generate(*args, **kwargs)
            raise e

    async def health_check(self) -> dict:
        health = await self.primary.health_check()
        if health.get("status") == "healthy":
            return health
        return await self.secondary.health_check()


def create_llm_provider(settings: Settings) -> LLMProvider:
    """Reads settings and instantiates the correct LLMProvider."""
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "ollama":
        primary = OllamaProvider(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL,
        )
        if settings.GROQ_API_KEY:
            secondary = GroqProvider(
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_MODEL,
            )
            return FallbackLLMProvider(primary, secondary)
        return primary
    elif provider == "groq":
        return GroqProvider(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
        )
    elif provider == "openai_compat":
        return OpenAICompatProvider(
            base_url=settings.OPENAI_COMPAT_BASE_URL,
            api_key=settings.OPENAI_COMPAT_API_KEY,
            model=settings.OPENAI_COMPAT_MODEL,
        )
    else:
        raise ValueError(f"Unknown or unsupported LLM_PROVIDER: '{settings.LLM_PROVIDER}'")


def get_llm_provider(
    settings: Annotated[Settings, Depends(get_settings)]
) -> LLMProvider:
    """FastAPI request-scoped dependency to retrieve the LLM provider instance."""
    return create_llm_provider(settings)
