// recipient.js — minimal boot
import { getData } from "./api.js";
import { playBackgroundMusic } from "./music.js";
import { renderHero, startCelebration } from "./scene.js";
import { $ } from "./utils.js";

const root = $("#root");

getData()
  .then((data) => {
    // Start audio inside the same user gesture (Begin click), then render celebration
    renderHero(root, data, () => {
      try {
        playBackgroundMusic(data.music);
      } catch {}
      startCelebration(root, data, () => {});
    });
  })
  .catch((err) => {
    console.error("getData failed, using defaults:", err);
    const data = {
      hero: {
        title: "Happy Birthday! 🌹",
        subtitle: "To someone incredibly precious ✨",
      },
      recipient: { name: "" },
      sender: { name: "" },
      wish: ["You are amazing!"],
      gallery: [],
      links: [],
      music: { type: "none", src: "" },
    };
    renderHero(root, data, () => startCelebration(root, data, () => {}));
  });
