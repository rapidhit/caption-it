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

const app = Fastify({ logger: true, bodyLimit: MAX_MB * 1024 * 1024 });

await app.register(multipart, {
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
});

app.get("/api/health", async () => ({ ok: true }));

app.post("/api/caption", async (req, reply) => {
  const work = await mkdtemp(join(tmpdir(), "cap-"));
  const inPath = join(work, "in.mp4");
  const wavPath = join(work, "audio.wav");
  const assPath = join(work, "caps.ass");
  const outPath = join(work, "out.mp4");

  try {
    let config = null;
    let gotVideo = false;

    for await (const part of req.parts()) {
      if (part.type === "file" && part.fieldname === "video") {
        await writeFile(inPath, await part.toBuffer());
        gotVideo = true;
      } else if (part.type === "field" && part.fieldname === "config") {
        try { config = JSON.parse(part.value); } catch { /* keep null */ }
      }
    }

    if (!gotVideo) { reply.code(400); return "No video uploaded."; }
    if (!config) { reply.code(400); return "Missing style config."; }

    req.log.info("probing video");
    const { width, height } = await probeSize(inPath);

    req.log.info("extracting audio");
    await extractAudio(inPath, wavPath);

    req.log.info("transcribing with Groq");
    const words = await transcribe(wavPath);

    req.log.info(`building ass (${words.length} words)`);
    const ass = buildAss(words, config, width, height);
    await writeFile(assPath, ass, "utf8");

    req.log.info("burning captions");
    await burn(work, "in.mp4", "caps.ass", "out.mp4");

    const buf = await readFile(outPath);
    reply.header("Content-Type", "video/mp4");
    reply.header("Content-Disposition", 'attachment; filename="captioned.mp4"');
    return buf;
  } catch (err) {
    req.log.error(err);
    reply.code(500);
    return err.message || "Captioning failed.";
  } finally {
    rm(work, { recursive: true, force: true }).catch(() => {});
  }
});

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
