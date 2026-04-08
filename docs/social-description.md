# Social Descriptions

Reference text for sharing Graceful Boundaries across platforms.

## GitHub repository

**Description:**
A specification for how services communicate operational limits to humans and autonomous agents.

**Topics:**
specification, rate-limiting, api, autonomous-agents, http, 429, conformance, structured-refusal, limits-discovery

**Website:**
https://gracefulboundaries.dev

## Twitter / X

**Short (under 280 chars):**
Graceful Boundaries: a spec for how APIs communicate limits to humans and agents. Discovery before failure. Structured refusal with reasons. Constructive guidance instead of bare 429s. CC-BY-4.0.

https://gracefulboundaries.dev

## LinkedIn

**Post text:**
Every unclear API response generates follow-up traffic. A bare 429 causes blind retries. When autonomous agents are the caller, the waste compounds -- agents retry faster and probe more systematically.

Graceful Boundaries is an open specification (CC-BY-4.0) for how services communicate their operational limits. Three ideas:

1. Publish limits before callers hit them (proactive discovery)
2. When you do refuse, explain what happened, why, and what to do next (structured refusal)
3. Offer alternatives -- a cached result, a different endpoint, an upgrade path (constructive guidance)

Four conformance levels from "structured refusal" to "proactive headers on every success response." An eval suite validates any public API. A reference implementation demonstrates all four levels.

https://gracefulboundaries.dev

## Hacker News

**Title:**
Graceful Boundaries -- A spec for how APIs communicate limits to humans and agents

**URL:**
https://gracefulboundaries.dev
