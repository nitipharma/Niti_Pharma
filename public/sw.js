// Service Worker for PWA caching
const CACHE_NAME = "niti-pharma-v1"
const DATA_CACHE_NAME = "niti-pharma-data-v1"
const MODEL_CACHE_NAME = "niti-pharma-models-v1"

// Cache-first resources (data files, models)
const CACHE_FIRST_PATTERNS = [
  /\/data\/.*\.json$/,
  /\/data\/.*\.bin$/,
  /.*tesseract.*/,
  /.*transformers.*/,
  /.*onnx.*/,
  /.*wasm$/,
]

// Network-first resources (HTML, JS chunks)
const NETWORK_FIRST_PATTERNS = [
  /\/_next\/static\/.*/,
  /\/.*\.js$/,
  /\/.*\.css$/,
]

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching essential resources")
      return cache.addAll([
        "/",
        "/catalog",
        "/manifest.webmanifest",
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== CACHE_NAME &&
              name !== DATA_CACHE_NAME &&
              name !== MODEL_CACHE_NAME
            )
          })
          .map((name) => {
            console.log("[Service Worker] Deleting old cache:", name)
            return caches.delete(name)
          })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return
  }

  // Cache-first for data files and models
  if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request, DATA_CACHE_NAME))
    return
  }

  // Network-first for HTML and JS chunks
  if (NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request, CACHE_NAME))
    return
  }

  // Default: network-first with cache fallback
  event.respondWith(networkFirst(request, CACHE_NAME))
})

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error("[Service Worker] Cache-first fetch failed:", error)
    throw error
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log("[Service Worker] Network failed, trying cache:", error)
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

// Message handler for cache management
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

