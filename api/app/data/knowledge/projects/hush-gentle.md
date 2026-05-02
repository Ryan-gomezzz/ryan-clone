---
title: Hush Gentle
type: project
priority: 5
status: shipped
---

# Hush Gentle

**Full-stack B2C skincare e-commerce site. End-to-end build — frontend, backend, payments, transactional email, deployment.**

## Stack

Next.js 16 (App Router), React 18, TypeScript, Tailwind, Supabase (Postgres + Auth + Storage), Supabase RLS for the data isolation, Cashfree as the payment processor (India-native), Resend for transactional email, Vercel for hosting.

## Architectural decision

RLS-first auth model. Every product, order, and customer row carries explicit policy on who can read and who can mutate, enforced at the database level. The app code can't accidentally leak data because the database refuses to serve it under the wrong identity. This is the right pattern for a small B2C site where you want to ship fast without writing your own permission middleware.

## What was hard

Cashfree's webhook reliability. India payment processing has more edge cases than the US — failed-but-charged states, deferred captures, refund flows that don't cleanly map onto the standard checkout state machine. We built an idempotency layer around the webhooks and a manual reconciliation tool for the merchant.

## What shipped

Live store handling real orders. Catalog, cart, checkout, order confirmation email, basic admin panel for the merchant.
