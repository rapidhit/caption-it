# Deploying Caption Forge on Coolify

Single-container app: Node 20 + ffmpeg builds the Vite frontend and serves both
the API and static site from Fastify on **port 8080**.

## 1. Create the resource

Coolify → **+ New** → **Application** → source: this GitHub repo
(`rapidhit/caption-it`, branch `main`).

- **Build Pack:** `Dockerfile` (not Nixpacks — the app needs ffmpeg + fonts from
  the Dockerfile).
- **Port (Ports Exposes):** `8080`
- Leave the base directory at repo root.

## 2. Environment variables

| Key             | Value                     | Notes                                  |
| --------------- | ------------------------- | -------------------------------------- |
| `GROQ_API_KEY`  | *your key*                | **Required** — transcription fails without it. Get one at https://console.groq.com/keys |
| `GROQ_MODEL`    | `whisper-large-v3`        | Optional, this is the default          |
| `MAX_UPLOAD_MB` | `250`                     | Optional; raise for longer videos      |
| `PORT`          | `8080`                    | Keep in sync with the exposed port     |

Mark `GROQ_API_KEY` as a build-time secret? No — it's runtime only. Add it as a
normal (non-build) variable.

## 3. Domain + health check

- Set the domain (e.g. `caption.rambodata.com`). Coolify provisions TLS via its
  Traefik + Let's Encrypt setup.
- Health check path: `/api/health` (returns `{ "ok": true }`). The Dockerfile
  also defines a `HEALTHCHECK`, so container health shows up automatically.

## 4. Deploy

Hit **Deploy**. First build installs ffmpeg and downloads caption fonts from
GitHub, so the build host needs outbound internet (normal on a Coolify VPS).

Enable **auto-deploy on push** so `git push origin main` redeploys.

## Gotchas specific to this app

- **Long requests:** captioning a video is one synchronous `POST /api/caption`
  that runs transcription + ffmpeg burn and streams back the whole MP4. Large
  videos can take minutes. If big uploads get cut off by a proxy idle timeout,
  raise Traefik's timeout via a custom label on the app, e.g.:

  ```
  traefik.http.serversTransports.captionforge.forwardingTimeouts.readTimeout=600s
  ```

  (Coolify → app → Advanced → Custom Traefik labels.) Start by testing with a
  short clip to confirm the pipeline before pushing a 200 MB file through it.

- **Upload size:** `MAX_UPLOAD_MB` caps it app-side (Fastify `bodyLimit`).
  Traefik doesn't impose a body-size limit by default, so the app value is the
  real ceiling.

- **No persistent volume needed:** work files live in the OS temp dir and are
  deleted after each request (`finally` block in `server/index.js`).

- **Memory at build:** the build is light, but if the VPS is tight on RAM (as
  the Lifeseal build was), a swapfile avoids OOM during `npm install` / vite build.
