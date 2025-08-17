// server.js — static no-cache + uploads + delete + editable sender
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const UPLOAD_IMG_DIR = path.join(PUBLIC_DIR, "uploads", "images");
const UPLOAD_AUDIO_DIR = path.join(PUBLIC_DIR, "uploads", "audio");
[DATA_DIR, UPLOAD_IMG_DIR, UPLOAD_AUDIO_DIR].forEach((p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const DATA_FILE = path.join(DATA_DIR, "site.json");
function defaults() {
  return {
    hero: {
      title: "Happy Birthday! 🌹",
      subtitle: "To someone incredibly precious ✨",
      showHearts: true,
    },
    recipient: { name: "Beautiful" },
    sender: { name: "Angaanba" }, // NEW
    wish: [
      "✨ Happy Birthday to someone truly special! ✨",
      "May your day be filled with happiness and your year with joy.",
      "You bring so much light into this world, and today we celebrate YOU!",
      "Here's to another year of wonderful memories and beautiful moments.",
      "You are precious beyond words! 💖",
    ],
    music: { type: "none", src: "" },
    gallery: [],
    links: [],
  };
}
if (!fs.existsSync(DATA_FILE))
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaults(), null, 2), "utf8");
const loadData = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const saveData = (d) =>
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2), "utf8");

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get(["/admin.html"], (_req, res) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

// --- NO-CACHE for static files so updates show immediately
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ["html"],
    etag: false,
    lastModified: false,
    maxAge: 0,
    setHeaders(res) {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    },
  })
);

/* ---------- uploads ---------- */
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_IMG_DIR),
  filename: (_req, file, cb) =>
    cb(
      null,
      Date.now() +
        "-" +
        Math.random().toString(36).slice(2) +
        path.extname(file.originalname).toLowerCase()
    ),
});
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_AUDIO_DIR),
  filename: (_req, file, cb) =>
    cb(
      null,
      Date.now() +
        "-" +
        Math.random().toString(36).slice(2) +
        path.extname(file.originalname).toLowerCase()
    ),
});
const imageFilter = (_req, file, cb) =>
  cb(null, file.mimetype?.startsWith("image/"));
const audioFilter = (_req, file, cb) =>
  cb(null, file.mimetype?.startsWith("audio/"));
const uploadImage = multer({ storage: imageStorage, fileFilter: imageFilter });
const uploadAudio = multer({ storage: audioStorage, fileFilter: audioFilter });

/* ---------- API ---------- */
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/data", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(loadData());
});
app.get("/api/debug/site", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.type("application/json").send(fs.readFileSync(DATA_FILE, "utf8"));
});
app.post("/api/data", (req, res) => {
  const body = req.body || {};
  const prev = loadData();
  const data = structuredClone(prev);
  data.hero = body.hero ?? data.hero;
  data.recipient = body.recipient ?? data.recipient;
  data.sender = body.sender ?? data.sender; // NEW
  data.wish = Array.isArray(body.wish) ? body.wish : data.wish;
  data.music = body.music ?? data.music;
  data.gallery = Array.isArray(body.gallery) ? body.gallery : data.gallery;
  data.links = Array.isArray(body.links) ? body.links : data.links;
  saveData(data);
  res.json({ ok: true, saved: data });
});

app.post("/api/upload/image", uploadImage.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  res.json({
    ok: true,
    url: "/uploads/images/" + path.basename(req.file.path),
  });
});
app.post("/api/upload/audio", uploadAudio.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio uploaded" });
  res.json({ ok: true, url: "/uploads/audio/" + path.basename(req.file.path) });
});
app.post("/api/import-image", async (req, res) => {
  try {
    const url = (req.body?.url || "").trim();
    if (!/^https?:\/\//i.test(url))
      return res.status(400).json({ error: "Invalid URL" });
    const r = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxContentLength: 15 * 1024 * 1024,
    });
    const ct = (r.headers["content-type"] || "").toLowerCase();
    if (!ct.startsWith("image/"))
      return res.status(400).json({ error: "URL is not an image" });
    const ext = ct.includes("jpeg")
      ? ".jpg"
      : ct.includes("png")
      ? ".png"
      : ct.includes("gif")
      ? ".gif"
      : ct.includes("webp")
      ? ".webp"
      : ".img";
    const fname = Date.now() + "-" + Math.random().toString(36).slice(2) + ext;
    const fpath = path.join(UPLOAD_IMG_DIR, fname);
    fs.writeFileSync(fpath, Buffer.from(r.data));
    res.json({ ok: true, url: "/uploads/images/" + fname });
  } catch {
    res.status(500).json({ error: "Import failed" });
  }
});

/* ------ NEW: delete a locally-hosted image + prune site.json ------ */
app.post("/api/delete/image", (req, res) => {
  try {
    const url = (req.body?.url || "").trim();
    if (!url.startsWith("/uploads/images/")) {
      return res.status(400).json({ error: "Not a local uploaded image URL" });
    }
    const filePath = path.join(PUBLIC_DIR, url.replace(/^\//, ""));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const data = loadData();
    data.gallery = (data.gallery || []).filter((g) => g.url !== url);
    saveData(data);

    res.json({ ok: true, removed: url });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🎉 Birthday app running at http://localhost:${PORT}`);
});
