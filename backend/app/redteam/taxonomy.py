"""Threat taxonomy and severity weighting for LLM Red-Teaming."""
from typing import Dict, Any
from app.models.schemas import AttackCategory, ThreatSeverity

TAXONOMY_DESCRIPTIONS: Dict[AttackCategory, Dict[str, Any]] = {
    AttackCategory.DIRECT_JAILBREAK: {
        "title": "Direct Jailbreak (Persona / Mode Switch)",
        "description": "Exploits psychological persona framing (e.g. DAN, Developer Mode, Fiction framing) to convince the LLM that standard safety filters are disabled.",
        "default_severity": ThreatSeverity.CRITICAL,
        "mitigation": "SFT alignment with adversarial rejection pairs & system prompt reinforcement."
    },
    AttackCategory.INDIRECT_INJECTION: {
        "title": "Indirect Prompt Injection",
        "description": "Adversarial instructions concealed inside external data (webpages, documents, markdown, database rows) ingested by the LLM.",
        "default_severity": ThreatSeverity.HIGH,
        "mitigation": "Strict context isolation, XML delimiters, and dual-context evaluation."
    },
    AttackCategory.SYSTEM_LEAKAGE: {
        "title": "System Prompt & Confidential Leakage",
        "description": "Probing attacks designed to extract confidential system instructions, proprietary guardrails, or hardcoded secrets verbatim.",
        "default_severity": ThreatSeverity.MEDIUM,
        "mitigation": "Instruction tuning against verbatim echo requests and guardrail defense layers."
    },
    AttackCategory.MALICIOUS_EXECUTION: {
        "title": "Malicious Tool & Code Exploitation",
        "description": "Prompting the model to invoke destructive tool parameters, execute bash fork bombs, or create malware.",
        "default_severity": ThreatSeverity.CRITICAL,
        "mitigation": "Strict AST validation, sandbox isolation, and human-in-the-loop gates."
    },
    AttackCategory.SYCOPHANCY_GASLIGHT: {
        "title": "Sycophancy & Gaslighting Pressure",
        "description": "Testing whether the model collapses and agrees with factually false or dangerous premises when pressured by an authoritative user.",
        "default_severity": ThreatSeverity.MEDIUM,
        "mitigation": "RLHF/DPO calibration for epistemic humility and objective truth adherence."
    },
    AttackCategory.POLICY_EVASION: {
        "title": "Obfuscation & Policy Evasion",
        "description": "Encoding malicious payloads using Base64, ROT13, Leetspeak, or multilingual translation to bypass naive keyword filters.",
        "default_severity": ThreatSeverity.HIGH,
        "mitigation": "Multi-token semantic safety classifiers and token-level guardrails."
    }
}
