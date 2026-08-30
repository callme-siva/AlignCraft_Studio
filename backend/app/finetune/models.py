"""SLM Model Registry and architectural metadata."""
from typing import Dict, Any, List


SUPPORTED_SLMS: Dict[str, Dict[str, Any]] = {
    "meta-llama/Llama-3.2-1B-Instruct": {
        "name": "Llama 3.2 (1B)",
        "params": "1.23B",
        "recommended_lora_rank": 16,
        "default_target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
        "context_window": 128000,
        "vram_4bit_mb": 1100,
        "description": "Ultra-lightweight edge model from Meta. Ideal for fast local classification, extraction, and edge tool-calling."
    },
    "meta-llama/Llama-3.2-3B-Instruct": {
        "name": "Llama 3.2 (3B)",
        "params": "3.21B",
        "recommended_lora_rank": 32,
        "default_target_modules": ["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        "context_window": 128000,
        "vram_4bit_mb": 2400,
        "description": "High-efficiency multilingual reasoning model. Excellent balance of instruction following and footprint."
    },
    "google/gemma-2-2b-it": {
        "name": "Gemma 2 (2B)",
        "params": "2.61B",
        "recommended_lora_rank": 16,
        "default_target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
        "context_window": 8192,
        "vram_4bit_mb": 2100,
        "description": "Google's high-performance open model with sliding window attention and Logit Soft-Capping."
    },
    "Qwen/Qwen2.5-1.5B-Instruct": {
        "name": "Qwen 2.5 (1.5B)",
        "params": "1.54B",
        "recommended_lora_rank": 16,
        "default_target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
        "context_window": 32768,
        "vram_4bit_mb": 1400,
        "description": "State-of-the-art small model for coding, mathematics, and structured JSON schema adherence."
    },
    "microsoft/Phi-3.5-mini-instruct": {
        "name": "Phi-3.5 Mini (3.8B)",
        "params": "3.82B",
        "recommended_lora_rank": 32,
        "default_target_modules": ["o_proj", "qkv_proj", "gate_up_proj", "down_proj"],
        "context_window": 128000,
        "vram_4bit_mb": 2900,
        "description": "High reasoning density trained on textbook-quality synthetic data."
    }
}
