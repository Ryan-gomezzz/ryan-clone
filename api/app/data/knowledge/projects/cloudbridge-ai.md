---
title: CloudBridge AI
type: project
priority: 4
status: hackathon
---

# CloudBridge AI

**24-hour hackathon project. Automated GCP-to-AWS migration assistant with FinOps cost analysis. Won the cloud migration track.**

## Stack

AWS Lambda + API Gateway as the serverless front end, three-Lambda pipeline (resource scan → migration plan → cost forecast), Bedrock with Claude 3.5 Sonnet as the reasoning layer, AWS Pricing API for the FinOps numbers.

## What it does

Point it at a GCP project. It enumerates the resources, generates a target-architecture plan in AWS equivalents, runs the cost forecast against AWS Pricing API, and surfaces the FinOps delta. Output: a migration plan you can hand to a cloud engineer with the numbers attached.

## Architectural decision

Three Lambdas, not one monolith. Each Lambda has one job and the orchestration sits in API Gateway. This was a 24h hackathon so the call was about iteration speed — you can rewrite one of three small functions in 20 minutes; you can't rewrite a monolithic Lambda in 20 minutes when the deadline is 4am.

## Outcome

Won the migration track. Useful as a portfolio example of pragmatic LLM-in-the-loop tooling — Claude isn't doing magic, it's doing the boring tedious mapping work that takes a cloud engineer hours.
