# Frontend Vite Deployment

## Development

- Run frontend against local backend: `pnpm dev` or `pnpm dev:local`
- Run frontend against deployed backend: `pnpm dev:server`
- Run backend separately on `http://localhost:3001`.
- In development, `VITE_API_URL` can point directly to a backend such as `http://localhost:3001`.

## Environment

```env
VITE_API_URL=
```

`.env.server` is used by `pnpm dev:server`:

```env
VITE_API_URL=https://court-management-api.onrender.com
```

- Production builds call `/api` on the same origin. `vercel.json` rewrites `/api/*` to the backend before the SPA fallback.
- Leave `VITE_API_URL` empty in production. It is only used outside production for direct local/dev calls.
- Set `VITE_API_URL=https://your-api.example.com` only for local/dev modes that intentionally call a different backend origin.

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
