self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through network fetch so Next.js 16 edge cache & APIs stay fresh
  if (event.request.method !== "GET") return;
});
