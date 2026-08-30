"""Evaluation metrics definitions and calculation helpers."""
from typing import Dict, Any, List
import json


class MetricCalculator:
    """Calculates quantitative benchmark metrics across model evaluations."""

    @staticmethod
    def calculate_json_adherence(response_text: str) -> float:
        """Scores format adherence from 0 to 100 based on strict JSON validity."""
        cleaned = response_text.strip()
        if cleaned.startswith("```json") and cleaned.endswith("```"):
            cleaned = cleaned[7:-3].strip()
        elif cleaned.startswith("```") and cleaned.endswith("```"):
            cleaned = cleaned[3:-3].strip()

        try:
            json.loads(cleaned)
            # Perfect valid JSON
            # Check if there was conversational chatter around it
            if response_text.strip().startswith("{") or response_text.strip().startswith("["):
                return 100.0
            return 85.0  # valid JSON but wrapped in markdown codeblock or chatter
        except Exception:
            return 15.0  # Invalid JSON

    @staticmethod
    def estimate_cost(tokens: int, model_key: str) -> float:
        """Estimates cost per 1000 requests in USD."""
        if "frontier" in model_key or "gemini" in model_key or "gpt-4" in model_key:
            return 0.005 * (tokens / 1000)
        # Self-hosted SLM is orders of magnitude cheaper (amortized compute cost)
        return 0.0001 * (tokens / 1000)
