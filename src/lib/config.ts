export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://blue-panda-api-demo.onrender.com/api"
    : "http://localhost:8000/api")
).replace(/\/+$/, "");

export const STOREFRONT_URL = (
  process.env.NEXT_PUBLIC_STOREFRONT_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://blue-panda-storefront-iota.vercel.app"
    : "http://localhost:3000")
).replace(/\/+$/, "");

export const API_DOCS_URL = new URL("/docs", API_BASE_URL).href;
