// ambient.js — integrated BACKGROUND ambience (no overlays)
// Soft floating hearts + sparkles rendered as SVG behind content,
// non-distorted, low opacity, Firefox-friendly.

export function initAmbient() {
  const reduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const mount = document.getElementById("ambient-bg");
  if (!mount) return;

  mount.innerHTML = "";

  // SVG canvas (keeps aspect ratio so shapes never distort)
  const svg = makeSVG();
  mount.appendChild(svg);

  // Palette & shapes
  const palette = ["#ff9ec5", "#ffb3d1", "#ffc6dc", "#ffd7e7", "#ffa5c9"];
  const N_HEARTS = 18; // background floaters (hearts)
  const N_SPARKLES = 16; // background floaters (sparkles)

  // Stationary pookie accents in corners & sides
  placeStationary(svg);

  // Floaters (if motion allowed)
  const nodes = [];
  if (!reduced) {
    for (let i = 0; i < N_HEARTS; i++) {
      nodes.push(makeFloater(svg, "heart", rand(0.9, 1.6), pick(palette)));
    }
    for (let i = 0; i < N_SPARKLES; i++) {
      nodes.push(makeFloater(svg, "sparkle", rand(0.7, 1.3), pick(palette)));
    }
  }

  let rafId = 0;
  function loop(t) {
    for (const n of nodes) {
      n.y += n.spd;
      if (n.y > 112) {
        n.y = -12;
        n.x = rand(6, 94);
        n.phase = rand(0, Math.PI * 2);
      }
      const sx = n.x + Math.sin(t / 1000 + n.phase) * n.amp;
      setTranslate(n.g, sx, n.y);
      // subtle twinkle for sparkles
      if (n.kind === "sparkle") {
        const tw = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t / 600 + n.phase));
        n.inner.style.opacity = tw.toFixed(2);
      }
    }
    rafId = requestAnimationFrame(loop);
  }
  if (nodes.length) rafId = requestAnimationFrame(loop);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId), {
    once: true,
  });

  /* ---------- helpers ---------- */
  function makeFloater(parent, kind, scale, color) {
    const gOuter = group(parent);
    const gInner = group(gOuter);
    gInner.style.opacity = ".18"; // very soft, never obstructs

    if (kind === "heart") {
      drawHeart(gInner, color, scale, /*shadow*/ true);
    } else {
      drawSparkle(gInner, color, scale, /*shadow*/ false);
    }

    // start position (0..100)
    const x = rand(6, 94);
    const y = rand(-10, 110);
    setTranslate(gOuter, x, y);

    // motion params
    return {
      kind,
      g: gOuter,
      inner: gInner,
      x,
      y,
      amp: rand(1.2, 3.2),
      spd: rand(4, 9) / 60,
      phase: rand(0, Math.PI * 2),
    };
  }

  function placeStationary(parent) {
    const accents = [
      { x: 7, y: 10, s: 1.4, c: "#ff9ec5", k: "heart" },
      { x: 93, y: 12, s: 1.2, c: "#ffb3d1", k: "heart" },
      { x: 6, y: 86, s: 1.1, c: "#ffd7e7", k: "sparkle" },
      { x: 94, y: 88, s: 1.3, c: "#ffa5c9", k: "sparkle" },
    ];
    for (const a of accents) {
      const g = group(parent);
      const inner = group(g);
      inner.style.opacity = ".22";
      if (a.k === "heart") drawHeart(inner, a.c, a.s, true);
      else drawSparkle(inner, a.c, a.s, false);
      setTranslate(g, a.x, a.y);
    }

    // side garland of mini sparkles
    for (const col of [3, 97]) {
      for (let k = 0; k < 7; k++) {
        const y = 16 + k * (70 / 7);
        const s = 0.7 + (k % 2 ? 0.15 : 0);
        const g = group(parent);
        const inner = group(g);
        inner.style.opacity = ".18";
        drawSparkle(inner, pick(palette), s, false);
        setTranslate(g, col, y);
      }
    }
  }
}

/* ========== SVG building blocks ========== */
const HEART_PATH =
  "M5 1.5c1.2-1.4 3.8-1.5 5 0 1.3 1.6 1 3.9-.4 5.3L5 11 0.4 6.8C-1 5.4-1.3 3.1 0 1.5c1.2-1.5 3.8-1.5 5 0z";

// little spark/star — rounded style
const SPARKLE_PATH =
  "M5 0 L6.4 3.2 L10 5 L6.4 6.8 L5 10 L3.6 6.8 L0 5 L3.6 3.2 Z";

function makeSVG() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); // no stretch
  svg.style.position = "absolute";
  svg.style.inset = "0";
  svg.style.pointerEvents = "none";
  return svg;
}
function group(parent) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  parent.appendChild(g);
  return g;
}
function drawHeart(parent, color, scale = 1, shadow = true) {
  const inner = document.createElementNS("http://www.w3.org/2000/svg", "g");
  inner.setAttribute("transform", `translate(-5,-5) scale(${scale})`);
  if (shadow) {
    const sh = document.createElementNS("http://www.w3.org/2000/svg", "path");
    sh.setAttribute("d", HEART_PATH);
    sh.setAttribute("fill", "rgba(0,0,0,0.10)");
    sh.setAttribute("transform", "translate(.6,.6)");
    inner.appendChild(sh);
  }
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", HEART_PATH);
  p.setAttribute("fill", color);
  parent.appendChild(inner);
  inner.appendChild(p);
  return inner;
}
function drawSparkle(parent, color, scale = 1, shadow = false) {
  const inner = document.createElementNS("http://www.w3.org/2000/svg", "g");
  inner.setAttribute(
    "transform",
    `translate(-5,-5) scale(${scale}) rotate(15)`
  );
  if (shadow) {
    const sh = document.createElementNS("http://www.w3.org/2000/svg", "path");
    sh.setAttribute("d", SPARKLE_PATH);
    sh.setAttribute("fill", "rgba(0,0,0,0.10)");
    sh.setAttribute("transform", "translate(.3,.3)");
    inner.appendChild(sh);
  }
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", SPARKLE_PATH);
  p.setAttribute("fill", color);
  p.setAttribute("fill-opacity", "0.95");
  p.setAttribute("stroke", "rgba(255,255,255,.55)");
  p.setAttribute("stroke-width", "0.3");
  parent.appendChild(inner);
  inner.appendChild(p);
  return inner;
}
function setTranslate(g, xPercent, yPercent) {
  g.setAttribute("transform", `translate(${xPercent}, ${yPercent})`);
}

/* ========== utils ========== */
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}
