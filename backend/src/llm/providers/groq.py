import time
import httpx
from typing import Optional
from src.llm.base import LLMProvider, LLMResponse

class GroqProvider(LLMProvider):
    """Integrates with Groq Cloud API via OpenAI compatible interface."""
    
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.groq.com/openai/v1"

    @property
    def provider_name(self) -> str:
        return "groq"

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        start_time = time.perf_counter()
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
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
            except httpx.HTTPStatusError as e:
                # Add handling for rate limits (429)
                if e.response.status_code == 429:
                    retry_after = e.response.headers.get("retry-after", "unknown")
                    raise RuntimeError(
                        f"Groq API Rate Limit (429). Retry after {retry_after} seconds."
                    ) from e
                raise RuntimeError(f"Groq generation failed with HTTP error: {e.response.text}") from e
            except Exception as e:
                raise RuntimeError(f"Groq generation failed: {str(e)}") from e

    async def health_check(self) -> dict:
        if not self.api_key:
            return {
                "provider": self.provider_name,
                "status": "unhealthy",
                "error": "Groq API key is missing.",
            }
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        # Call models endpoint as a lightweight health check
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
            "error": "Failed to connect to Groq models endpoint",
        }
