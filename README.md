# Caption Forge

Upload a video, get it back with accurate, word-by-word captions burned in.
Single Docker image: Fastify backend + React studio + FFmpeg + Groq Whisper.

## How it works

1. You pick a caption style in the studio and upload a video.
2. Backend extracts the audio and sends it to **Groq Whisper** for word-level timestamps.
3. Those timestamps + your style config become a timed `.ass` subtitle file.
4. **FFmpeg (libass)** burns the captions into the video.
5. You download the finished MP4.

Transcription is English-only right now (set in `server/groq.js`). Provider is
swappable later — everything provider-specific lives in that one file.

## Deploy on Coolify

1. Push this repo to GitHub (e.g. `rapidhit/caption-forge`).
2. In Coolify: **New Resource → Application → your repo**. It auto-detects the
   `Dockerfile`. (Or use "Docker Compose" and point at `docker-compose.yml`.)
3. Set the **port** to `8080`.
4. Add environment variables:
   - `GROQ_API_KEY` — from https://console.groq.com/keys
   - `MAX_UPLOAD_MB` — optional, default `250`
5. Deploy. Point a subdomain at it (e.g. `caption.rambodata.com`).

The image installs ffmpeg and the five caption fonts (Anton, Bebas Neue,
Archivo Black, Montserrat, Inter) so the burned output matches the studio preview.

## Run locally

```bash
cp .env.example .env      # add your GROQ_API_KEY
npm install
npm run dev               # studio on :5173, API on :8080
```

Or the production image:

```bash
docker compose up --build
# open http://localhost:8080
```

## Notes & limits

- **Fonts must match.** The studio previews with web fonts; the burn uses fonts
  installed in the image. If you add a font to the studio list, add it to the
  Dockerfile too, or the output won't match.
- **Processing is synchronous.** One request runs transcribe + burn end to end
  (roughly real-time-ish per minute of video). For heavy load, move the job to a
  queue (BullMQ + Redis) and poll for the result — the pipeline functions in
  `server/` already return cleanly, so wrapping them in a worker is straightforward.
- **Upload size** is capped by `MAX_UPLOAD_MB`. Bump it for longer videos, and
  make sure Coolify's proxy body limit allows it too.
- **Cost.** Groq Whisper is billed per audio-hour and is very cheap; you pay only
  for the audio length, not the video size.

## Project layout

```
server/
  index.js     Fastify app: static serve + /api/caption pipeline
  groq.js      transcription (swap provider here)
  ass.js       word timestamps + style config -> timed .ass
  ffmpeg.js    probe / extract audio / burn
web/
  src/App.jsx  the caption studio (style + upload + render)
Dockerfile     node + ffmpeg + fonts
```
