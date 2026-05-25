# Frontend Vite Deployment

## Development

- Run frontend against local backend: `pnpm dev` or `pnpm dev:local`
- Run frontend against deployed backend: `pnpm dev:server`
- Run backend separately on `http://localhost:3001`.
- Vite proxies `/api` to `VITE_DEV_API_URL`, default `http://localhost:3001`.

## Environment

```env
VITE_API_URL=
VITE_DEV_API_URL=http://localhost:3001
```

`.env.server` is used by `pnpm dev:server`:

```env
VITE_DEV_API_URL=https://court-management-api.onrender.com
```

- Leave `VITE_API_URL` empty when the production host reverse-proxies `/api` to the backend.
- Set `VITE_API_URL=https://your-api.example.com` only when calling a different backend origin.

## Production Hosting

Build static assets:

```bash
pnpm build
```

Serve the `dist` directory with SPA fallback: every non-file route such as `/files/:id`, `/qr/boxes/:id`, and `/admin/boxes` must return `index.html`.

## Cookies and CORS

The backend session cookie is `HttpOnly` and sent with `credentials: include`.

- Same-origin deployment is preferred: frontend and backend share one origin and `/api` is reverse-proxied.
- Cross-origin deployment requires backend CORS to allow the frontend origin and credentials.
- In production over HTTPS, the backend sets secure cookies when `NODE_ENV=production`.
