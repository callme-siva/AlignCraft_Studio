"""LLM Provider factory and manager."""
from typing import Optional
from app.config import settings
from app.providers.base import BaseLLMProvider
from app.providers.mock_provider import MockLLMProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.ollama_provider import OllamaProvider


def get_provider(model_key: str = "finetuned_slm") -> BaseLLMProvider:
    """
    Returns the appropriate LLM provider based on model_key and configured environment variables.
    Falls back gracefully to high-fidelity mock provider if keys are not present.
    """
    if settings.FORCE_MOCK:
        return MockLLMProvider(model_variant=model_key)

    if model_key in ("gemini", "frontier_llm") and settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)

    if model_key in ("openai", "gpt-4o") and settings.OPENAI_API_KEY:
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY)

    # Return Mock with appropriate model variant behavior for instant zero-key testing
    return MockLLMProvider(model_variant=model_key)


def get_judge_provider() -> BaseLLMProvider:
    """Returns the dedicated LLM-as-a-Judge provider."""
    if settings.GEMINI_API_KEY and not settings.FORCE_MOCK:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model="gemini-1.5-flash")
    if settings.OPENAI_API_KEY and not settings.FORCE_MOCK:
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY, model="gpt-4o-mini")
    return MockLLMProvider(model_variant="frontier_llm")
