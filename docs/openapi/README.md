# DigiHouse OpenAPI

- Spec: [`digihouse-v0.yaml`](./digihouse-v0.yaml) (OpenAPI **3.1.0**, Phase 0 skeleton)
- Implements parity with `src/lib/api/repos.ts` + EXECUTION-PLAN P0-05

## Validate

```bash
npx --yes @redocly/cli lint docs/openapi/digihouse-v0.yaml
```

Fallback:

```bash
npx --yes @apidevtools/swagger-cli validate docs/openapi/digihouse-v0.yaml
```

CI gate expected in Phase 1 (P1-19).
