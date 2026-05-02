---
title: StoreCraft AI / web_gen
type: project
priority: 5
status: prototype
---

# StoreCraft AI (web_gen)

**Multi-agent AI website generator that produces deployable Next.js sites from a structured questionnaire.**

## Stack

Multi-agent pipeline (planner → designer → component-writer → integrator), Claude as the reasoning layer, Next.js 14 as the output target, Vercel as the default deploy surface, structured questionnaires as the input contract.

## Architectural decision

The agents don't generate code free-form. Each agent emits structured output against a tight schema — page graph, component tree, content map — and the integrator deterministically assembles the final Next.js project from those artifacts. This is the only way to get reliable, modifiable output at agent-system scale; free-form code generation produces sites you can't extend.

## What shipped

Working prototype that takes a questionnaire and emits a deployable Next.js site for a small business landing page in roughly 4 minutes. Quality varies by domain — restaurants and clinics work well, e-commerce hits edge cases on the cart flow.

## Status

Prototype, on the back burner while SOYL PMS is the priority. The interesting research question — how do you get multi-agent code generation to produce *editable* output, not just runnable output — is still open.
