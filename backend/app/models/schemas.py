"""Pydantic schemas and data contracts for AlignCraft Studio."""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum
import time


class DatasetFormat(str, Enum):
    ALPACA = "alpaca"
    CHATML = "chatml"
    SHAREGPT = "sharegpt"
    RAW_JSONL = "raw_jsonl"


class TaskDomain(str, Enum):
    STRUCTURED_EXTRACTION = "structured_extraction"
    CYBER_SECURITY = "cyber_security"
    SAFE_ASSISTANT = "safe_assistant"
    CODE_OPTIMIZATION = "code_optimization"
    MEDICAL_SUMMARY = "medical_summary"
    CUSTOM = "custom"


class DatasetSample(BaseModel):
    id: str
    instruction: str
    input: Optional[str] = ""
    output: str
    system_prompt: Optional[str] = ""
    domain: str = "general"
    quality_score: float = 1.0
    tokens: int = 0
    created_at: float = Field(default_factory=time.time)


class GenerateDatasetRequest(BaseModel):
    domain: TaskDomain = TaskDomain.STRUCTURED_EXTRACTION
    custom_topic: Optional[str] = None
    num_samples: int = Field(default=10, ge=1, le=100)
    system_prompt_template: Optional[str] = None
    difficulty: str = "medium"  # easy, medium, hard, adversarial
    filter_low_quality: bool = True


class SLMBaseModel(str, Enum):
    LLAMA_3_2_1B = "meta-llama/Llama-3.2-1B-Instruct"
    LLAMA_3_2_3B = "meta-llama/Llama-3.2-3B-Instruct"
    GEMMA_2_2B = "google/gemma-2-2b-it"
    QWEN_2_5_1_5B = "Qwen/Qwen2.5-1.5B-Instruct"
    QWEN_2_5_3B = "Qwen/Qwen2.5-3B-Instruct"
    PHI_3_5_MINI = "microsoft/Phi-3.5-mini-instruct"


class FineTuneConfig(BaseModel):
    run_name: str = "slm-alignment-run-1"
    base_model: SLMBaseModel = SLMBaseModel.LLAMA_3_2_1B
    dataset_id: Optional[str] = "default"
    lora_r: int = Field(default=16, ge=4, le=128, description="LoRA rank dimension")
    lora_alpha: int = Field(default=32, ge=8, le=256, description="LoRA scaling factor")
    lora_dropout: float = Field(default=0.05, ge=0.0, le=0.5)
    target_modules: List[str] = Field(default_factory=lambda: ["q_proj", "v_proj", "k_proj", "o_proj"])
    quantization: str = "4bit"  # 4bit, 8bit, 16bit
    learning_rate: float = 2e-4
    epochs: int = Field(default=3, ge=1, le=10)
    batch_size: int = Field(default=4, ge=1, le=32)
    gradient_accumulation_steps: int = Field(default=4, ge=1, le=16)
    warmup_ratio: float = 0.03
    lr_scheduler: str = "cosine"
    max_seq_length: int = 1024


class TrainingStepMetric(BaseModel):
    step: int
    total_steps: int
    epoch: float
    train_loss: float
    eval_loss: Optional[float] = None
    learning_rate: float
    grad_norm: float
    perplexity: float
    timestamp: float = Field(default_factory=time.time)


class TrainingStatus(str, Enum):
    IDLE = "idle"
    PREPARING = "preparing"
    TRAINING = "training"
    EVALUATING = "evaluating"
    COMPLETED = "completed"
    FAILED = "failed"


class TrainingJob(BaseModel):
    id: str
    config: FineTuneConfig
    status: TrainingStatus = TrainingStatus.IDLE
    current_step: int = 0
    total_steps: int = 100
    metrics_history: List[TrainingStepMetric] = Field(default_factory=list)
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    error_message: Optional[str] = None
    adapter_path: Optional[str] = None


class AttackCategory(str, Enum):
    DIRECT_JAILBREAK = "direct_jailbreak"
    INDIRECT_INJECTION = "indirect_injection"
    SYSTEM_LEAKAGE = "system_leakage"
    MALICIOUS_EXECUTION = "malicious_execution"
    SYCOPHANCY_GASLIGHT = "sycophancy_gaslight"
    POLICY_EVASION = "policy_evasion"


class ThreatSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AttackVector(BaseModel):
    id: str
    title: str
    category: AttackCategory
    severity: ThreatSeverity
    prompt: str
    context: Optional[str] = ""
    system_prompt: Optional[str] = ""
    expected_safe_behavior: str
    exploit_payload_description: str
    tags: List[str] = Field(default_factory=list)


class RedTeamResult(BaseModel):
    attack_id: str
    attack_title: str
    category: AttackCategory
    severity: ThreatSeverity
    model_name: str
    model_type: str  # "base_slm", "finetuned_slm", "frontier_llm"
    prompt_tested: str
    model_response: str
    bypassed: bool  # True if attack succeeded (model failed safety)
    vulnerability_score: float  # 0.0 (safe) to 1.0 (completely exploited)
    judge_reasoning: str
    latency_ms: float
    timestamp: float = Field(default_factory=time.time)


class RedTeamSuiteRunRequest(BaseModel):
    categories: Optional[List[AttackCategory]] = None
    target_models: List[str] = Field(default_factory=lambda: ["base_slm", "finetuned_slm", "frontier_llm"])
    include_mutations: bool = False


class EvalMetricType(str, Enum):
    SAFETY_RESISTANCE = "safety_resistance"
    JSON_SCHEMA_ADHERENCE = "json_schema_adherence"
    FAITHFULNESS = "faithfulness"
    DOMAIN_ACCURACY = "domain_accuracy"
    CONCISENESS = "conciseness"


class EvalScore(BaseModel):
    metric: EvalMetricType
    score: float  # 0.0 to 100.0
    rubric_grade: str  # "A+", "A", "B", "C", "F"
    explanation: str


class ModelBenchmarkSummary(BaseModel):
    model_key: str
    model_display_name: str
    overall_score: float
    safety_score: float
    accuracy_score: float
    format_score: float
    avg_latency_ms: float
    cost_per_1k_tokens: float
    attacks_blocked_ratio: str
    metrics: Dict[str, float] = Field(default_factory=dict)


class BenchmarkReport(BaseModel):
    benchmark_id: str
    timestamp: float = Field(default_factory=time.time)
    domain: str
    models_evaluated: List[ModelBenchmarkSummary]
    radar_chart_data: Dict[str, Any]
    detailed_evals: List[Dict[str, Any]]


class PlaygroundPromptRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = ""
    models: List[str] = Field(default_factory=lambda: ["base_slm", "finetuned_slm", "frontier_llm"])
    evaluate_live: bool = True
