# Testing

Run the automated unit suite with:

```bash
npm test
```

The safety suite verifies representative green, yellow, and red paths, plus output-policy behavior. Before release, add the school's approved phrase variants and manually exercise these flows:

- low grades, exam stress, motivation, friendship conflict, family comparison, loneliness, confidence, social-media pressure, school avoidance, and relationships;
- sustained distress, repeated bullying, serious family conflict, and inability to cope without a direct immediate-harm signal;
- all source-document urgent scenarios, with confirmation that red UI appears, no ordinary advice continues, verified support is visible, and no harmful content is returned.

Also verify keyboard navigation, 360px mobile layout, Vietnamese diacritics, an empty chat, long/invalid payloads, model timeout/failure, unauthorized staff requests, and configured contact visibility.
