---
title: SOYL AI LLM Fine-Tuning
type: project
priority: 7
status: ongoing
---

# SOYL AI LLM Fine-Tuning

**QLoRA fine-tuning of Llama 3.1 8B on hospitality-domain data for the SOYL agent layer.**

## Stack

Llama 3.1 8B base, PEFT for the LoRA adapters, trl SFTTrainer for the training loop, bitsandbytes 4-bit quantization for the QLoRA setup, WandB for experiment tracking, A100 + H100 instances on burst capacity for training runs.

## Why fine-tune at all

We use Claude Sonnet for the persona and reasoning in the production loop because the prose quality and tool-use are best-in-class. We fine-tune Llama 3.1 8B for the **utility layer** — narrow, high-frequency tasks where a small model running on our own hardware is the right cost/latency answer. Examples: SOP-grounded response drafting, reservation summarization, intent classification on the voice front-door, F&B order normalization.

## Architectural decision

We don't try to fine-tune one model to replace Claude. That's an expensive way to lose. We fine-tune small models for specific deterministic tasks where Claude is overkill, and we route between them via the orchestrator. The fine-tuned Llama instances run on AMD Ryzen AI NPUs at the property edge — keeps the latency floor low and cuts cloud spend.

## What was hard

Getting clean data. Hospitality SOPs and guest interaction logs come in 14 different formats per chain — PDFs, Word docs, ad-hoc spreadsheets, screenshots of front-desk scripts. The data prep pipeline turned into more work than the actual training.

## What shipped

Working LoRA adapters for intent classification (~94% on our validation set vs 87% from zero-shot Llama base) and SOP response drafting (deployed in the pilot, qualitative wins are clear, quantitative metrics gathering as the pilot scales).
