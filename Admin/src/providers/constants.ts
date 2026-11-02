const defaultApiUrl = "https://lumora-server-kwev.onrender.com/api";

const rawApiUrl = (import.meta.env.VITE_API_URL ?? "").trim();

export const API_URL = (rawApiUrl || defaultApiUrl).replace(/\/+$/, "");
