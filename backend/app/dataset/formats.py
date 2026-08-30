"""Dataset format converters for Alpaca, ChatML, ShareGPT, and JSONL."""
import json
from typing import List, Dict, Any
from app.models.schemas import DatasetSample, DatasetFormat


class DatasetFormatter:
    """Converts internal DatasetSample records into standard HuggingFace / SFT formats."""

    @staticmethod
    def to_alpaca(samples: List[DatasetSample]) -> List[Dict[str, Any]]:
        """Converts to Stanford Alpaca format."""
        return [
            {
                "instruction": s.instruction,
                "input": s.input or "",
                "output": s.output
            }
            for s in samples
        ]

    @staticmethod
    def to_chatml(samples: List[DatasetSample]) -> str:
        """Converts to ChatML tokenized prompt text."""
        chunks = []
        for s in samples:
            text = ""
            if s.system_prompt:
                text += f"<|im_start|>system\n{s.system_prompt}<|im_end|>\n"
            
            user_msg = s.instruction
            if s.input:
                user_msg += f"\n\nContext / Input:\n{s.input}"
            text += f"<|im_start|>user\n{user_msg}<|im_end|>\n"
            text += f"<|im_start|>assistant\n{s.output}<|im_end|>"
            chunks.append(text)
        return "\n\n---\n\n".join(chunks)

    @staticmethod
    def to_sharegpt(samples: List[DatasetSample]) -> List[Dict[str, Any]]:
        """Converts to ShareGPT multi-turn conversation format."""
        results = []
        for s in samples:
            convos = []
            if s.system_prompt:
                convos.append({"from": "system", "value": s.system_prompt})
            
            user_msg = s.instruction
            if s.input:
                user_msg += f"\n\nContext / Input:\n{s.input}"
            convos.append({"from": "human", "value": user_msg})
            convos.append({"from": "gpt", "value": s.output})
            results.append({"conversations": convos, "id": s.id})
        return results

    @staticmethod
    def to_jsonl(samples: List[DatasetSample], format_type: DatasetFormat) -> str:
        """Exports samples as newline-delimited JSON (JSONL)."""
        if format_type == DatasetFormat.ALPACA:
            records = DatasetFormatter.to_alpaca(samples)
        elif format_type == DatasetFormat.SHAREGPT:
            records = DatasetFormatter.to_sharegpt(samples)
        else:
            records = [s.model_dump() for s in samples]
        
        return "\n".join(json.dumps(r) for r in records)
