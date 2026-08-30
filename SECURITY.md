# Security Policy

## Supported Versions
| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability
If you discover a security vulnerability in AlignCraft Studio, please do not create a public issue. Instead, report it directly to security maintainers.

## Threat Model
* **Execution Boundary**: Training scripts and adversarial prompts are sandboxed or simulated.
* **Credential Hygiene**: API keys are only loaded from environment variables and never logged or serialized to client UI state.
* **Adversarial Safety**: Attack payloads are provided strictly for defensive benchmarking, model alignment, and educational research.
