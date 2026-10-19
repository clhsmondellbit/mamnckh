# Safety design

MẦM is an AI support bridge, not an autonomous crisis responder. Its priority is safety, then listening, understanding, guidance, and human connection.

## Support levels

- **Green:** ordinary difficulty. The assistant listens, clarifies, and helps choose a small practical step.
- **Yellow:** persistent, materially disruptive, or serious difficulty. The assistant keeps support non-diagnostic and explicitly encourages a trusted adult or configured school support.
- **Red:** immediate safety concern, self-harm/suicide signal or plan, serious violence, abuse, or immediate danger. Normal coaching stops. The UI directs the student to a nearby trusted adult, verified school support, and appropriate local emergency/professional support.

## Layers

1. Deterministic Vietnamese safety rules are evaluated first and can only be escalated.
2. The optional guardrail model can raise, never lower, a result.
3. Red mode has a deterministic response and does not wait for the conversational model.
4. Conversational model output is checked before it reaches the UI.
5. A provider failure shows a transparent unavailable message; it does not fabricate an answer.

## Operational limits

The deterministic rules are an auditable starting layer, not a clinical classifier. Schools must test them with their approved scenario set, review Vietnamese language variations, configure verified contacts, train authorized staff, and define after-hours procedures before deployment.

MẦM must never provide dangerous instructions, minimize immediate danger, promise absolute secrecy, diagnose a condition, or encourage secrecy from a responsible adult.
