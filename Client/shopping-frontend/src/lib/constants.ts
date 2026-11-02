export const API_URL = (
  (import.meta.env.VITE_API_URL ?? "").trim() ||
  "https://lumora-server-kwev.onrender.com"
).replace(/\/+$/, "");
