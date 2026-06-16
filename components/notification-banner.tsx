"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { IconBell, IconBellOff, IconX } from "@tabler/icons-react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from(rawData.split("").map((c) => c.charCodeAt(0)))
}

async function subscribeUser() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    toast.error("Push notifications not supported in this browser")
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js")

    // Wait for the service worker to be fully active before subscribing
    if (!registration.active || navigator.serviceWorker.controller === null) {
      await new Promise<void>((resolve) => {
        if (registration.installing) {
          registration.installing.addEventListener("statechange", () => {
            if (registration.active) resolve()
          })
        } else {
          resolve()
        }
      })
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
      ),
    })

    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    })

    if (!res.ok) {
      toast.error("Failed to register push subscription")
      return false
    }

    toast.success("Notifications enabled")
    return true
  } catch (err) {
    console.error("Push subscription failed:", err)
    toast.error("Could not enable notifications. Check browser settings.")
    return false
  }
}

export function NotificationBanner() {
  const { data: session } = useSession()
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | "loading">("loading")
  const [dismissed, setDismissed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    if (!("Notification" in window)) {
      setPermission("unsupported")
      return
    }
    setPermission(Notification.permission)
  }, [session])

  if (!session?.user || dismissed || permission === "loading" || permission === "unsupported") return null

  if (permission === "granted") return null

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
        <IconBellOff className="size-3.5 shrink-0" />
        <span className="flex-1">
          Push notifications are blocked. Enable them in your browser site settings to get lead updates.
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setDismissed(true)}
        >
          <IconX className="size-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-muted/50 border-b px-4 py-2">
      <IconBell className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-xs text-muted-foreground">
        Get notified when leads are created, updated, or commented on.
      </span>
      <Button
        size="xs"
        variant="outline"
        className="text-xs h-7"
        disabled={subscribing}
        onClick={async () => {
          setSubscribing(true)
          const perm = await Notification.requestPermission()
          setPermission(perm)
          if (perm === "granted") {
            await subscribeUser()
            setDismissed(true)
          }
          setSubscribing(false)
        }}
      >
        {subscribing ? "Enabling..." : "Enable Notifications"}
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={() => setDismissed(true)}>
        <IconX className="size-3" />
      </Button>
    </div>
  )
}

export { subscribeUser }
