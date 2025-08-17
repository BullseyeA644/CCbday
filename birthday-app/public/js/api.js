// api.js
export async function getData() {
  const r = await fetch("/api/data", { cache: "no-store" });
  return r.json();
}
