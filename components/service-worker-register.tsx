"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Only register service worker in production
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered:", registration)

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // New service worker installed; it takes over on the
                    // next navigation. Never force-reload the page under
                    // the user.
                    console.log("New service worker available; will activate on next visit")
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error)
          })
      } else {
        // In development, unregister any existing service workers
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
            console.log("Service Worker unregistered for development")
          }
        })
      }
    }
  }, [])

  return null
}

