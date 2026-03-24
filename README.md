# clash-royale-proxy

 Minimal reverse proxy for the Clash Royale API. Forwards incoming requests to `api.clashroyale.com`, so only the server IP needs to be whitelisted.

## What it does

- Accepts incoming HTTP requests on your server
- Forwards them to `https://api.clashroyale.com/v1/...`
- Preserves method, path, query string, headers, and raw body as closely as practical
- Passes through the incoming `Authorization` header unchanged when present

This is intentionally limited to the Clash Royale API. It is not an open proxy.

## Requirements

- Node.js 18+

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Default port is `8080`.

## Run with Docker

Build and start with Docker Compose:

```bash
docker compose up -d --build
```

Stop the container:

```bash
docker compose down
```

If you want to provide runtime settings via an `.env` file next to `docker-compose.yml`:

```env
ENABLE_CORS=false
BODY_LIMIT=10mb
```

## Environment variables

- `PORT`: Port to listen on. Default: `8080`
- `ENABLE_CORS`: Set to `true` to enable permissive CORS headers
- `BODY_LIMIT`: Max accepted request body size. Default: `10mb`

## Endpoints

- `GET /health`: Simple health check
- `/clash/*`: Reverse proxy entrypoint

## Example

```bash
curl "http://localhost:8080/clash/cards" \
  -H "Authorization: Bearer <token>"
```

## Path mapping

- `GET /clash/cards` -> `GET https://api.clashroyale.com/v1/cards`
- `GET /clash/players/%23ABC123` -> `GET https://api.clashroyale.com/v1/players/%23ABC123`

## Deployment notes

- Whitelist the cloud server IP in the Clash Royale developer portal
- Put HTTPS in front of this service with Nginx, Caddy, or a load balancer
- Add rate limiting if the service is reachable from the public internet
