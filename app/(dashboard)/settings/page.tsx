"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { toast } from "sonner"
import { subscribeUser } from "@/components/notification-banner"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [notificationStatus, setNotificationStatus] =
    useState<string>("checking")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const mustChangePassword = session?.user?.mustChangePassword

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported")
    } else {
      setNotificationStatus(Notification.permission)
    }
  }, [])

  async function handleTestNotification() {
    if (!("Notification" in window)) {
      toast.error("Notification API not supported")
      return
    }
    if (Notification.permission !== "granted") {
      toast.error("Enable notifications in browser site settings first")
      return
    }
    try {
      const n = new Notification("SWRK CRM", {
        body: "Test notification - push is working!",
        icon: "/favicon.ico",
      })
      setTimeout(() => n.close(), 5000)
      toast.success("Test notification sent!")
    } catch (err) {
      toast.error(
        "Failed: " + (err instanceof Error ? err.message : "unknown error"),
      )
    }
  }

  async function handleSubscribe() {
    const ok = await subscribeUser()
    if (ok) {
      setNotificationStatus("granted")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to change password")
        return
      }

      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      await update()

      if (mustChangePassword) {
        router.push("/pipeline")
      }
    } catch {
      toast.error("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {mustChangePassword && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle className="text-sm text-amber-500">
              Password Reset Required
            </CardTitle>
            <CardDescription className="text-xs">
              You must change your password before you can continue
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Change Password</CardTitle>
          <CardDescription className="text-xs">
            {mustChangePassword
              ? "Set a new password for your account"
              : "Update your account password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current" className="text-xs">
                Current Password
              </Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new" className="text-xs">
                New Password
              </Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 text-xs"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-xs">
                Confirm New Password
              </Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-8 text-xs"
                minLength={8}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="sm"
              disabled={loading}
            >
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notifications</CardTitle>
          <CardDescription className="text-xs">
            Receive browser push notifications when leads are created, updated,
            or commented on
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs">Status</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                notificationStatus === "granted"
                  ? "text-emerald-500 border-emerald-500"
                  : notificationStatus === "denied"
                    ? "text-red-500 border-red-500"
                    : notificationStatus === "checking"
                      ? "text-muted-foreground"
                      : "text-amber-500 border-amber-500"
              }`}
            >
              {notificationStatus === "granted"
                ? "Enabled"
                : notificationStatus === "denied"
                  ? "Blocked"
                  : notificationStatus === "unsupported"
                    ? "Not supported"
                    : notificationStatus === "checking"
                      ? "Checking..."
                      : "Not enabled"}
            </Badge>
          </div>
          {notificationStatus === "default" && (
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={handleSubscribe}
            >
              Enable Notifications
            </Button>
          )}
          {notificationStatus === "denied" && (
            <p className="text-xs text-muted-foreground">
              Notifications are blocked. Allow them in your browser site
              settings, then refresh.
            </p>
          )}
          {notificationStatus === "granted" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={handleTestNotification}
            >
              Send Test Notification
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{session?.user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{session?.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="capitalize">
              {session?.user?.role?.replace("_", " ")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
