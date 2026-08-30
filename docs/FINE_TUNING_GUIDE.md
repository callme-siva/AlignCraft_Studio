# ⚡ The Comprehensive Guide to SLM Fine-Tuning with QLoRA

This guide covers the core mathematical, architectural, and practical engineering concepts behind **Parameter-Efficient Fine-Tuning (PEFT)** and **Quantized Low-Rank Adaptation (QLoRA)** for Small Language Models (SLMs).

---

## 1. Why Fine-Tune Small Language Models (SLMs)?

Frontier models (such as GPT-4o and Gemini 1.5 Pro) are extremely capable general reasoners, but in production they present three major trade-offs:
1. **High Latency**: 800ms – 2,500ms round-trips over public network APIs.
2. **High Recurring Cost**: Pay-per-token pricing scales linearly with user traffic.
3. **Data Privacy & Compliance**: Sensitive customer logs, financial records, or PII cannot always leave VPC boundaries.

**Small Language Models (1B – 3B parameters)** like **Llama 3.2 (1B/3B)**, **Gemma 2 (2B)**, and **Qwen 2.5 (1.5B/3B)** can run locally on edge hardware or cheap cloud instances (e.g. CPU or single T4/A10 GPU), achieving **<50ms latency** and **100% data residency**.

Through fine-tuning, a 1.5B model can match or exceed frontier model performance on specialized domain tasks such as:
- Strict JSON Schema extraction (with zero conversational preamble)
- Domain security triage & patch generation
- Defended tool parameter generation

---

## 2. LoRA & QLoRA Mechanics

### Full Fine-Tuning vs. LoRA
In full fine-tuning, every weight parameter matrix $W_0 \in \mathbb{R}^{d \times k}$ is updated:
$$W = W_0 + \Delta W$$
For a 3B model in 16-bit float, storing optimizer states (AdamW: momentum + variance) requires $>24\text{ GB}$ of VRAM.

### Low-Rank Decomposition (LoRA)
LoRA hypothesizes that the weight update $\Delta W$ has a low intrinsic dimension. Instead of updating $W_0$, it freezes $W_0$ and decomposes $\Delta W$ into two low-rank matrices $A$ and $B$:
$$\Delta W = B \cdot A$$
where $B \in \mathbb{R}^{d \times r}$ and $A \in \mathbb{R}^{r \times k}$ with rank $r \ll \min(d, k)$.

During forward pass:
$$h = W_0 x + \frac{\alpha}{r} (B A) x$$

* **Rank ($r$)**: Typical values are $8, 16, 32$. $r=16$ only introduces $\approx 0.1\%$ to $0.5\%$ trainable parameters!
* **Alpha ($\alpha$)**: Scaling constant that controls the magnitude of the adapter's influence. A rule of thumb is $\alpha = 2 \times r$.

### Quantized LoRA (QLoRA)
QLoRA introduces three innovations:
1. **NF4 (NormalFloat 4-bit)**: Information-theoretically optimal quantile quantization for normally distributed weights.
2. **Double Quantization**: Quantizes the quantization constants themselves, saving $\approx 0.37$ bits per parameter.
3. **Paged Optimizers**: Uses CUDA Unified Memory to page memory spikes to CPU RAM during long sequence training.

---

## 3. Target Module Selection

In standard transformer architectures, we target linear projection layers:
* `q_proj`, `v_proj`: Attention query and value projections (minimal adapter footprint).
* `k_proj`, `o_proj`: Key and output projections (recommended for high instruction-following capacity).
* `gate_proj`, `up_proj`, `down_proj`: MLP / Feed-Forward layers (recommended when learning new domain vocabulary).

---

## 4. Chat Templates & Tokenization

When instruction-tuning, prompt consistency is critical. Mismatched special tokens cause severe degradation.

### ChatML Format
```
<|im_start|>system
You are an aligned assistant.<|im_end|>
<|im_start|>user
Extract entity from: Log #401<|im_end|>
<|im_start|>assistant
{"entity": "auth-service"}<|im_end|>
```

### Stanford Alpaca Format
```json
{
  "instruction": "Extract entity from log.",
  "input": "Log #401: auth-service crashed",
  "output": "{\"entity\": \"auth-service\"}"
}
```

---

## 5. Exporting & Local Deployment

After fine-tuning:
1. **Merge LoRA weights**:
   ```python
   model = PeftModel.from_pretrained(base_model, adapter_path)
   merged = model.merge_and_unload()
   merged.save_pretrained("./merged_model")
   ```
2. **Convert to GGUF**:
   ```bash
   python3 llama.cpp/convert_hf_to_gguf.py ./merged_model --outtype q4_k_m
   ```
3. **Serve with Ollama**:
   ```bash
   ollama create my-aligned-slm -f Modelfile
   ollama run my-aligned-slm
   ```
