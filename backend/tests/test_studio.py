"""Comprehensive automated test suite for AlignCraft Studio."""
import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.dataset.generator import dataset_manager
from app.dataset.formats import DatasetFormatter
from app.models.schemas import GenerateDatasetRequest, TaskDomain, DatasetFormat, FineTuneConfig, RedTeamSuiteRunRequest
from app.finetune.simulator import training_manager
from app.redteam.fuzzer import redteam_fuzzer
from app.evals.benchmark_runner import benchmark_runner
from app.evals.judge import judge_evaluator

client = TestClient(app)


def test_status_endpoint():
    """Verify system status API."""
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "app_name" in data
    assert data["app_name"] == "AlignCraft Studio"


def test_dataset_summary_and_export():
    """Verify dataset summary and multi-format conversion."""
    summary = client.get("/api/dataset/summary").json()
    assert "structured_extraction" in summary
    assert summary["structured_extraction"]["sample_count"] >= 2

    # Test Alpaca export
    alpaca_exp = client.get("/api/dataset/export/structured_extraction?format=alpaca")
    assert alpaca_exp.status_code == 200
    assert "instruction" in alpaca_exp.text

    # Test ChatML export
    chatml_exp = client.get("/api/dataset/export/structured_extraction?format=chatml")
    assert chatml_exp.status_code == 200


@pytest.mark.asyncio
async def test_synthetic_dataset_generation():
    """Verify synthetic instruction dataset generation."""
    req = GenerateDatasetRequest(
        domain=TaskDomain.STRUCTURED_EXTRACTION,
        custom_topic="Healthcare Logs",
        num_samples=3,
        filter_low_quality=True
    )
    samples = await dataset_manager.generate_synthetic_samples(req)
    assert len(samples) == 3
    assert samples[0].quality_score >= 0.7
    assert len(samples[0].output) > 0


@pytest.mark.asyncio
async def test_finetune_job_and_telemetry():
    """Verify fine-tuning job creation and step-by-step telemetry stream."""
    config = FineTuneConfig(
        run_name="test-run",
        lora_r=16,
        lora_alpha=32,
        epochs=1,
        learning_rate=0.0002
    )
    job = training_manager.create_job(config)
    assert job.id.startswith("job-")

    events = []
    async for evt in training_manager.stream_training_progress(job.id):
        events.append(evt)

    assert len(events) >= 25
    assert events[-1]["event"] == "completed"
    assert "adapter_path" in events[-1]["data"]


@pytest.mark.asyncio
async def test_redteam_attack_suite():
    """Verify automated adversarial fuzzer execution."""
    attacks = redteam_fuzzer.get_attacks()
    assert len(attacks) >= 5

    # Run single attack
    single_res = await redteam_fuzzer.execute_attack(attacks[0], "finetuned_slm")
    assert single_res.bypassed is False
    assert single_res.vulnerability_score <= 0.35

    # Run against base model (should detect higher vulnerability)
    base_res = await redteam_fuzzer.execute_attack(attacks[0], "base_slm")
    assert base_res.vulnerability_score >= 0.70


@pytest.mark.asyncio
async def test_benchmark_runner_and_radar_data():
    """Verify Tri-Model Benchmark runner and radar chart generation."""
    report = await benchmark_runner.run_full_benchmark("test_domain")
    assert len(report.models_evaluated) == 3
    assert "categories" in report.radar_chart_data
    assert len(report.radar_chart_data["categories"]) == 5
    assert len(report.radar_chart_data["series"]) == 3


def test_playground_endpoint():
    """Verify model arena playground endpoint."""
    payload = {
        "prompt": "Extract name and role from: 'Alice is a Senior AI Engineer'",
        "models": ["base_slm", "finetuned_slm"],
        "evaluate_live": True
    }
    response = client.post("/api/playground/prompt", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "base_slm" in data["results"]
    assert "finetuned_slm" in data["results"]
