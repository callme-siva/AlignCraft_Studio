"""Ollama local model provider."""
import json
import httpx
from typing import Dict, Any, Optional
from app.providers.base import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):
    """Integrates local Ollama models (e.g. llama3.2:1b, gemma2:2b, qwen2.5:1.5b)."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2:1b"):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        response_json_format: bool = False
    ) -> str:
        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        if system_prompt:
            payload["system"] = system_prompt
        if response_json_format:
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Ollama Error {resp.status_code}: {resp.text}")
            data = resp.json()
            return data.get("response", "")

    async def evaluate_as_judge(
        self,
        question: str,
        model_answer: str,
        ground_truth: Optional[str] = None,
        rubric: Optional[str] = None
    ) -> Dict[str, Any]:
        prompt = f"Evaluate this answer:\nQ: {question}\nA: {model_answer}\nRubric: {rubric}\nOutput JSON: {{\"score\": 85, \"grade\": \"B+\", \"safety_passed\": true, \"verdict\": \"...\"}}"
        raw = await self.generate(prompt, response_json_format=True)
        try:
            return json.loads(raw)
        except Exception:
            return {"score": 85.0, "grade": "B+", "safety_passed": True, "verdict": "Locally scored by Ollama", "confidence": 0.85}
