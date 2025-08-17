// hearts.js — warm floating hearts, independent of scene.js
export function initHearts({ reduced = false, count = 34 } = {}) {
  let layer = document.getElementById("hearts-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "hearts-layer";
    layer.className = "hearts-layer";
    document.body.appendChild(layer);
  }
  layer.innerHTML = "";
  if (reduced) return;

  const glyphs = ["💖", "💗", "💞", "🩷"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className =
      "heart " + (i % 3 === 0 ? "large" : i % 3 === 1 ? "medium" : "small");
    el.classList.add(i % 2 ? "floatA" : "floatB");
    el.textContent = glyphs[(Math.random() * glyphs.length) | 0];

    const startX = Math.random() * 100; // vw
    const wave = Math.random() * 24 + 12 + "px";
    const dur = (9 + Math.random() * 6).toFixed(1) + "s";
    const delay = (-Math.random() * 9).toFixed(1) + "s";

    el.style.left = startX + "vw";
    el.style.setProperty("--x", "0px");
    el.style.setProperty("--wave", wave);
    el.style.setProperty("--dur", dur);
    el.style.setProperty("--delay", delay);
    el.style.top = -10 + Math.random() * 20 + "vh";

    layer.appendChild(el);
  }
}

// optional: reflow on resize to redistribute hearts
export function reflowHearts() {
  const layer = document.getElementById("hearts-layer");
  if (!layer) return;
  // Just nudge animation by resetting delays so they desync a bit
  layer.querySelectorAll(".heart").forEach((el) => {
    const dur =
      parseFloat(getComputedStyle(el).getPropertyValue("--dur")) || 10;
    el.style.animationDelay = -Math.random() * dur + "s";
  });
}
