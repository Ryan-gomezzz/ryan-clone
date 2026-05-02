---
title: SOYL Agency Website
type: project
priority: 6
status: in_implementation
---

# SOYL Agency Website

**The dark-cinematic creative-agency front for SOYL. Co-built with Siddharth.**

## Stack

Next.js 14 (App Router), TypeScript, Framer Motion v11 for the page-level motion, React Three Fiber + drei for the ambient 3D scenes, GSAP + ScrollTrigger for the scroll-driven case-study sequences, Lenis for the smooth scroll, Tailwind + CSS variables for the theming, Zustand for client state.

## Aesthetic

Warm amber and gold over near-black. Film grain overlay. Editorial display serifs (Editorial New / PP Editorial New) over technical mono. Slow vignettes. The reference language is studionamma.com, aino.agency, nullmask.io. The point is to look like a Berlin / São Paulo creative studio that happens to ship AI systems, not a Bangalore SaaS shop.

## Architectural decision

We resisted the urge to make this a "showcase of AI capability." It's an agency site. The AI work shows up in the case studies — SOYL PMS, the hospitality voice agents, the fine-tuning playbook — not in the chrome. Restraint in the chrome is the differentiator; the market is saturated with sites that animate every header to prove the team can use Framer Motion.

## What was hard

Color and grain calibration. Warm amber on near-black falls apart fast on uncalibrated displays — too saturated and it looks like a bad nightclub flyer, too desaturated and it looks like every other dark-mode site. We iterated on the palette for two weeks before it sat right.

## Status

In implementation. Hero, about, and one full case study are live in staging. Targeting public launch alongside the next SOYL pilot announcement.
