"""FastAPI Application and SSE Streaming Endpoints for AlignCraft Studio."""
import os
import json
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, PlainTextResponse
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.models.schemas import (
    GenerateDatasetRequest, DatasetFormat, FineTuneConfig,
    RedTeamSuiteRunRequest, AttackVector, PlaygroundPromptRequest,
    AttackCategory
)
from app.dataset.generator import dataset_manager
from app.finetune.models import SUPPORTED_SLMS
from app.finetune.simulator import training_manager
from app.finetune.exporter import ModelExporter
from app.finetune.qlora_trainer import QLoRATrainerGenerator
from app.redteam.fuzzer import redteam_fuzzer
from app.evals.benchmark_runner import benchmark_runner
from app.evals.judge import judge_evaluator
from app.providers import get_provider

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Full-stack SLM Fine-Tuning (QLoRA), Automated Red-Teaming, and LLM-as-a-Judge Evaluation Studio."
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")


# ============================================================================
# Status & Meta
# ============================================================================
@app.get("/api/status")
async def get_system_status():
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "force_mock": settings.FORCE_MOCK,
        "ollama_url": settings.OLLAMA_BASE_URL
    }


# ============================================================================
# 1. Dataset Studio Endpoints
# ============================================================================
@app.get("/api/dataset/summary")
async def get_dataset_summary():
    return dataset_manager.get_all_datasets()


@app.get("/api/dataset/{dataset_id}")
async def get_dataset(dataset_id: str):
    samples = dataset_manager.get_dataset(dataset_id)
    if not samples:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return samples


@app.post("/api/dataset/generate")
async def generate_dataset(req: GenerateDatasetRequest):
    new_samples = await dataset_manager.generate_synthetic_samples(req)
    return {
        "status": "success",
        "generated_count": len(new_samples),
        "samples": new_samples
    }


@app.get("/api/dataset/export/{dataset_id}")
async def export_dataset(dataset_id: str, format: DatasetFormat = DatasetFormat.ALPACA):
    content = dataset_manager.export_dataset(dataset_id, format)
    return PlainTextResponse(content, media_type="application/json")


# ============================================================================
# 2. Fine-Tuning Control Room Endpoints
# ============================================================================
@app.get("/api/finetune/models")
async def get_supported_slms():
    return SUPPORTED_SLMS


@app.post("/api/finetune/launch")
async def launch_finetune_job(config: FineTuneConfig):
    job = training_manager.create_job(config)
    return {
        "status": "launched",
        "job_id": job.id,
        "config": job.config,
        "stream_url": f"/api/finetune/stream/{job.id}"
    }


@app.get("/api/finetune/stream/{job_id}")
async def stream_finetune_telemetry(job_id: str):
    async def event_generator():
        async for event in training_manager.stream_training_progress(job_id):
            yield {
                "event": event["event"],
                "data": json.dumps(event["data"])
            }
    return EventSourceResponse(event_generator())


@app.post("/api/finetune/export/ollama-modelfile")
async def export_ollama_modelfile(config: FineTuneConfig):
    modelfile = ModelExporter.generate_ollama_modelfile(config)
    return {"modelfile": modelfile}


@app.post("/api/finetune/export/qlora-script")
async def export_qlora_script(config: FineTuneConfig):
    script = QLoRATrainerGenerator.generate_training_script(config, "data/train.jsonl", f"./runs/{config.run_name}")
    return {"script": script}


# ============================================================================
# 3. Red-Teaming Battleground Endpoints
# ============================================================================
@app.get("/api/redteam/attacks")
async def list_attacks(category: AttackCategory = None):
    return redteam_fuzzer.get_attacks(category)


@app.post("/api/redteam/run-suite")
async def run_redteam_suite(req: RedTeamSuiteRunRequest):
    results = await redteam_fuzzer.run_suite(req)
    scorecard = redteam_fuzzer.get_scorecard_summary(results)
    return {
        "status": "completed",
        "total_tests": len(results),
        "scorecard": scorecard,
        "results": results
    }


@app.post("/api/redteam/test-single")
async def test_single_attack(attack_id: str, model: str = "finetuned_slm", mutate: bool = False):
    attacks = [a for a in redteam_fuzzer.attack_suite if a.id == attack_id]
    if not attacks:
        raise HTTPException(status_code=404, detail="Attack vector not found")
    result = await redteam_fuzzer.execute_attack(attacks[0], model, mutate)
    return result


# ============================================================================
# 4. Evaluation & LLM-as-a-Judge Endpoints
# ============================================================================
@app.post("/api/evals/run-benchmark")
async def run_model_benchmark(domain: str = "enterprise_alignment"):
    report = await benchmark_runner.run_full_benchmark(domain)
    return report


@app.post("/api/evals/judge-single")
async def judge_single_response(prompt: str, response: str, rubric_type: str = "domain_accuracy"):
    score = await judge_evaluator.evaluate_criteria(prompt, response, rubric_type)
    return score


# ============================================================================
# 5. Interactive Playground (Side-by-Side Model Arena)
# ============================================================================
@app.post("/api/playground/prompt")
async def playground_prompt(req: PlaygroundPromptRequest):
    results = {}
    for model_key in req.models:
        provider = get_provider(model_key)
        try:
            output = await provider.generate(
                prompt=req.prompt,
                system_prompt=req.system_prompt,
                temperature=0.4
            )
        except Exception as e:
            output = f"[Error]: {str(e)}"
        
        evaluation = None
        if req.evaluate_live:
            evaluation = await judge_evaluator.evaluate_criteria(
                prompt=req.prompt,
                response_text=output,
                rubric_type="domain_accuracy"
            )

        results[model_key] = {
            "output": output,
            "evaluation": evaluation.model_dump() if evaluation else None
        }

    return {"status": "success", "results": results}


# ============================================================================
# Static Files & SPA Mounting
# ============================================================================
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    async def serve_index():
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return HTMLResponse("<h1>AlignCraft Studio Backend Active</h1>")
