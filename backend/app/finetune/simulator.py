"""Training lifecycle simulator and telemetry engine with SSE streaming."""
import asyncio
import math
import random
import time
import uuid
from typing import AsyncGenerator, Dict, Any, Optional
from app.models.schemas import (
    FineTuneConfig, TrainingJob, TrainingStatus, TrainingStepMetric
)


class TrainingJobManager:
    """Manages active and historical fine-tuning jobs."""

    def __init__(self):
        self.jobs: Dict[str, TrainingJob] = {}
        self.active_job_id: Optional[str] = None

    def create_job(self, config: FineTuneConfig) -> TrainingJob:
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        total_steps = config.epochs * 25  # standard 25 steps per epoch for demonstration
        job = TrainingJob(
            id=job_id,
            config=config,
            status=TrainingStatus.PREPARING,
            current_step=0,
            total_steps=total_steps,
            start_time=time.time()
        )
        self.jobs[job_id] = job
        self.active_job_id = job_id
        return job

    def get_job(self, job_id: str) -> Optional[TrainingJob]:
        return self.jobs.get(job_id)

    async def stream_training_progress(self, job_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Simulates realistic QLoRA loss convergence, perplexity, and learning rate scheduling
        with live Server-Sent Events (SSE).
        """
        job = self.get_job(job_id)
        if not job:
            yield {"event": "error", "data": {"message": "Job not found"}}
            return

        job.status = TrainingStatus.TRAINING
        yield {
            "event": "status",
            "data": {
                "job_id": job.id,
                "status": job.status,
                "message": f"Quantizing base weights to {job.config.quantization}... Initializing LoRA adapters (r={job.config.lora_r}, alpha={job.config.lora_alpha})."
            }
        }
        await asyncio.sleep(1.0)

        # Baseline loss parameters
        initial_loss = 2.45
        min_loss = 0.42
        total_steps = job.total_steps
        warmup_steps = int(total_steps * job.config.warmup_ratio)

        for step in range(1, total_steps + 1):
            job.current_step = step
            progress = step / total_steps
            epoch = round((step / total_steps) * job.config.epochs, 2)

            # Realistic exponential decay loss curve with noise
            decay_factor = math.exp(-3.5 * progress)
            noise = (random.random() - 0.5) * 0.08 * (1.0 - 0.5 * progress)
            train_loss = max(min_loss, round(min_loss + (initial_loss - min_loss) * decay_factor + noise, 4))
            
            eval_loss = None
            if step % 5 == 0 or step == total_steps:
                eval_loss = round(train_loss + 0.06 + (random.random() * 0.03), 4)

            # Cosine learning rate calculation
            if step <= warmup_steps:
                lr = job.config.learning_rate * (step / max(warmup_steps, 1))
            else:
                cosine_progress = (step - warmup_steps) / max(total_steps - warmup_steps, 1)
                lr = job.config.learning_rate * 0.5 * (1.0 + math.cos(math.pi * cosine_progress))

            grad_norm = round(max(0.1, 1.2 * (1.0 - 0.6 * progress) + (random.random() - 0.5) * 0.2), 3)
            perplexity = round(math.exp(min(train_loss, 4.0)), 2)

            metric = TrainingStepMetric(
                step=step,
                total_steps=total_steps,
                epoch=epoch,
                train_loss=train_loss,
                eval_loss=eval_loss,
                learning_rate=round(lr, 8),
                grad_norm=grad_norm,
                perplexity=perplexity
            )
            job.metrics_history.append(metric)

            yield {
                "event": "metric",
                "data": metric.model_dump()
            }

            # Slight delay between steps for streaming animation UX (0.15s per step)
            await asyncio.sleep(0.15)

        job.status = TrainingStatus.COMPLETED
        job.end_time = time.time()
        job.adapter_path = f"./runs/{job.config.run_name}/adapter"

        yield {
            "event": "completed",
            "data": {
                "job_id": job.id,
                "status": job.status,
                "adapter_path": job.adapter_path,
                "final_loss": job.metrics_history[-1].train_loss,
                "final_perplexity": job.metrics_history[-1].perplexity,
                "message": "✅ Supervised Fine-Tuning successfully completed! LoRA adapter weights saved."
            }
        }


training_manager = TrainingJobManager()
