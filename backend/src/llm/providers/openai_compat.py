import time
import httpx
from typing import Optional
from src.llm.base import LLMProvider, LLMResponse

class OpenAICompatProvider(LLMProvider):
    """Integrates with any OpenAI-compatible API gateway (vLLM, LM Studio, Together AI, etc.)."""
    
    def __init__(self, base_url: str, api_key: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    @property
    def provider_name(self) -> str:
        return "openai_compat"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        start_time = time.perf_counter()
        
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        headers["Content-Type"] = "application/json"
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                latency = (time.perf_counter() - start_time) * 1000.0
                usage = data.get("usage", {})
                tokens_used = usage.get("total_tokens")
                content = data["choices"][0]["message"]["content"]
                
                return LLMResponse(
                    content=content,
                    model=self.model,
                    provider=self.provider_name,
                    tokens_used=tokens_used,
                    latency_ms=latency,
                    raw_response=data,
                )
            except Exception as e:
                raise RuntimeError(f"OpenAI-compat generation failed: {str(e)}") from e

    async def health_check(self) -> dict:
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.get(f"{self.base_url}/models", headers=headers)
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
            "error": "Failed to connect to OpenAI-compatible models endpoint",
        }
