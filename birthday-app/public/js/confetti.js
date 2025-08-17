// confetti.js — exports startShow, burstAt, drizzle, popperAt
let cvs = null,
  ctx = null,
  W = 0,
  H = 0,
  rafId = 0,
  running = false;
const COLORS = [
  "#fff",
  "#fde68a",
  "#fca5a5",
  "#93c5fd",
  "#86efac",
  "#f0abfc",
  "#fecaca",
];
const pieces = [];
const MAX = 900;

function ensureCanvas() {
  if (cvs && ctx) return true;
  cvs = document.getElementById("confetti");
  if (!cvs) {
    cvs = document.createElement("canvas");
    cvs.id = "confetti";
    cvs.className = "fx-layer pointer-events-none";
    cvs.style.position = "fixed";
    cvs.style.inset = "0";
    cvs.style.zIndex = "40";
    cvs.style.pointerEvents = "none";
    document.body.appendChild(cvs);
  }
  ctx = cvs.getContext("2d");
  if (!ctx) return false;
  resize();
  return true;
}
function afterDom(fn) {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  else fn();
}
function resize() {
  if (!cvs) return;
  const d = Math.max(1, window.devicePixelRatio || 1);
  W = cvs.width = Math.floor(innerWidth * d);
  H = cvs.height = Math.floor(innerHeight * d);
  cvs.style.width = innerWidth + "px";
  cvs.style.height = innerHeight + "px";
  if (ctx?.setTransform) ctx.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener(
  "resize",
  () => {
    if (cvs) resize();
  },
  { passive: true }
);

// particles
function spawn(x, y, angle, spread, sMin, sMax, count, type = "rect") {
  for (let i = 0; i < count; i++) {
    if (pieces.length >= MAX) break;
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const s = sMin + Math.random() * (sMax - sMin);
    pieces.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      w: type === "streamer" ? 6 + Math.random() * 10 : 4 + Math.random() * 6,
      h: type === "streamer" ? 14 + Math.random() * 22 : 2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.25,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      type,
      ttl: 12000 + Math.random() * 4000,
    });
  }
}
function cannonLB() {
  spawn(0, H, 60, 22, 9, 13, 30, "streamer");
  spawn(0, H, 65, 26, 10, 14, 30, "rect");
}
function cannonRB() {
  spawn(W, H, 120, 22, 9, 13, 30, "streamer");
  spawn(W, H, 115, 26, 10, 14, 30, "rect");
}
function burstMid() {
  spawn(W / 2, H * 0.25, 90, 90, 7, 12, 120, "rect");
}
function fireworks(cx, cy) {
  for (let k = 0; k < 8; k++)
    spawn(cx, cy, k * 45, 18, 7, 11, 30, k % 2 ? "rect" : "streamer");
}

function update(dt) {
  const g = 18 * (dt / 1000),
    air = 0.999;
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    p.vy += g;
    p.vx *= air;
    p.vy *= air;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
    p.ttl -= dt;
    if (p.y > H + 60 || p.x < -60 || p.x > W + 60 || p.ttl <= 0)
      pieces.splice(i, 1);
  }
}
function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  for (const p of pieces) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(
      -p.w / 2,
      -p.h / 2,
      p.w,
      p.type === "streamer" ? p.h : p.h * 0.7
    );
    ctx.restore();
  }
}
let last = 0;
function loop(t) {
  if (!running) return;
  if (!last) last = t;
  const dt = t - last;
  last = t;
  update(dt);
  draw();
  rafId = requestAnimationFrame(loop);
}
function startEngine() {
  if (running) return;
  afterDom(() => {
    if (!ensureCanvas()) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(loop);
  });
}
function stopEngine() {
  running = false;
  cancelAnimationFrame(rafId);
  pieces.length = 0;
  if (ctx) ctx.clearRect(0, 0, W, H);
}

// API
export function startShow() {
  startEngine();
  setTimeout(() => {
    const s1 = setInterval(() => {
      cannonLB();
      cannonRB();
    }, 90);
    setTimeout(() => clearInterval(s1), 1500);
    setTimeout(() => {
      burstMid();
      fireworks(W * 0.3, H * 0.35);
      fireworks(W * 0.7, H * 0.3);
    }, 500);
    const drizzle = setInterval(() => {
      spawn(
        Math.random() * W,
        -20,
        100,
        40,
        6,
        9,
        14,
        Math.random() < 0.5 ? "rect" : "streamer"
      );
    }, 140);
    setTimeout(() => clearInterval(drizzle), 8000);
    setTimeout(() => stopEngine(), 12000);
  });
}
export function burstAt(x, y) {
  startEngine();
  setTimeout(() => {
    fireworks(x, y);
    setTimeout(() => {
      if (!pieces.length) stopEngine();
    }, 1800);
  });
}
export function drizzle(ms = 1200) {
  startEngine();
  setTimeout(() => {
    const id = setInterval(() => {
      spawn(
        Math.random() * W,
        -20,
        100,
        40,
        6,
        9,
        10,
        Math.random() < 0.5 ? "rect" : "streamer"
      );
    }, 130);
    setTimeout(() => {
      clearInterval(id);
      setTimeout(() => {
        if (!pieces.length) stopEngine();
      }, 800);
    }, ms);
  });
}
// NEW: compact party-popper cone
export function popperAt(x, y) {
  startEngine();
  setTimeout(() => {
    spawn(x, y, 80, 26, 8, 12, 26, "streamer");
    spawn(x, y, 86, 32, 7, 11, 22, "rect");
    setTimeout(() => {
      if (!pieces.length) stopEngine();
    }, 1400);
  });
}
