"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Already installed",
        description: "This app is already installed on your device.",
      })
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      toast({
        title: "App installed!",
        description: "The app has been added to your home screen.",
      })
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
  }

  if (isInstalled) {
    return null
  }

  if (!deferredPrompt) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  )
}

