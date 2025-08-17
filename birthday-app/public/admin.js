// ---- API base autodetect & helpers ----
const storedApi = localStorage.getItem("apiBase");
const urlApiParam = new URLSearchParams(location.search).get("api");
if (urlApiParam) localStorage.setItem("apiBase", urlApiParam);
const API_BASE =
  urlApiParam ||
  storedApi ||
  (location.origin.startsWith("http")
    ? location.origin
    : "http://localhost:3000");

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let state = {
  hero: { title: "", subtitle: "", showHearts: true },
  recipient: { name: "" },
  sender: { name: "" }, // NEW
  wish: [],
  music: { type: "none", src: "" },
  gallery: [],
  links: [],
};

function renderGallery() {
  const holder = $("#gallery-list");
  holder.innerHTML = "";
  state.gallery.forEach((g, idx) => {
    const card = document.createElement("div");
    card.className = "bg-white/40 rounded overflow-hidden shadow";
    card.innerHTML = `
      <img src="${g.url}" alt="Gallery" class="w-full h-32 object-cover">
      <div class="p-2 flex justify-between items-center">
        <span class="text-white/90 text-sm truncate">${g.url}</span>
        <button class="text-red-100 hover:text-white" data-rm="${idx}">✕</button>
      </div>`;
    holder.appendChild(card);
  });

  holder.querySelectorAll("[data-rm]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const i = +e.currentTarget.dataset.rm;
      const item = state.gallery[i];
      const isLocalUpload = item?.url?.startsWith("/uploads/images/");
      try {
        if (isLocalUpload) {
          await fetch("/api/delete/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: item.url }),
          });
        }
      } catch {
        alert("Could not delete file on server (removing from list anyway).");
      }
      state.gallery.splice(i, 1);
      renderGallery();
      try {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        });
      } catch {}
    });
  });
}
function renderLinks() {
  const holder = $("#links-list");
  holder.innerHTML = "";
  state.links.forEach((l, idx) => {
    const row = document.createElement("div");
    row.className = "item-card";
    row.innerHTML = `
      <a href="${l.url}" class="text-white font-semibold hover:underline" target="_blank" rel="noopener">${l.title}</a>
      <button class="text-red-100 hover:text-white" data-rm="${idx}">✕</button>
    `;
    holder.appendChild(row);
  });
  holder.querySelectorAll("[data-rm]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      state.links.splice(+e.currentTarget.dataset.rm, 1);
      renderLinks();
      try {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        });
      } catch {}
    });
  });
}
function setMusicTypeUI(type) {
  ["file", "youtube", "spotify"].forEach((t) => {
    const el = $("#music-" + t);
    if (!el) return;
    if (type === t) el.classList.remove("hidden");
    else el.classList.add("hidden");
  });
}

// Load existing
fetch("/api/data")
  .then((r) => r.json())
  .then((data) => {
    state = data;
    $("#hero-title").value = state.hero.title || "";
    $("#hero-subtitle").value = state.hero.subtitle || "";
    $("#hero-hearts").checked = !!state.hero.showHearts;
    $("#recipient-name").value = state.recipient.name || "";
    $("#sender-name").value = state.sender?.name || ""; // NEW
    $("#wish-text").value = (state.wish || []).join("\n");

    const type = state.music?.type || "none";
    $$('input[name="music-type"]').forEach(
      (r) => (r.checked = r.value === type)
    );
    setMusicTypeUI(type);
    if (type === "youtube") $("#youtube-url").value = state.music.src || "";
    if (type === "spotify") $("#spotify-url").value = state.music.src || "";
    if (type === "file") $("#audio-url").textContent = state.music.src || "";

    renderGallery();
    renderLinks();
  });

// Inputs
$("#hero-title").addEventListener(
  "input",
  (e) => (state.hero.title = e.target.value)
);
$("#hero-subtitle").addEventListener(
  "input",
  (e) => (state.hero.subtitle = e.target.value)
);
$("#hero-hearts").addEventListener(
  "change",
  (e) => (state.hero.showHearts = e.target.checked)
);
$("#recipient-name").addEventListener(
  "input",
  (e) => (state.recipient.name = e.target.value)
);
// NEW sender
$("#sender-name").addEventListener("input", (e) => {
  state.sender = state.sender || {};
  state.sender.name = e.target.value;
});

$("#wish-text").addEventListener("input", (e) => {
  state.wish = e.target.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
});

$$('input[name="music-type"]').forEach((r) => {
  r.addEventListener("change", () => {
    state.music.type = r.value;
    if (r.value !== "file") state.music.src = "";
    setMusicTypeUI(r.value);
  });
});

$("#upload-audio").addEventListener("click", async () => {
  const f = $("#audio-file").files?.[0];
  if (!f) return alert("Pick an audio file first");
  const fd = new FormData();
  fd.append("audio", f);
  const res = await fetch("/api/upload/audio", { method: "POST", body: fd });
  if (!res.ok) {
    alert("Upload failed");
    return;
  }
  const j = await res.json();
  state.music.type = "file";
  state.music.src = j.url;
  $("#audio-url").textContent = j.url;
  $$('input[name="music-type"]').forEach(
    (x) => (x.checked = x.value === "file")
  );
  setMusicTypeUI("file");
});

$("#youtube-url").addEventListener("input", (e) => {
  state.music.type = "youtube";
  state.music.src = e.target.value.trim();
});
$("#spotify-url").addEventListener("input", (e) => {
  state.music.type = "spotify";
  state.music.src = e.target.value.trim();
});

$("#add-image-url").addEventListener("click", async () => {
  const raw = $("#image-url").value.trim();
  if (!raw) return;
  try {
    const res = await fetch("/api/import-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: raw }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) throw new Error(j.error || "Import failed");
    state.gallery.push({ url: j.url }); // locally rehosted
    $("#image-url").value = "";
    renderGallery();
  } catch {
    alert("Could not import that URL. Try a direct image URL or use Upload.");
  }
});
$("#upload-image").addEventListener("click", async () => {
  const f = $("#image-file").files?.[0];
  if (!f) return alert("Pick an image first");
  const fd = new FormData();
  fd.append("image", f);
  const res = await fetch("/api/upload/image", { method: "POST", body: fd });
  if (!res.ok) {
    alert("Upload failed");
    return;
  }
  const j = await res.json();
  state.gallery.push({ url: j.url });
  renderGallery();
});

$("#add-link").addEventListener("click", () => {
  const title = $("#link-title").value.trim();
  let url = $("#link-url").value.trim();
  if (!title || !url) return;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  state.links.push({ title, url });
  $("#link-title").value = "";
  $("#link-url").value = "";
  renderLinks();
});

$("#save-btn").addEventListener("click", async () => {
  if (!state.hero.title) return alert("Please add a hero title.");
  const res = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!res.ok) return alert("Save failed.");
  alert("Saved! Open the Recipient Page to preview.");
});
$("#sender-name").addEventListener("input", (e) => {
  state.sender = state.sender || {};
  state.sender.name = e.target.value;
});
