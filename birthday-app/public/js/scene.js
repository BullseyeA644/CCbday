// scene.js — shows: Hero → Portrait → Wish → Pins; adds poppers
import { $, $$, escapeHtml } from "./utils.js";
import {
  startShow,
  burstAt as confettiBurstAt,
  drizzle,
  popperAt,
} from "./confetti.js";
import { burstAt } from "./burst.js";

// --- HERO (first screen) ---
export function renderHero(root, data, onBegin) {
  const d = normalizeData(data);
  const name = d.recipient?.name ? `, ${escapeHtml(d.recipient.name)}` : "";

  root.innerHTML = `
    <section id="hero" class="min-h-screen flex items-center justify-center">
      <div class="text-center px-6">
        <h1 class="dancing-script text-6xl md:text-8xl font-bold text-rose-900 mb-4">
          ${escapeHtml(d.hero?.title || "Happy Birthday! 🌹")}
        </h1>
        <p class="text-xl md:text-2xl text-rose-900/90 mb-8 font-light">
          ${escapeHtml(
            (d.hero?.subtitle || "To someone incredibly precious ✨") + name
          )}
        </p>
        <div class="heart-pulse text-6xl mb-8" aria-hidden="true">💖</div>
        <button id="begin-btn" class="btn btn-primary shadow-lg">Begin the Celebration 🎉</button>
      </div>
    </section>`;

  const btn = $("#begin-btn");
  if (!btn) return;
  btn.addEventListener(
    "click",
    (e) => {
      try {
        const r = e.currentTarget.getBoundingClientRect();
        popperAt(r.left + r.width / 2, r.top + r.height / 2);
        burstAt(r.left + r.width / 2, r.top + r.height / 2, 8);
        drizzle(700);
      } catch {}
      onBegin?.();
    },
    { once: true, passive: true }
  );
}

// --- CELEBRATION ---
export function startCelebration(root, data, afterMount) {
  const d = normalizeData(data);

  try {
    startShow();
    confettiBurstAt(innerWidth / 2, innerHeight * 0.3);
    drizzle(900);
  } catch {}

  root.innerHTML = celebrationMarkup(d);
  hydrate(d);
  afterMount && afterMount();
}

function celebrationMarkup(d) {
  const name = d.recipient?.name ? `, ${escapeHtml(d.recipient.name)}` : "";
  const rec = d.recipient?.name ? escapeHtml(d.recipient.name) : "Chanchan";
  const snd = d.sender?.name ? escapeHtml(d.sender.name) : "Angaanba";
  const caption = snd ? `For ${rec} 💗 from ${snd} 💗` : `For ${rec} 💗`;

  return `
  <div id="scene">
    <section class="min-h-[32vh] flex items-center justify-center pt-10 text-center">
      <div class="max-w-4xl mx-auto px-6">
        <h1 class="dancing-script text-6xl md:text-7xl font-bold text-rose-900 mb-3">
          ${escapeHtml(d.hero?.title || "Happy Birthday! 🌹")}
        </h1>
        <p class="text-lg md:text-xl text-rose-900/85 font-light">
          ${escapeHtml(
            (d.hero?.subtitle || "To someone incredibly precious ✨") + name
          )}
        </p>
      </div>
    </section>

    <section class="py-10 px-4">
      <div class="max-w-5xl mx-auto flex justify-center">
        <figure class="polaroid soft-glow w-[min(92vw,740px)]">
          <div class="polaroid-frame">
            <img id="star-photo" src="" alt="For you" loading="eager" fetchpriority="high">
          </div>
          <figcaption class="caption">${caption}</figcaption>
        </figure>
      </div>
    </section>

    <section class="py-10 px-4">
      <div class="max-w-3xl mx-auto text-center wish-card">
        <h2 class="dancing-script text-5xl font-bold text-rose-900 mb-5">A Special Wish 💝</h2>
        <button id="reveal-wish-btn" class="bg-white text-rose-700 px-7 py-3 rounded-full hover:bg-rose-50 transition shadow">
          Reveal Message 🎁
        </button>
        <div id="birthday-wish" class="hidden mt-6 text-xl leading-relaxed prose-wish"></div>
      </div>
    </section>

    <section class="py-10 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="dancing-script text-5xl font-bold text-rose-900 text-center mb-6">Cute Cat pics(since u like cats) ✨</h2>
        <div id="pin-wall" class="pin-grid"></div>
      </div>
    </section>
  </div>`;
}

function hydrate(d) {
  // portrait
  const star = $("#star-photo");
  const first = (Array.isArray(d.gallery) ? d.gallery : [])[0];
  if (star) {
    const url = toHttpUrl(first?.url);
    if (url) star.src = url;
    else star.replaceWith(fallbackStar());
  }

  // wish
  const out = $("#birthday-wish");
  const btn = $("#reveal-wish-btn");
  if (out && btn) {
    out.innerHTML = "";
    d.wish.forEach((t, i) => {
      const p = document.createElement("p");
      p.className =
        i === 0 ? "dancing-script text-3xl line-reveal" : "line-reveal";
      p.style.animationDelay = `${i * 120}ms`;
      p.textContent = t;
      out.appendChild(p);
    });
    btn.addEventListener(
      "click",
      (e) => {
        out.classList.remove("hidden");
        btn.style.display = "none";
        try {
          const r = e.currentTarget.getBoundingClientRect();
          popperAt(r.left + r.width / 2, r.top + r.height / 2);
          confettiBurstAt(r.left + r.width / 2, r.top + r.height / 2);
          drizzle(800);
        } catch {}
      },
      { once: true }
    );
  }

  // pins
  const wall = $("#pin-wall");
  if (wall) {
    wall.innerHTML = "";
    const links = Array.isArray(d.links) ? d.links : [];
    if (!links.length) {
      wall.innerHTML = `<div class="text-rose-900/70 text-center">Add cute Pinterest image URLs in Admin → Links ✨</div>`;
    } else {
      const frag = document.createDocumentFragment();
      links.forEach((l, i) => {
        const url = toHttpUrl(l?.url);
        if (!url) return;
        const cell = document.createElement("div");
        cell.className = "pin";
        cell.style.setProperty("--tilt", (i % 2 ? 1 : -1).toString());
        cell.innerHTML = `<img src="${escapeHtml(
          url
        )}" alt="pin" loading="lazy" referrerpolicy="no-referrer">`;
        frag.appendChild(cell);
      });
      wall.appendChild(frag);
    }
  }

  // scroll micro-bursts
  const sections = Array.from($$("#scene section"));
  if (sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !en.target._popped) {
            en.target._popped = true;
            try {
              const r = en.target.getBoundingClientRect();
              popperAt(
                r.left + r.width / 2,
                r.top + Math.min(r.height * 0.35, 220)
              );
            } catch {}
          }
        });
      },
      { threshold: 0.35 }
    );
    sections.forEach((s) => io.observe(s));
  }
}

// helpers
function fallbackStar() {
  const f = document.createElement("div");
  f.className = "polaroid soft-glow w-[min(92vw,740px)]";
  f.innerHTML = `<div class="polaroid-frame" style="height:62vh;min-height:360px"><div class="text-rose-700/85">Add a portrait in Admin → Gallery</div></div><div class="caption">for you 💗</div>`;
  return f;
}
function toHttpUrl(u = "") {
  try {
    const out = new URL(u, location.origin);
    return out.protocol === "http:" || out.protocol === "https:"
      ? out.toString()
      : "";
  } catch {
    return "";
  }
}
function normalizeData(d) {
  const x = d && typeof d === "object" ? d : {};
  x.hero = x.hero || {};
  x.recipient = x.recipient || {};
  x.sender = x.sender || {};
  x.wish = Array.isArray(x.wish)
    ? x.wish
    : typeof x.wish === "string"
    ? x.wish.split("\n").filter(Boolean)
    : [];
  x.links = Array.isArray(x.links) ? x.links : [];
  x.gallery = Array.isArray(x.gallery) ? x.gallery : [];
  return x;
}
