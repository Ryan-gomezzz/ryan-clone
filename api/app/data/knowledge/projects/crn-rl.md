---
title: CRN RL Research (TD3 for Cognitive Radio Networks)
type: project
priority: 7
status: in_progress
deadline: 2026-05-15
---

# CRN RL — TD3 for Dynamic Power Allocation in Cognitive Radio Networks

**Reinforcement learning research project. Submission deadline May 15, 2026.**

## The problem

In a Cognitive Radio Network you have primary users (PUs) who own the spectrum and secondary users (SUs) who can opportunistically transmit when the PUs are idle. The control problem is: how does an SU dynamically allocate transmit power across available channels to maximize its own throughput while staying under the interference constraint of the PUs, when PU activity is non-stationary and only partially observable?

Classical convex optimization handles the static case fine. It breaks under realistic non-stationarity, which is what motivates the RL approach.

## Approach

TD3 — Twin Delayed DDPG. The action space is continuous (power level per channel), and TD3's two key tricks — clipped double-Q to fight overestimation bias, delayed policy updates, target policy smoothing — are exactly what was killing my reward curves on vanilla DDPG.

Stack: Python, numpy, PyTorch for the actor-critic networks, Gymnasium for the environment.

## Why Gymnasium over OpenEnv

OpenEnv's HTTP-based environment interface is great for distributed training and language-model agents, but at PHY-layer simulation rates (steps in the millisecond range) the HTTP serialization overhead destroys the wall-clock training time. Gymnasium's in-process API is the right call here. I evaluated both, kept the OpenEnv work for the hackathon track, and switched the research env to Gymnasium.

## What's hard

The reward shaping. The naive reward — "throughput minus an interference penalty" — underexplores. The PU activity model needs to be realistic enough that the trained policy generalizes off-distribution, but tractable enough that training converges in the time budget I have. I'm using a semi-Markov PU model with empirically calibrated transition rates.

## Status

In progress. Training runs producing reasonable curves. Paper draft underway. Submission deadline May 15, 2026.
