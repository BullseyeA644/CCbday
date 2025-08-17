// music.js — robust mobile-friendly background music with unlock fallback
export function playBackgroundMusic(music) {
  const type = music?.type || "none";
  const src = (music?.src || "").trim();
  const mount = document.getElementById("bg-media") || document.body;

  mount.innerHTML = "";
  if (mount._audioRef && typeof mount._audioRef.pause === "function") {
    try {
      mount._audioRef.pause();
    } catch {}
  }
  mount._audioRef = null;

  if (type === "none" || !src) return;

  const showUnlock = (retry) => {
    if (document.getElementById("audio-unlock")) return;
    const btn = document.createElement("button");
    btn.id = "audio-unlock";
    btn.textContent = "🔊 Tap to enable sound";
    Object.assign(btn.style, {
      position: "fixed",
      left: "50%",
      transform: "translateX(-50%)",
      bottom: "14px",
      zIndex: "60",
      padding: "10px 14px",
      borderRadius: "999px",
      fontWeight: "600",
      background: "rgba(255,255,255,0.9)",
      color: "#8a1d51",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      border: "1px solid rgba(255,182,205,0.55)",
    });
    btn.addEventListener(
      "click",
      async () => {
        try {
          await retry();
          btn.remove();
        } catch {}
      },
      { passive: true }
    );
    document.body.appendChild(btn);
  };

  if (type === "file") {
    const a = new Audio(src);
    a.loop = true;
    a.volume = 0.9;
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    a.setAttribute("playsinline", "true");
    a.playsInline = true;
    mount._audioRef = a;

    const tryPlay = async () => {
      try {
        await a.play();
      } catch (err) {
        showUnlock(tryPlay);
        throw err;
      }
    };
    tryPlay();
    return;
  }

  if (type === "youtube") {
    const id = extractYouTubeId(src) || src;
    mount.innerHTML = `<iframe width="0" height="0" style="position:absolute;left:-9999px;opacity:0"
      src="https://www.youtube.com/embed/${id}?autoplay=1&controls=0&modestbranding=1&playsinline=1"
      title="YouTube" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture"></iframe>`;
    return;
  }

  if (type === "spotify") {
    const id = extractSpotifyTrackId(src) || src;
    mount.innerHTML = `<iframe style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0"
      src="https://open.spotify.com/embed/track/${id}" frameborder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`;
    return;
  }
}
function extractYouTubeId(url = "") {
  const m = url.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
  return m ? m[1] : null;
}
function extractSpotifyTrackId(url = "") {
  const m =
    url.match(/open\.spotify\.com\/track\/([A-Za-z0-9]{22})/) ||
    url.match(/spotify:track:([A-Za-z0-9]{22})/);
  return m ? m[1] : null;
}
