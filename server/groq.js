// Transcribe an audio file with Groq Whisper and return word-level timestamps.
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export async function transcribe(wavPath) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set. Add it to your .env.");

  const buf = await readFile(wavPath);
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "audio/wav" }), basename(wavPath));
  form.append("model", process.env.GROQ_MODEL || "whisper-large-v3");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("language", "en");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq transcription failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();

  // Prefer real word timestamps.
  let words = Array.isArray(data.words)
    ? data.words
        .filter((w) => w && w.word != null && w.start != null && w.end != null)
        .map((w) => ({ word: String(w.word).trim(), start: +w.start, end: +w.end }))
        .filter((w) => w.word)
    : [];

  // Fallback: spread each segment's words evenly across its time span.
  if (!words.length && Array.isArray(data.segments)) {
    for (const seg of data.segments) {
      const toks = String(seg.text || "").trim().split(/\s+/).filter(Boolean);
      if (!toks.length) continue;
      const dur = (seg.end - seg.start) / toks.length;
      toks.forEach((tk, i) =>
        words.push({ word: tk, start: seg.start + i * dur, end: seg.start + (i + 1) * dur })
      );
    }
  }

  if (!words.length) throw new Error("No speech detected in the video's audio.");
  return words;
}
