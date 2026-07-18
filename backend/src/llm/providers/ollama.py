import time
import httpx
from typing import Optional
from src.llm.base import LLMProvider, LLMResponse

class OllamaProvider(LLMProvider):
    """Integrates with Ollama running locally."""
    
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.model = model

    @property
    def provider_name(self) -> str:
        return "ollama"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        start_time = time.perf_counter()
        
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            }
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                latency = (time.perf_counter() - start_time) * 1000.0
                tokens_used = data.get("eval_count")  # eval_count matches prompt/eval tokens in ollama
                
                return LLMResponse(
                    content=data.get("response", ""),
                    model=self.model,
                    provider=self.provider_name,
                    tokens_used=tokens_used,
                    latency_ms=latency,
                    raw_response=data,
                )
            except Exception as e:
                # Fallback / bubble up error
                raise RuntimeError(f"Ollama generation failed: {str(e)}") from e

    async def health_check(self) -> dict:
        url = f"{self.base_url}/api/tags"
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.get(url)
                if response.status_code == 200:
                    return {
                        "provider": self.provider_name,
                        "status": "healthy",
                        "model": self.model,
                    }
            except Exception as e:
                return {
                    "provider": self.provider_name,
                    "status": "unhealthy",
                    "error": str(e),
                }
        return {
            "provider": self.provider_name,
            "status": "unhealthy",
            "error": "Non-200 response from tags endpoint",
        }
