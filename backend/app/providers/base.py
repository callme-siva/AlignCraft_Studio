"""Base LLM Provider interface."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class BaseLLMProvider(ABC):
    """Abstract interface for LLM completions across models and local weights."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        response_json_format: bool = False
    ) -> str:
        """Generate a completion for the given prompt and system instruction."""
        pass

    @abstractmethod
    async def evaluate_as_judge(
        self,
        question: str,
        model_answer: str,
        ground_truth: Optional[str] = None,
        rubric: Optional[str] = None
    ) -> Dict[str, Any]:
        """Score an answer using LLM-as-a-Judge standard rubric."""
        pass
