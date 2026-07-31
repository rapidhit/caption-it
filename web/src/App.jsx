import React, { useState, useEffect, useRef, useMemo } from "react";

/* Caption Forge — pick a style, preview it, then burn real captions in. */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bebas+Neue&family=Inter:wght@400;600;700;900&family=Montserrat:wght@700;800;900&display=swap');
.cf-root{--bg:#0E0E13;--panel:#16161E;--panel2:#1E1E27;--line:#2A2A35;--ink:#ECECF2;
  --mute:#8B8B99;--accent:#FFE14D;--mint:#00E0B8;--red:#FF5C57;
  font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh;}
.cf-root *{box-sizing:border-box;}
.cf-top{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;
  border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(14,14,19,.85);
  backdrop-filter:blur(8px);z-index:20;}
.cf-brand{display:flex;align-items:center;gap:11px;}
.cf-dot{width:11px;height:11px;border-radius:3px;background:var(--accent);box-shadow:0 0 0 3px rgba(255,225,77,.15);}
.cf-brand h1{font-size:15px;margin:0;font-weight:800;letter-spacing:-.01em;}
.cf-brand span{font-size:11px;color:var(--mute);font-weight:600;}
.cf-grid{display:grid;grid-template-columns:290px 1fr 320px;gap:1px;background:var(--line);min-height:calc(100vh - 52px);}
.cf-col{background:var(--bg);padding:18px;overflow-y:auto;max-height:calc(100vh - 52px);}
.cf-stage{background:radial-gradient(120% 120% at 50% 0%,#191922 0%,#0B0B10 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;}
.cf-eyebrow{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--mute);font-weight:700;margin:0 0 12px;}
.cf-eyebrow.mt{margin-top:24px;}
.cf-preset{width:100%;text-align:left;border:1px solid var(--line);background:var(--panel);color:var(--ink);
  border-radius:10px;padding:11px 13px;margin-bottom:8px;cursor:pointer;transition:.15s;
  display:flex;align-items:center;justify-content:space-between;gap:8px;}
.cf-preset:hover{border-color:#3a3a48;background:var(--panel2);}
.cf-preset.on{border-color:var(--accent);background:rgba(255,225,77,.06);}
.cf-preset b{font-size:13px;font-weight:700;display:block;}
.cf-preset small{font-size:11px;color:var(--mute);}
.cf-swatch{width:34px;height:34px;border-radius:7px;flex:none;display:flex;align-items:center;
  justify-content:center;font-size:10px;font-weight:900;}
.cf-video-wrap{position:relative;width:100%;max-width:340px;aspect-ratio:9/16;border-radius:16px;
  overflow:hidden;background:#000;box-shadow:0 24px 60px -20px rgba(0,0,0,.8),0 0 0 1px var(--line);}
.cf-video-wrap video,.cf-fake{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.cf-fake{background:linear-gradient(135deg,#2a1f3d 0%,#1b2a4a 45%,#0d3b3b 100%);
  display:flex;align-items:center;justify-content:center;}
.cf-fake span{font-size:12px;color:rgba(255,255,255,.4);font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;text-align:center;padding:0 30px;}
.cf-caplayer{position:absolute;inset:0;display:flex;padding:6% 7%;pointer-events:none;}
.cf-word{display:inline-block;transition:transform .12s ease,color .1s;}
.cf-transport{display:flex;align-items:center;gap:12px;width:100%;max-width:340px;}
.cf-play{width:42px;height:42px;border-radius:50%;border:none;flex:none;background:var(--accent);
  color:#0B0B10;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:900;}
.cf-track{flex:1;height:6px;border-radius:99px;background:var(--panel2);overflow:hidden;}
.cf-fill{height:100%;background:var(--mint);transition:width .1s linear;}
.cf-upload{display:inline-block;font-size:12px;color:var(--mint);font-weight:700;cursor:pointer;text-decoration:underline;}
.cf-upload input{display:none;}
.cf-field{margin-bottom:14px;}
.cf-field label{display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:var(--mute);margin-bottom:6px;}
.cf-field label b{color:var(--ink);font-weight:700;}
.cf-select,.cf-text{width:100%;background:var(--panel);border:1px solid var(--line);color:var(--ink);
  border-radius:8px;padding:8px 10px;font-size:13px;font-family:'Inter';}
.cf-text{resize:vertical;min-height:52px;line-height:1.4;}
.cf-select:focus,.cf-text:focus{outline:none;border-color:var(--accent);}
input[type=range]{width:100%;-webkit-appearance:none;height:4px;border-radius:99px;background:var(--panel2);outline:none;margin:8px 0 0;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;
  background:var(--accent);cursor:pointer;border:2px solid #0B0B10;}
.cf-swatchrow{display:flex;gap:8px;align-items:center;}
.cf-color{width:34px;height:30px;border-radius:7px;border:1px solid var(--line);padding:0;background:none;cursor:pointer;flex:none;}
.cf-color::-webkit-color-swatch{border:none;border-radius:5px;}
.cf-color::-webkit-color-swatch-wrapper{padding:2px;}
.cf-chips{display:flex;gap:6px;flex-wrap:wrap;}
.cf-chip{flex:1;min-width:0;border:1px solid var(--line);background:var(--panel);color:var(--mute);
  border-radius:7px;padding:7px 4px;font-size:11px;font-weight:700;cursor:pointer;transition:.13s;}
.cf-chip:hover{border-color:#3a3a48;}
.cf-chip.on{background:var(--accent);color:#0B0B10;border-color:var(--accent);}
.cf-toggle{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-top:1px solid var(--line);}
.cf-toggle span{font-size:12px;font-weight:600;}
.cf-tog{width:40px;height:22px;border-radius:99px;background:var(--panel2);border:none;cursor:pointer;position:relative;transition:.15s;flex:none;}
.cf-tog.on{background:var(--mint);}
.cf-tog i{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.15s;}
.cf-tog.on i{left:20px;}
.cf-btn{width:100%;border:none;border-radius:9px;padding:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:'Inter';}
.cf-btn.primary{background:var(--accent);color:#0B0B10;}
.cf-btn.primary:disabled{opacity:.5;cursor:not-allowed;}
.cf-btn.ghost{background:var(--panel);color:var(--ink);border:1px solid var(--line);margin-top:8px;}
.cf-btn:hover:not(:disabled){filter:brightness(1.06);}
.cf-status{font-size:12px;color:var(--mute);text-align:center;line-height:1.5;}
.cf-status b{color:var(--mint);}
.cf-err{font-size:12px;color:var(--red);text-align:center;line-height:1.5;}
.cf-spin{width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--accent);
  border-radius:50%;display:inline-block;vertical-align:middle;margin-right:8px;animation:cf-spin .7s linear infinite;}
@keyframes cf-spin{to{transform:rotate(360deg);}}
@media(max-width:1000px){.cf-grid{grid-template-columns:1fr;}.cf-col{max-height:none;}.cf-stage{order:-1;}}
`;

const FONTS = ["Anton", "Archivo Black", "Bebas Neue", "Montserrat", "Inter"];

const PRESETS = [
  { id: "hormozi", name: "Bold Highlight", desc: "Yellow active word, thick outline",
    s: { font: "Anton", size: 40, weight: 400, color: "#FFFFFF", active: "#FFE14D", outline: "#000000",
      outlineW: 8, box: "", pos: "bottom", upper: true, spacing: 1, anim: "pop", perGroup: 3, mode: "word" },
    sw: { bg: "#000", t: "AB", c: "#FFE14D" } },
  { id: "tiktok", name: "TikTok Classic", desc: "White text, dark box per line",
    s: { font: "Montserrat", size: 30, weight: 800, color: "#FFFFFF", active: "#FFFFFF", outline: "#000000",
      outlineW: 2, box: "rgba(0,0,0,0.55)", pos: "center", upper: false, spacing: 0, anim: "fade", perGroup: 5, mode: "none" },
    sw: { bg: "#111", t: "Tt", c: "#fff" } },
  { id: "karaoke", name: "Karaoke Fill", desc: "Words light up as spoken",
    s: { font: "Montserrat", size: 32, weight: 900, color: "#8a8a8a", active: "#00E0B8", outline: "#06222b",
      outlineW: 4, box: "", pos: "bottom", upper: true, spacing: .5, anim: "none", perGroup: 4, mode: "fill" },
    sw: { bg: "#06222b", t: "Kf", c: "#00E0B8" } },
  { id: "neon", name: "Neon Pop", desc: "Glow text, magenta on active",
    s: { font: "Archivo Black", size: 32, weight: 400, color: "#61F5FF", active: "#FF4DD8", outline: "#0a2a3a",
      outlineW: 3, box: "", pos: "center", upper: true, spacing: 1, anim: "pop", perGroup: 3, mode: "word" },
    sw: { bg: "#0a2233", t: "Np", c: "#61F5FF" } },
  { id: "clean", name: "Clean Subtitle", desc: "Subtle, full lines",
    s: { font: "Inter", size: 22, weight: 700, color: "#FFFFFF", active: "#FFFFFF", outline: "#000000",
      outlineW: 0, box: "", pos: "bottom", upper: false, spacing: 0, anim: "fade", perGroup: 7, mode: "none" },
    sw: { bg: "#1c1c24", t: "Cs", c: "#fff" } },
  { id: "punch", name: "Punch Bounce", desc: "Big, two words at a time",
    s: { font: "Bebas Neue", size: 48, weight: 400, color: "#FFFFFF", active: "#FF5C38", outline: "#000000",
      outlineW: 6, box: "", pos: "center", upper: true, spacing: 2, anim: "pop", perGroup: 2, mode: "word" },
    sw: { bg: "#111", t: "Pb", c: "#FF5C38" } },
];

const posMap = { top: "flex-start", center: "center", bottom: "flex-end" };

export default function App() {
  const [preset, setPreset] = useState("hormozi");
  const [s, setS] = useState({ ...PRESETS[0].s });
  const [previewText, setPreviewText] = useState(
    "This tool burns accurate captions right into your video"
  );
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [playing, setPlaying] = useState(true);
  const [wi, setWi] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const timer = useRef(null);

  const words = useMemo(() => previewText.trim().split(/\s+/).filter(Boolean), [previewText]);

  useEffect(() => {
    clearInterval(timer.current);
    if (playing && words.length && !resultUrl) {
      timer.current = setInterval(() => setWi((p) => (p + 1) % words.length), 360);
    }
    return () => clearInterval(timer.current);
  }, [playing, words.length, resultUrl]);

  function applyPreset(p) {
    const f = PRESETS.find((x) => x.id === p);
    setPreset(p);
    setS({ ...f.s });
    setWi(0);
  }
  const up = (k, v) => setS((o) => ({ ...o, [k]: v }));

  const gi = Math.floor(wi / s.perGroup);
  const group = words.slice(gi * s.perGroup, gi * s.perGroup + s.perGroup);
  const localActive = wi - gi * s.perGroup;

  const shadow = s.outlineW > 0
    ? Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return `${Math.cos(a) * s.outlineW}px ${Math.sin(a) * s.outlineW}px 0 ${s.outline}`;
      }).join(",")
    : "0 2px 6px rgba(0,0,0,.5)";

  function wordStyle(idx) {
    const isActive = idx === localActive;
    return {
      color: (isActive && s.mode === "word") ? s.active
        : s.mode === "fill" ? (idx <= localActive ? s.active : s.color) : s.color,
      textShadow: shadow,
      transform: isActive && s.anim === "pop" ? "scale(1.14)" : "scale(1)",
    };
  }

  const capBoxStyle = {
    fontFamily: `'${s.font}', sans-serif`, fontSize: s.size, fontWeight: s.weight, lineHeight: 1.15,
    letterSpacing: s.spacing, textTransform: s.upper ? "uppercase" : "none", textAlign: "center",
    padding: s.box ? "8px 14px" : "0", borderRadius: 10, background: s.box || "transparent",
    display: "flex", flexWrap: "wrap", gap: "0 .4em", justifyContent: "center", alignContent: "center",
    filter: preset === "neon" ? `drop-shadow(0 0 6px ${s.color}) drop-shadow(0 0 14px ${s.active})` : "none",
  };

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setResultUrl("");
    setError("");
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(f));
  }

  function buildConfig() {
    return {
      style: preset, font: s.font, fontSizePx: s.size, weight: s.weight,
      baseColor: s.color, highlightColor: s.active, highlightMode: s.mode,
      outlineColor: s.outline, outlineWidth: s.outlineW, lineBox: s.box || null,
      position: s.pos, uppercase: s.upper, letterSpacing: s.spacing,
      animation: s.anim, wordsPerGroup: s.perGroup,
    };
  }

  async function generate() {
    if (!file) { setError("Upload a video first."); return; }
    setBusy(true); setError(""); setResultUrl("");
    setStatus("Uploading video…");
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("config", JSON.stringify(buildConfig()));
      setStatus("Transcribing audio + burning captions… this can take a minute.");
      const res = await fetch("/api/caption", { method: "POST", body: fd });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Server error (${res.status})`);
      }
      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setStatus("");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cf-root">
      <style>{CSS}</style>
      <div className="cf-top">
        <div className="cf-brand">
          <div className="cf-dot" />
          <div>
            <h1>Caption Forge</h1>
            <span>accurate captions, burned in</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--mute)", fontWeight: 600 }}>
          {file ? file.name.slice(0, 28) : "no video loaded"}
        </div>
      </div>

      <div className="cf-grid">
        {/* LEFT */}
        <div className="cf-col">
          <p className="cf-eyebrow">Style presets</p>
          {PRESETS.map((p) => (
            <button key={p.id} className={"cf-preset" + (preset === p.id ? " on" : "")}
              onClick={() => applyPreset(p.id)}>
              <span><b>{p.name}</b><small>{p.desc}</small></span>
              <span className="cf-swatch" style={{ background: p.sw.bg, color: p.sw.c }}>{p.sw.t}</span>
            </button>
          ))}
          <p className="cf-eyebrow mt">Preview text</p>
          <textarea className="cf-text" value={previewText}
            onChange={(e) => { setPreviewText(e.target.value); setWi(0); }} />
          <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 8, lineHeight: 1.5 }}>
            This is only for previewing the look. The real captions come from your
            video's actual audio when you hit Caption my video.
          </p>
        </div>

        {/* CENTER */}
        <div className="cf-stage">
          <div className="cf-video-wrap">
            {resultUrl ? (
              <video src={resultUrl} controls autoPlay loop playsInline />
            ) : videoUrl ? (
              <video src={videoUrl} autoPlay loop muted playsInline />
            ) : (
              <div className="cf-fake"><span>Upload a video to begin</span></div>
            )}
            {!resultUrl && (
              <div className="cf-caplayer" style={{ alignItems: posMap[s.pos] }}>
                <div style={capBoxStyle}>
                  {group.map((w, i) => (
                    <span key={gi + "-" + i} className="cf-word" style={wordStyle(i)}>{w}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!resultUrl && (
            <div className="cf-transport">
              <button className="cf-play" onClick={() => setPlaying((p) => !p)}>
                {playing ? "❚❚" : "▶"}
              </button>
              <div className="cf-track">
                <div className="cf-fill" style={{ width: `${((wi + 1) / words.length) * 100}%` }} />
              </div>
            </div>
          )}

          <label className="cf-upload">
            {file ? "change video" : "upload your video"}
            <input type="file" accept="video/*" onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>

          {resultUrl && (
            <a className="cf-btn primary" href={resultUrl} download="captioned.mp4"
              style={{ maxWidth: 340, textAlign: "center", textDecoration: "none" }}>
              Download captioned video
            </a>
          )}
        </div>

        {/* RIGHT */}
        <div className="cf-col">
          <p className="cf-eyebrow">Type</p>
          <div className="cf-field">
            <label>Font</label>
            <select className="cf-select" value={s.font} onChange={(e) => up("font", e.target.value)}>
              {FONTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="cf-field">
            <label>Size <b>{s.size}px</b></label>
            <input type="range" min="14" max="60" value={s.size} onChange={(e) => up("size", +e.target.value)} />
          </div>
          <div className="cf-field">
            <label>Weight <b>{s.weight}</b></label>
            <input type="range" min="400" max="900" step="100" value={s.weight} onChange={(e) => up("weight", +e.target.value)} />
          </div>
          <div className="cf-field">
            <label>Letter spacing <b>{s.spacing}</b></label>
            <input type="range" min="0" max="6" step="0.5" value={s.spacing} onChange={(e) => up("spacing", +e.target.value)} />
          </div>

          <p className="cf-eyebrow mt">Colors</p>
          <div className="cf-field">
            <label>Base · Active · Outline</label>
            <div className="cf-swatchrow">
              <input type="color" className="cf-color" value={s.color} onChange={(e) => up("color", e.target.value)} />
              <input type="color" className="cf-color" value={s.active} onChange={(e) => up("active", e.target.value)} />
              <input type="color" className="cf-color" value={s.outline} onChange={(e) => up("outline", e.target.value)} />
            </div>
          </div>
          <div className="cf-field">
            <label>Outline width <b>{s.outlineW}px</b></label>
            <input type="range" min="0" max="12" value={s.outlineW} onChange={(e) => up("outlineW", +e.target.value)} />
          </div>

          <p className="cf-eyebrow mt">Highlight</p>
          <div className="cf-chips">
            {["word", "fill", "none"].map((m) => (
              <button key={m} className={"cf-chip" + (s.mode === m ? " on" : "")} onClick={() => up("mode", m)}>{m}</button>
            ))}
          </div>

          <p className="cf-eyebrow mt">Position</p>
          <div className="cf-chips">
            {["top", "center", "bottom"].map((p) => (
              <button key={p} className={"cf-chip" + (s.pos === p ? " on" : "")} onClick={() => up("pos", p)}>{p}</button>
            ))}
          </div>

          <p className="cf-eyebrow mt">Animation</p>
          <div className="cf-chips">
            {["pop", "fade", "none"].map((a) => (
              <button key={a} className={"cf-chip" + (s.anim === a ? " on" : "")} onClick={() => up("anim", a)}>{a}</button>
            ))}
          </div>

          <div className="cf-field" style={{ marginTop: 16 }}>
            <label>Words on screen <b>{s.perGroup}</b></label>
            <input type="range" min="1" max="8" value={s.perGroup} onChange={(e) => up("perGroup", +e.target.value)} />
          </div>

          <div className="cf-toggle">
            <span>UPPERCASE</span>
            <button className={"cf-tog" + (s.upper ? " on" : "")} onClick={() => up("upper", !s.upper)}><i /></button>
          </div>
          <div className="cf-toggle">
            <span>Line background box</span>
            <button className={"cf-tog" + (s.box ? " on" : "")}
              onClick={() => up("box", s.box ? "" : "rgba(0,0,0,0.55)")}><i /></button>
          </div>

          <p className="cf-eyebrow mt">Render</p>
          <button className="cf-btn primary" disabled={busy || !file} onClick={generate}>
            {busy ? <><span className="cf-spin" />Working…</> : "Caption my video"}
          </button>
          {status && <p className="cf-status" style={{ marginTop: 12 }}>{status}</p>}
          {error && <p className="cf-err" style={{ marginTop: 12 }}>{error}</p>}
          {resultUrl && !error && (
            <button className="cf-btn ghost" onClick={() => { setResultUrl(""); setStatus(""); }}>
              Tweak style & re-render
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
