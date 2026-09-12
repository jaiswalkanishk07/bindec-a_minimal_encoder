# Bindec

Binary ↔ decimal console (hex/octal on the same engine). Local core + Fastify API.

## Develop

```bash
npm install
npm test
npm run dev
```

Web: http://localhost:5173  
API: http://localhost:8787/v1/health

## API

- `GET /v1/health`
- `GET /v1/meta`
- `POST /v1/validate`
- `POST /v1/convert`
- `POST /v1/explain`
- `GET /v1/convert?from=bin&to=dec&value=1011`

Body: `{ "value": "1011", "from": "bin", "to": "dec", "signed": false, "bitWidth": 8 }`  
Results are strings (BigInt-safe).

## App later

```bash
cd apps/web
npx cap init
npx cap add android
```
