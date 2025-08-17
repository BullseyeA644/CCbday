// emoji.js — floating emoji hearts overlay (timed + on click) using rAF (Firefox-friendly)
export function initEmojiOverlay({
  intervalMs = 2600,
  clickCount = 6,
  periodicCountRange = [3, 5],
  glyphs = ["💖", "💘", "💝", "💞", "💗", "🩷", "💕", "💓"],
} = {}) {
  const layer = ensureLayer();
  const reduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // Active particles tracked here
  const parts = new Set();
  let rafId = 0,
    timerId = 0;

  function spawn(x, y, n) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div");
      el.className = "emoji";
      el.textContent = pick(glyphs);
      el.style.fontSize = pick([16, 18, 22, 26, 30]) + "px";
      layer.appendChild(el);

      const p = {
        el,
        // start near (x,y) with slight jitter
        x: x + rand(-22, 22),
        y: y + rand(-10, 10),
        vx: rand(-0.18, 0.18), // horizontal drift (px/frame)
        vy: rand(-0.9, -1.6), // upward (negative) (px/frame)
        ax: rand(-0.005, 0.005), // tiny horizontal “wind”
        life: 0, // ms
        ttl: rand(900, 1500), // total life ms
        scale: rand(0.9, 1.3),
        wobble: rand(0, Math.PI * 2), // phase for sine wobble
        wobbleAmp: rand(2, 6),
      };
      el.style.opacity = "0";
      parts.add(p);
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick(ts) {
    if (!tick.last) tick.last = ts;
    const dt = ts - tick.last; // ms
    tick.last = ts;

    for (const p of parts) {
      p.life += dt;
      if (p.life > p.ttl) {
        layer.removeChild(p.el);
        parts.delete(p);
        continue;
      }
      // motion
      p.vx += p.ax * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // wobble horizontally with time
      p.wobble += dt / 220;
      const wobX = Math.sin(p.wobble) * p.wobbleAmp;

      // fade in/out
      const t = p.life / p.ttl;
      const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;

      p.el.style.opacity = alpha.toFixed(2);
      p.el.style.transform = `translate(${(p.x + wobX).toFixed(
        1
      )}px, ${p.y.toFixed(1)}px) scale(${p.scale})`;
    }

    if (parts.size) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = 0;
      tick.last = 0;
    }
  }

  // periodic bursts
  function startTimer() {
    if (reduced) return;
    stopTimer();
    timerId = setInterval(() => {
      const vw = window.innerWidth,
        vh = window.innerHeight;
      const x = vw * (0.2 + Math.random() * 0.6);
      const y = vh * (0.25 + Math.random() * 0.5);
      spawn(x, y, randInt(periodicCountRange[0], periodicCountRange[1]));
    }, intervalMs);
  }
  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = 0;
    }
  }

  // click bursts
  const onClick = (e) =>
    spawn(
      e.clientX || innerWidth / 2,
      e.clientY || innerHeight / 2,
      clickCount
    );
  document.addEventListener("click", onClick, { passive: true });

  // Reflow on resize: nothing to do, particles are absolute to viewport

  // Cleanup on unload (optional)
  window.addEventListener(
    "beforeunload",
    () => {
      stopTimer();
      if (rafId) cancelAnimationFrame(rafId);
    },
    { once: true }
  );

  startTimer();
}

/* helpers */
function ensureLayer() {
  let layer = document.getElementById("emoji-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "emoji-layer";
    layer.className = "emoji-layer";
    document.body.appendChild(layer);
  }
  return layer;
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function randInt(a, b) {
  return Math.floor(a + Math.random() * (b - a + 1));
}
function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}
