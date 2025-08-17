// burst.js — tiny heart bursts using inline SVG (no emoji/font issues)
const COLORS = ["#ff9ec5", "#ffb3d1", "#ffc6dc", "#ffd7e7", "#ffa5c9"];
const HEART_SVG = `<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path d="M6 1.8c1.3-1.5 4.1-1.6 5.3 0 1.4 1.7 1.1 4.1-.4 5.6L6 11 1.1 7.4C-.4 5.9-.6 3.5.8 1.8 2.1.2 4.7.3 6 1.8z" fill="CURRENT" fill-opacity="0.95"/></svg>`;

function heartNode(color) {
  const div = document.createElement("div");
  div.className = "burst";
  div.innerHTML = HEART_SVG.replace("CURRENT", color);
  return div;
}

export function burstAt(x, y, count = 6) {
  let layer = document.querySelector(".burst-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "burst-layer";
    document.body.appendChild(layer);
  }
  for (let i = 0; i < count; i++) {
    const n = heartNode(COLORS[(Math.random() * COLORS.length) | 0]);
    const jx = Math.random() * 36 - 18;
    const jy = Math.random() * 18 - 9;
    n.style.left = `${x + jx}px`;
    n.style.top = `${y + jy}px`;
    n.style.animationDuration = (1.1 + Math.random() * 0.6).toFixed(2) + "s";
    n.style.rotate = (Math.random() * 24 - 12).toFixed(1) + "deg";
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 1800);
  }
}

export function gentleRain(intervalMs = 2800) {
  // periodic little bursts somewhere mid-page
  setInterval(() => {
    const vw = innerWidth,
      vh = innerHeight;
    burstAt(
      vw * (0.2 + Math.random() * 0.6),
      vh * (0.25 + Math.random() * 0.5),
      4
    );
  }, intervalMs);
}
