# Architecture

MẦM is a Next.js App Router application. Public pages can be used without a student account. Server routes own all validation, model calls, safety routing, rate limits, and optional persistence.

## Chat path

```text
student message
  → schema validation + rate limit
  → deterministic Vietnamese safety rules
  → optional OpenRouter safety model (may only escalate)
  → support-level policy
  → OpenRouter conversational model
  → deterministic + optional model output validation
  → client response and safety UI
```

Red safety is answered by a deterministic, short, action-oriented response without waiting for the main conversational model. If the provider, guardrail, or output validation fails, it cannot lower a deterministic safety level.

## Data boundary

Guest chat is not persisted by this MVP. The optional PostgreSQL table stores only a student-submitted support request, never a full chat transcript. Technical analytics are intentionally absent until a school approves a minimal, aggregate measurement plan.

## Providers

`lib/ai/types.ts` defines the provider contracts. `OpenRouterChatProvider` is an implementation, not an application-wide dependency. API keys are available only on the server.

## School configuration

School support details are supplied as a verified structured configuration through `SCHOOL_SUPPORT_CONFIG_JSON`. Blank/malformed configuration produces no contacts; it does not produce a substitute or invented contact.
