import { NetworkFirst, Serwist } from "serwist";

declare const self: typeof globalThis & {
  __SW_MANIFEST: Array<{ revision: string | null; url: string }>;
};

type WorkerFetchEvent = Event & {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
};

type WorkerLifecycleEvent = Event & {
  waitUntil(promise: Promise<unknown>): void;
};

const OFFLINE_CACHE = "kukudhamini-offline-v1";
const NAVIGATION_CACHE = "kukudhamini-navigation-v1";

self.addEventListener("install", (event) => {
  const lifecycleEvent = event as WorkerLifecycleEvent;
  lifecycleEvent.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.add("/offline.html")));
});

self.addEventListener("activate", (event) => {
  const lifecycleEvent = event as WorkerLifecycleEvent;
  lifecycleEvent.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("kukudhamini-") && ![OFFLINE_CACHE, NAVIGATION_CACHE, "kukudhamini-static-v1"].includes(key)).map((key) => caches.delete(key)))));
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: ({ request }) => ["script", "style", "image", "font"].includes(request.destination),
      handler: new NetworkFirst({ cacheName: "kukudhamini-static-v1" }),
    },
  ],
});

// Keep navigations available when the server cannot render the authenticated route.
self.addEventListener("fetch", (event) => {
  const fetchEvent = event as WorkerFetchEvent;
  if (fetchEvent.request.mode !== "navigate") return;
  fetchEvent.stopImmediatePropagation();
  fetchEvent.respondWith((async () => {
    try {
      const response = await fetch(fetchEvent.request);
      if (response.ok && new URL(fetchEvent.request.url).origin === self.location.origin) {
        const cache = await caches.open(NAVIGATION_CACHE);
        await cache.put(fetchEvent.request, response.clone());
      }
      return response;
    } catch {
      const cachedNavigation = await caches.match(fetchEvent.request);
      if (cachedNavigation) return cachedNavigation;
      const fallback = await caches.match("/offline.html");
      if (!fallback) return Response.error();
      const html = await fallback.text();
      const requestedUrl = new URL(fetchEvent.request.url);
      const requestedPath = `${requestedUrl.pathname}${requestedUrl.search}`;
      return new Response(html.replace("__RETURN_PATH__", JSON.stringify(requestedPath)), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
  })());
});

serwist.registerCapture(
  ({ request }) => request.mode === "navigate",
  async ({ request }) => {
    try {
      return await fetch(request);
    } catch {
      const fallback = await caches.match("/offline.html");
      if (!fallback) return Response.error();
      const html = await fallback.text();
      const requestedPath = `${new URL(request.url).pathname}${new URL(request.url).search}`;
      return new Response(html.replace("__RETURN_PATH__", JSON.stringify(requestedPath)), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
  },
);

serwist.addEventListeners();
