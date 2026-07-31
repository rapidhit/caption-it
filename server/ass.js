// Turns Groq word-level timestamps + a style config into a styled .ass file.
// The studio previews on a 9:16 box ~640px tall, so sizes scale to real height.
const PREVIEW_H = 640;

// #RRGGBB -> ASS BGR hex "BBGGRR"
function bgr(hex) {
  const h = String(hex || "#FFFFFF").replace("#", "").slice(0, 6).padEnd(6, "0");
  return (h.slice(4, 6) + h.slice(2, 4) + h.slice(0, 2)).toUpperCase();
}

// rgba(...) or #hex -> { bgr, alpha } where alpha is ASS alpha (00 opaque..FF clear)
function parseBox(color) {
  if (!color) return null;
  const m = String(color).match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b, a = "1"] = m[1].split(",").map((x) => x.trim());
    const toHex = (n) => (+n).toString(16).padStart(2, "0");
    const alpha = Math.round((1 - parseFloat(a)) * 255).toString(16).padStart(2, "0");
    return { bgr: (toHex(b) + toHex(g) + toHex(r)).toUpperCase(), alpha: alpha.toUpperCase() };
  }
  return { bgr: bgr(color), alpha: "40" };
}

// seconds -> "0:00:00.00"
function t(sec) {
  sec = Math.max(0, sec || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec - Math.floor(sec)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

const clean = (w) => String(w || "").trim();

export function buildAss(words, cfg, width, height) {
  const scale = height / PREVIEW_H;
  const fontSize = Math.max(10, Math.round((cfg.fontSizePx || 32) * scale));
  const outline = Math.max(0, Math.round((cfg.outlineWidth || 0) * scale));
  const spacing = +((cfg.letterSpacing || 0) * scale).toFixed(1);
  const marginV = Math.round(height * 0.07);
  const align = { top: 8, center: 5, bottom: 2 }[cfg.position] || 2;
  const bold = (cfg.weight || 400) >= 700 ? -1 : 0;

  const base = bgr(cfg.baseColor);
  const active = bgr(cfg.highlightColor);
  const outlineCol = bgr(cfg.outlineColor);
  const box = parseBox(cfg.lineBox);
  const borderStyle = box ? 3 : 1;
  const backColour = box ? `&H${box.alpha}${box.bgr}` : "&H64000000";

  const header =
`[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,${cfg.font || "Inter"},${fontSize},&H00${base},&H00${active},&H00${outlineCol},${backColour},${bold},0,0,0,100,100,${spacing},0,${borderStyle},${outline},1,${align},60,60,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const uc = cfg.uppercase;
  const mode = cfg.highlightMode || "word"; // word | fill | none
  const per = Math.max(1, cfg.wordsPerGroup || 3);
  const pop = cfg.animation === "pop";
  const baseTag = `{\\c&H${base}&\\fscx100\\fscy100}`;

  // helper: render one line, highlighting the given set of indices
  function line(group, hi) {
    const parts = group.map((w, j) => {
      const txt = uc ? clean(w.word).toUpperCase() : clean(w.word);
      if (hi.has(j)) {
        const s = pop ? "\\fscx112\\fscy112" : "";
        return `{\\c&H${active}&${s}}${txt}${baseTag}`;
      }
      return txt;
    });
    return baseTag + parts.join(" ");
  }

  const events = [];
  for (let g = 0; g < words.length; g += per) {
    const group = words.slice(g, g + per);
    const gStart = group[0].start;
    const gEnd = group[group.length - 1].end;

    if (mode === "none") {
      events.push(
        `Dialogue: 0,${t(gStart)},${t(gEnd)},Cap,,0,0,0,,${line(group, new Set())}`
      );
      continue;
    }

    // one event per word so the highlight moves through the group
    for (let i = 0; i < group.length; i++) {
      const evStart = group[i].start;
      const evEnd = i < group.length - 1 ? group[i + 1].start : group[i].end;
      const hi = new Set();
      if (mode === "fill") for (let k = 0; k <= i; k++) hi.add(k);
      else hi.add(i); // "word"
      events.push(
        `Dialogue: 0,${t(evStart)},${t(evEnd)},Cap,,0,0,0,,${line(group, hi)}`
      );
    }
  }

  return header + events.join("\n") + "\n";
}
