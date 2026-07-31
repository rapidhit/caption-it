import Fastify from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { probeSize, extractAudio, burn } from "./ffmpeg.js";
import { transcribe } from "./groq.js";
import { buildAss } from "./ass.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIST = join(__dirname, "..", "web", "dist");
const PORT = process.env.PORT || 8080;
const MAX_MB = +(process.env.MAX_UPLOAD_MB || 250);
const JOB_TTL_MS = 10 * 60 * 1000; // orphaned jobs cleaned after 10 min

const app = Fastify({ logger: true, bodyLimit: MAX_MB * 1024 * 1024 });

await app.register(multipart, {
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
});

// ---- job store ----------------------------------------------------------
// jobId -> { work, paths, config, dims, pct, subs:Set<res>, last, done, error, createdAt }
const jobs = new Map();

function emit(job, data) {
  job.last = data;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of job.subs) { try { res.write(payload); } catch { /* dropped */ } }
}
function closeStreams(job) {
  for (const res of job.subs) { try { res.end(); } catch { /* ignore */ } }
  job.subs.clear();
}
function cleanup(job) {
  if (job?.work) rm(job.work, { recursive: true, force: true }).catch(() => {});
}

async function processJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;
  try {
    emit(job, { phase: "transcribing" });
    await extractAudio(job.inPath, job.wavPath);
    const words = await transcribe(job.wavPath);

    const ass = buildAss(words, job.config, job.width, job.height);
    await writeFile(job.assPath, ass, "utf8");

    emit(job, { phase: "burning", pct: 0 });
    await burn(job.work, "in.mp4", "caps.ass", "out.mp4", job.duration, (frac) => {
      const pct = Math.max(0, Math.min(99, Math.round(frac * 100)));
      if (pct !== job.pct) { job.pct = pct; emit(job, { phase: "burning", pct }); }
    });

    job.done = true;
    emit(job, { phase: "done" });
    closeStreams(job);
  } catch (err) {
    job.error = err.message || "Captioning failed.";
    emit(job, { phase: "error", message: job.error });
    closeStreams(job);
    cleanup(job); // no result to keep
  }
}

// ---- routes -------------------------------------------------------------
app.get("/api/health", async () => ({ ok: true }));

// Accepts the upload, queues the job, returns a jobId immediately. The heavy
// work (transcribe + burn) runs in the background; progress via SSE below.
app.post("/api/caption", async (req, reply) => {
  const work = await mkdtemp(join(tmpdir(), "cap-"));
  const inPath = join(work, "in.mp4");
  let config = null, gotVideo = false;

  for await (const part of req.parts()) {
    if (part.type === "file" && part.fieldname === "video") {
      await writeFile(inPath, await part.toBuffer());
      gotVideo = true;
    } else if (part.type === "field" && part.fieldname === "config") {
      try { config = JSON.parse(part.value); } catch { /* keep null */ }
    }
  }

  if (!gotVideo) { await rm(work, { recursive: true, force: true }).catch(() => {}); reply.code(400); return "No video uploaded."; }
  if (!config) { await rm(work, { recursive: true, force: true }).catch(() => {}); reply.code(400); return "Missing style config."; }

  let width = 1080, height = 1920, duration = 0;
  try { const m = await probeSize(inPath); width = m.width; height = m.height; duration = m.duration; }
  catch (e) { req.log.warn(`probe failed: ${e.message}`); }

  const jobId = randomUUID();
  jobs.set(jobId, {
    work, inPath,
    wavPath: join(work, "audio.wav"),
    assPath: join(work, "caps.ass"),
    outPath: join(work, "out.mp4"),
    config, width, height, duration,
    pct: 0, subs: new Set(), last: { phase: "queued" },
    done: false, error: null, createdAt: Date.now(),
  });

  processJob(jobId); // fire and forget
  return { jobId };
});

// Server-Sent Events: live phase + percentage for a job.
app.get("/api/progress/:id", (req, reply) => {
  const job = jobs.get(req.params.id);
  reply.hijack();
  const raw = reply.raw;
  raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  if (!job) { raw.write(`data: ${JSON.stringify({ phase: "error", message: "Job not found." })}\n\n`); raw.end(); return; }

  // Replay current state so a late subscriber is immediately in sync.
  if (job.last) raw.write(`data: ${JSON.stringify(job.last)}\n\n`);
  if (job.done) { raw.write(`data: ${JSON.stringify({ phase: "done" })}\n\n`); raw.end(); return; }
  if (job.error) { raw.write(`data: ${JSON.stringify({ phase: "error", message: job.error })}\n\n`); raw.end(); return; }

  job.subs.add(raw);
  const ping = setInterval(() => { try { raw.write(": ping\n\n"); } catch { /* ignore */ } }, 15000);
  req.raw.on("close", () => { clearInterval(ping); job.subs.delete(raw); });
});

// Download the finished MP4, then clean up the job.
app.get("/api/result/:id", async (req, reply) => {
  const job = jobs.get(req.params.id);
  if (!job || !job.done) { reply.code(404); return { error: "Result not ready." }; }
  const buf = await readFile(job.outPath);
  reply.header("Content-Type", "video/mp4");
  reply.header("Content-Disposition", 'attachment; filename="captioned.mp4"');
  reply.raw.on("finish", () => { cleanup(job); jobs.delete(req.params.id); });
  return buf;
});

// Sweep orphaned jobs (user never downloaded / tab closed mid-job).
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) { cleanup(job); jobs.delete(id); }
  }
}, 60 * 1000).unref();

// Serve the built frontend + SPA fallback.
await app.register(fastifyStatic, { root: WEB_DIST, wildcard: false });
app.setNotFoundHandler((req, reply) => {
  if (req.raw.url && req.raw.url.startsWith("/api")) {
    reply.code(404).send({ error: "Not found" });
  } else {
    reply.sendFile("index.html");
  }
});

app.listen({ port: PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`Caption Forge on :${PORT}`))
  .catch((e) => { app.log.error(e); process.exit(1); });
