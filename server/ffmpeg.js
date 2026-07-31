// Thin wrappers around ffmpeg/ffprobe via child_process.
import { spawn } from "node:child_process";

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, opts);
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    let out = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}: ${err.slice(-500)}`))
    );
  });
}

export async function probeSize(inputPath) {
  const out = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "json",
    inputPath,
  ]);
  const s = JSON.parse(out).streams?.[0] || {};
  return { width: s.width || 1080, height: s.height || 1920 };
}

export async function extractAudio(inputPath, wavPath) {
  await run("ffmpeg", [
    "-y", "-i", inputPath,
    "-vn", "-ac", "1", "-ar", "16000",
    "-c:a", "pcm_s16le",
    wavPath,
  ]);
}

// Burn the .ass onto the video. Runs with cwd = work dir so the relative
// filename avoids the path-escaping headaches libass has with colons.
export async function burn(workDir, inputName, assName, outName) {
  await run(
    "ffmpeg",
    [
      "-y", "-i", inputName,
      "-vf", `ass=${assName}`,
      "-c:a", "copy",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
      "-movflags", "+faststart",
      outName,
    ],
    { cwd: workDir }
  );
}
