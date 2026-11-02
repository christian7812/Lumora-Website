const defaultApiUrl = "https://lumora-server-kwev.onrender.com/api";

export const API_URL = (
  import.meta.env.VITE_API_URL || defaultApiUrl
).replace(/\/+$/, "");
