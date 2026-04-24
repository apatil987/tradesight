# TradeSight — CLAUDE.md

## What This App Is
AI trading coach. Users log trades manually and get:
- A performance score (0-100) per trade
- What-if analysis (what if I held longer?)
- Behavioral insights (revenge trading, best time of day, etc.)

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (auth + database + file storage)
- Recharts for charts
- Claude API for screenshot parsing and AI coaching
- yFinance for market price data

## Current Build Phase
Phase 1 — project setup and scaffolding

## Project Structure
- src/app — Next.js pages and routes
- src/components/ui — reusable UI components
- src/components/charts — chart components
- src/components/trades — trade-specific components
- src/lib/ai — all Claude API calls go here only
- src/lib/scoring — trade scoring logic
- src/lib/db — all Supabase queries
- src/types/index.ts — all shared TypeScript types
- docs/product-plan.md — full product requirements, read this for feature context

## Rules
- Always write TypeScript, never plain JS
- Never put API keys in client-side code
- Don't build Phase 2+ features while in Phase 1
- Keep components small, split if over 150 lines
- Write a plan before creating any new files

## Data Model
users: id, email, created_at
trades: id, user_id, ticker, asset_type, option_type, strike,
        expiration, quantity, entry_price, exit_price,
        entry_time, exit_time, pnl, score, notes, tags

## Scoring Formula (v1)
Trade Score = 40% Entry Score + 40% Exit Score + 20% Profit Capture
- Entry: did price move in your direction after entry?
- Exit: what % of max possible profit did you exit at?
- Capture: actual_profit / max_possible_profit