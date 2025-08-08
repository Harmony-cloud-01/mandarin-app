"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] SW registered:", reg.scope)
        })
        .catch((err) => console.warn("[PWA] SW register failed:", err))
    }
  }, [])

  return null
}
