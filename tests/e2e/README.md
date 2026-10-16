# HTTP smoke test

`npm run test:e2e` checks the compiled public routes and confirms that a high-risk message reaches the red safety response without requiring an AI provider key.

Start the production server first, then run:

```bash
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```
