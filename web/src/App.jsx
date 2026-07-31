import React, { useState, useEffect, useRef, useMemo } from "react";

/* Caption Forge — pick a style, preview it, then burn real captions in. */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bebas+Neue&family=Inter:wght@400;600;700;900&family=Montserrat:wght@700;800;900&display=swap');
*{margin:0;}
html,body{margin:0;padding:0;background:#0E0E13;-webkit-text-size-adjust:100%;}
#root{min-height:100vh;}
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
.cf-grid{display:grid;grid-template-columns:290px minmax(0,1fr) 330px;gap:1px;background:var(--line);min-height:calc(100vh - 52px);max-width:1320px;margin:0 auto;}
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
.cf-video-wrap video,.cf-fake{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;}
.cf-fake{background:linear-gradient(135deg,#2a1f3d 0%,#1b2a4a 45%,#0d3b3b 100%);
  display:flex;align-items:center;justify-content:center;}
.cf-fake span{font-size:12px;color:rgba(255,255,255,.4);font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;text-align:center;padding:0 30px;}
.cf-caplayer{position:absolute;inset:0;pointer-events:none;}
.cf-capbox{position:absolute;}
.cf-dpad{display:grid;grid-template-columns:repeat(3,34px);gap:5px;justify-content:center;margin-top:10px;}
.cf-dpad button{background:var(--panel);border:1px solid var(--line);color:var(--ink);border-radius:8px;height:32px;cursor:pointer;font-size:14px;line-height:1;}
.cf-dpad button:hover{border-color:var(--accent);background:var(--panel2);}
.cf-dpad .sp{visibility:hidden;}
.cf-editbtn{width:100%;margin-top:10px;background:var(--panel);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;}
.cf-editbtn:hover:not(:disabled){border-color:var(--accent);}
.cf-editbtn:disabled{opacity:.5;cursor:not-allowed;}
.cf-modal{position:fixed;inset:0;background:#050507;z-index:50;display:flex;flex-direction:column;outline:none;}
.cf-modal-bar{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--line);flex:none;}
.cf-modal-title{font-size:13px;font-weight:700;color:var(--ink);}
.cf-modal-stage{flex:1;display:flex;align-items:center;justify-content:center;padding:16px;min-height:0;}
.cf-modal-video{position:relative;max-width:96vw;max-height:100%;background:#000;border-radius:12px;
  overflow:hidden;box-shadow:0 20px 60px -20px #000;touch-action:none;user-select:none;}
.cf-modal-video video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;}
.cf-modal-foot{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 18px 20px;
  border-top:1px solid var(--line);flex:none;flex-wrap:wrap;}
.cf-modal-foot .cf-dpad{margin-top:0;}
.cf-modal-hint{font-size:12px;color:var(--mute);max-width:340px;}
.cf-guide{position:absolute;pointer-events:none;z-index:3;background:rgba(255,255,255,.35);}
.cf-guide-v{left:50%;top:0;bottom:0;width:1px;transform:translateX(-.5px);}
.cf-guide-h{top:50%;left:0;right:0;height:1px;transform:translateY(-.5px);}
.cf-guide.on{background:var(--mint);box-shadow:0 0 7px var(--mint);}
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
.cf-prog{margin-top:12px;}
.cf-prog-head{display:flex;align-items:center;justify-content:space-between;font-size:11px;
  font-weight:700;color:var(--mute);margin-bottom:6px;letter-spacing:.02em;}
.cf-prog-head b{color:var(--mint);font-variant-numeric:tabular-nums;}
.cf-bar{height:8px;border-radius:99px;background:var(--panel2);overflow:hidden;position:relative;}
.cf-bar-fill{height:100%;background:var(--mint);border-radius:99px;transition:width .2s ease;}
.cf-bar.indet .cf-bar-fill{position:absolute;width:38%;left:-38%;animation:cf-indet 1.1s ease-in-out infinite;}
@keyframes cf-indet{0%{left:-38%;}100%{left:100%;}}
/* Tablet: preview full-width on top, presets + controls side by side below */
@media(max-width:1080px){
  .cf-grid{grid-template-columns:1fr 1fr;max-width:860px;min-height:0;}
  .cf-col{max-height:none;overflow:visible;}
  .cf-stage{grid-column:1 / -1;order:-1;padding:24px 20px 28px;}
  .cf-video-wrap{max-height:62vh;}
}
/* Phone: single stacked column, tuned spacing + preview that fits the screen */
@media(max-width:680px){
  .cf-grid{grid-template-columns:1fr;max-width:560px;}
  .cf-col{padding:16px;}
  .cf-stage{padding:20px 16px 24px;gap:14px;}
  .cf-top{padding:12px 16px;}
  .cf-video-wrap,.cf-transport{max-width:min(340px,74vw);}
  .cf-video-wrap{max-height:54vh;}
}
/* Small phones */
@media(max-width:380px){
  .cf-video-wrap,.cf-transport{max-width:82vw;}
  .cf-video-wrap{max-height:50vh;}
  .cf-chip{font-size:10px;padding:7px 3px;}
  .cf-preset{padding:10px 11px;}
}
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

const posToXY = (pos) => ({ x: 0.5, y: pos === "top" ? 0.12 : pos === "center" ? 0.5 : 0.85 });

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
  const [prog, setProg] = useState(null); // {phase, pct}
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const timer = useRef(null);
  const wrapRef = useRef(null);
  const [boxH, setBoxH] = useState(600);      // measured preview height, for WYSIWYG caption scale
  const [aspect, setAspect] = useState(null); // uploaded video's width/height; null until metadata loads
  const [capPos, setCapPos] = useState({ x: 0.5, y: 0.85 }); // normalized caption anchor
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editH, setEditH] = useState(600);
  const dragRef = useRef(null);
  const modalRef = useRef(null);
  const capRef = useRef(null);
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });
  const clampPos = (v) => Math.max(0.02, Math.min(0.98, v));

  const words = useMemo(() => previewText.trim().split(/\s+/).filter(Boolean), [previewText]);

  useEffect(() => {
    clearInterval(timer.current);
    if (playing && words.length && !resultUrl && !editing) {
      timer.current = setInterval(() => setWi((p) => (p + 1) % words.length), 360);
    }
    return () => clearInterval(timer.current);
  }, [playing, words.length, resultUrl, editing]);

  // Track the preview box's real pixel height so captions scale to match the
  // burned output regardless of the video's aspect ratio.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height;
      if (h) setBoxH(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // When the editor opens, focus it (for arrow keys) and measure its box.
  useEffect(() => {
    if (!editing) return;
    modalRef.current?.focus();
    const el = dragRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((es) => { const h = es[0]?.contentRect?.height; if (h) setEditH(h); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [editing, aspect]);

  function applyPreset(p) {
    const f = PRESETS.find((x) => x.id === p);
    setPreset(p);
    setS({ ...f.s });
    setCapPos(posToXY(f.s.pos));
    setWi(0);
  }
  const up = (k, v) => setS((o) => ({ ...o, [k]: v }));

  const nudge = (dx, dy) => setCapPos((p) => ({ x: clampPos(p.x + dx), y: clampPos(p.y + dy) }));
  function stagePoint(e) {
    const r = dragRef.current.getBoundingClientRect();
    return { px: (e.clientX - r.left) / r.width, py: (e.clientY - r.top) / r.height };
  }
  function onStageDown(e) {
    if (!dragRef.current) return;
    e.preventDefault();
    const { px, py } = stagePoint(e);
    const cr = capRef.current?.getBoundingClientRect();
    const onCaption = cr && e.clientX >= cr.left && e.clientX <= cr.right && e.clientY >= cr.top && e.clientY <= cr.bottom;
    if (onCaption) {
      dragOffsetRef.current = { dx: px - capPos.x, dy: py - capPos.y }; // keep grab point under finger
    } else {
      dragOffsetRef.current = { dx: 0, dy: 0 };
      setCapPos({ x: clampPos(px), y: clampPos(py) }); // jump the caption to where you pressed
    }
    dragRef.current.setPointerCapture?.(e.pointerId);
    setDragging(true);
  }
  function onStageMove(e) {
    if (!dragging || !dragRef.current) return;
    const { px, py } = stagePoint(e);
    const off = dragOffsetRef.current;
    const snap = (v) => (Math.abs(v - 0.5) < 0.025 ? 0.5 : v); // pull to the center lines
    setCapPos({ x: snap(clampPos(px - off.dx)), y: snap(clampPos(py - off.dy)) });
  }
  function onStageUp(e) { setDragging(false); dragRef.current?.releasePointerCapture?.(e.pointerId); }
  function onEditKey(e) {
    const m = { ArrowUp: [0, -0.02], ArrowDown: [0, 0.02], ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0] };
    if (m[e.key]) { e.preventDefault(); nudge(m[e.key][0], m[e.key][1]); }
    else if (e.key === "Escape") setEditing(false);
  }

  const gi = Math.floor(wi / s.perGroup);
  const group = words.slice(gi * s.perGroup, gi * s.perGroup + s.perGroup);
  const localActive = wi - gi * s.perGroup;

  function shadowFor(scale) {
    if (s.outlineW > 0) {
      const ow = s.outlineW * scale;
      return Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return `${Math.cos(a) * ow}px ${Math.sin(a) * ow}px 0 ${s.outline}`;
      }).join(",");
    }
    return "0 2px 6px rgba(0,0,0,.5)";
  }

  function wordStyleFor(idx, sh) {
    const isActive = idx === localActive;
    return {
      color: (isActive && s.mode === "word") ? s.active
        : s.mode === "fill" ? (idx <= localActive ? s.active : s.color) : s.color,
      textShadow: sh,
      transform: isActive && s.anim === "pop" ? "scale(1.14)" : "scale(1)",
    };
  }

  function capBoxStyleFor(scale) {
    return {
      fontFamily: `'${s.font}', sans-serif`, fontSize: s.size * scale, fontWeight: s.weight, lineHeight: 1.15,
      letterSpacing: s.spacing * scale, textTransform: s.upper ? "uppercase" : "none", textAlign: "center",
      padding: s.box ? `${8 * scale}px ${14 * scale}px` : "0", borderRadius: 10 * scale, background: s.box || "transparent",
      display: "flex", flexWrap: "wrap", gap: "0 .4em", justifyContent: "center", alignContent: "center",
      filter: preset === "neon" ? `drop-shadow(0 0 6px ${s.color}) drop-shadow(0 0 14px ${s.active})` : "none",
    };
  }

  // The caption block, anchored at the normalized capPos. In edit mode it shows
  // a dashed grab affordance and exposes its box via capRef (the drag surface is
  // the whole video, wired on the modal container).
  function captionLayer(scale, opts = {}) {
    const { edit } = opts;
    const sh = shadowFor(scale);
    return (
      <div className="cf-caplayer">
        <div className="cf-capbox" ref={edit ? capRef : null}
          style={{
            ...capBoxStyleFor(scale),
            left: `${capPos.x * 100}%`, top: `${capPos.y * 100}%`,
            transform: "translate(-50%,-50%)", maxWidth: "92%",
            ...(edit ? { outline: "2px dashed rgba(255,255,255,.6)", outlineOffset: "5px" } : {}),
          }}>
          {group.map((w, i) => (
            <span key={gi + "-" + i} className="cf-word" style={wordStyleFor(i, sh)}>{w}</span>
          ))}
        </div>
      </div>
    );
  }

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
      posX: capPos.x, posY: capPos.y,
    };
  }

  function fail(msg) {
    setError(msg || "Something went wrong.");
    setProg(null);
    setBusy(false);
  }

  async function fetchResult(jobId) {
    try {
      const res = await fetch(`/api/result/${jobId}`);
      if (!res.ok) throw new Error("Couldn't fetch the finished video.");
      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setProg(null);
      setBusy(false);
    } catch (e) {
      fail(e.message);
    }
  }

  function listen(jobId) {
    setProg({ phase: "transcribing", pct: 0 });
    const es = new EventSource(`/api/progress/${jobId}`);
    es.onmessage = (ev) => {
      let d;
      try { d = JSON.parse(ev.data); } catch { return; }
      if (d.phase === "burning") setProg({ phase: "burning", pct: d.pct || 0 });
      else if (d.phase === "transcribing" || d.phase === "queued") setProg({ phase: "transcribing", pct: 0 });
      else if (d.phase === "done") { es.close(); fetchResult(jobId); }
      else if (d.phase === "error") { es.close(); fail(d.message); }
    };
    es.onerror = () => { /* EventSource auto-retries; server sends done/error explicitly */ };
  }

  function generate() {
    if (!file) { setError("Upload a video first."); return; }
    setBusy(true); setError(""); setResultUrl("");
    setProg({ phase: "uploading", pct: 0 });

    const fd = new FormData();
    fd.append("video", file);
    fd.append("config", JSON.stringify(buildConfig()));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/caption");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProg({ phase: "uploading", pct: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) { fail(xhr.responseText || `Server error (${xhr.status})`); return; }
      let jobId;
      try { jobId = JSON.parse(xhr.responseText).jobId; } catch { jobId = null; }
      if (!jobId) { fail("Unexpected server response."); return; }
      listen(jobId);
    };
    xhr.onerror = () => fail("Upload failed — check your connection.");
    xhr.send(fd);
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
          <div className="cf-video-wrap" ref={wrapRef} style={{ aspectRatio: aspect ? String(aspect) : "9 / 16" }}>
            {resultUrl ? (
              <video src={resultUrl} controls autoPlay loop playsInline
                onLoadedMetadata={(e) => setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight)} />
            ) : videoUrl ? (
              <video src={videoUrl} autoPlay loop muted playsInline
                onLoadedMetadata={(e) => setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight)} />
            ) : (
              <div className="cf-fake"><span>Upload a video to begin</span></div>
            )}
            {!resultUrl && captionLayer(boxH / 640)}
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
              <button key={p} className={"cf-chip" + (s.pos === p ? " on" : "")}
                onClick={() => { up("pos", p); setCapPos(posToXY(p)); }}>{p}</button>
            ))}
          </div>
          <div className="cf-dpad">
            <span className="sp" /><button onClick={() => nudge(0, -0.03)} aria-label="up">↑</button><span className="sp" />
            <button onClick={() => nudge(-0.03, 0)} aria-label="left">←</button>
            <button onClick={() => nudge(0, 0.03)} aria-label="down">↓</button>
            <button onClick={() => nudge(0.03, 0)} aria-label="right">→</button>
          </div>
          <button className="cf-editbtn" disabled={!videoUrl} onClick={() => setEditing(true)}>
            ⤢ Drag to position on video
          </button>

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
          {prog && (
            <div className="cf-prog">
              <div className="cf-prog-head">
                <span>
                  {prog.phase === "uploading" ? "Uploading video"
                    : prog.phase === "burning" ? "Burning captions"
                    : "Transcribing audio"}
                </span>
                {(prog.phase === "uploading" || prog.phase === "burning") && <b>{prog.pct}%</b>}
              </div>
              <div className={"cf-bar" + (prog.phase === "transcribing" ? " indet" : "")}>
                <div className="cf-bar-fill"
                  style={prog.phase === "transcribing" ? undefined : { width: `${prog.pct}%` }} />
              </div>
            </div>
          )}
          {error && <p className="cf-err" style={{ marginTop: 12 }}>{error}</p>}
          {resultUrl && !error && (
            <button className="cf-btn ghost" onClick={() => { setResultUrl(""); setProg(null); }}>
              Tweak style & re-render
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="cf-modal" ref={modalRef} tabIndex={-1} onKeyDown={onEditKey}>
          <div className="cf-modal-bar">
            <span className="cf-modal-title">Drag the caption to position it</span>
            <button className="cf-btn primary" style={{ width: "auto", padding: "9px 24px" }} onClick={() => setEditing(false)}>Done</button>
          </div>
          <div className="cf-modal-stage">
            <div className="cf-modal-video" ref={dragRef}
              style={{ aspectRatio: aspect ? String(aspect) : "9 / 16", cursor: dragging ? "grabbing" : "grab" }}
              onPointerDown={onStageDown} onPointerMove={onStageMove} onPointerUp={onStageUp}>
              {videoUrl
                ? <video src={videoUrl} autoPlay loop muted playsInline />
                : <div className="cf-fake"><span>Upload a video first</span></div>}
              {captionLayer(editH / 640, { edit: true })}
              {dragging && (
                <>
                  <div className={"cf-guide cf-guide-v" + (capPos.x === 0.5 ? " on" : "")} />
                  <div className={"cf-guide cf-guide-h" + (capPos.y === 0.5 ? " on" : "")} />
                </>
              )}
            </div>
          </div>
          <div className="cf-modal-foot">
            <div className="cf-dpad">
              <span className="sp" /><button onClick={() => nudge(0, -0.02)}>↑</button><span className="sp" />
              <button onClick={() => nudge(-0.02, 0)}>←</button>
              <button onClick={() => nudge(0, 0.02)}>↓</button>
              <button onClick={() => nudge(0.02, 0)}>→</button>
            </div>
            <span className="cf-modal-hint">grab the caption and drag, tap elsewhere to move it there, or nudge with arrows</span>
          </div>
        </div>
      )}
    </div>
  );
}
