// utils.js
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => r.querySelectorAll(s);
export const escapeHtml = (str = "") =>
  str.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[
        c
      ])
  );

export function crossfadeTo(root, html, after) {
  const old = root.firstElementChild;
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const incoming = wrap.firstElementChild;

  if (!old) {
    root.appendChild(incoming);
    after && after();
    return;
  }
  old.classList.add("fade-exit");
  incoming.classList.add("fade-enter");
  root.appendChild(incoming);

  requestAnimationFrame(() => {
    old.classList.add("fade-exit-active");
    incoming.classList.add("fade-enter-active");
    setTimeout(() => {
      old.remove();
      incoming.classList.remove("fade-enter", "fade-enter-active");
      after && after();
    }, 650);
  });
}
