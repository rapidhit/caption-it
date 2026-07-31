// Thin wrappers around ffmpeg/ffprobe via child_process.
import { spawn } from "node:child_process";

// onStdout(chunk) is called with each stdout chunk as it streams (used for
// ffmpeg -progress parsing). stdout is still accumulated and resolved at close.
function run(cmd, args, opts = {}, onStdout = null) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, opts);
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    let out = "";
    p.stdout.on("data", (d) => {
      const s = d.toString();
      out += s;
      if (onStdout) onStdout(s);
    });
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
    "-show_entries", "stream=width,height:format=duration",
    "-of", "json",
    inputPath,
  ]);
  const j = JSON.parse(out);
  const s = j.streams?.[0] || {};
  const duration = parseFloat(j.format?.duration) || 0;
  return { width: s.width || 1080, height: s.height || 1920, duration };
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
// If duration (seconds) and onProgress are given, reports a 0..1 fraction as
// ffmpeg encodes, parsed from `-progress pipe:1` (out_time_us / total).
export async function burn(workDir, inputName, assName, outName, duration = 0, onProgress = null) {
  const args = [
    "-y", "-i", inputName,
    "-vf", `ass=${assName}`,
    "-c:a", "copy",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-movflags", "+faststart",
  ];
  if (duration > 0 && onProgress) args.push("-progress", "pipe:1", "-nostats");
  args.push(outName);

  let buf = "";
  await run("ffmpeg", args, { cwd: workDir }, (chunk) => {
    if (!(duration > 0 && onProgress)) return;
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line.startsWith("out_time_us=")) {
        const us = parseInt(line.slice(12), 10);
        if (Number.isFinite(us)) {
          onProgress(Math.max(0, Math.min(0.999, us / 1e6 / duration)));
        }
      } else if (line === "progress=end") {
        onProgress(1);
      }
    }
  });
}
