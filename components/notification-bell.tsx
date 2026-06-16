"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconBell, IconBellFilled } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  _id: string
  type: string
  message: string
  read: boolean
  relatedLead?: { _id: string; name: string; company: string }
  createdAt: string
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silently fail
    }
  }, [session])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markRead() {
    if (unreadCount === 0) return
    try {
      await fetch("/api/notifications", { method: "PATCH" })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silently fail
    }
  }

  if (!session) return null

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) markRead() }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <IconBellFilled className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[8px] text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </>
          ) : (
            <IconBell className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-medium">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n._id} asChild className="cursor-pointer">
              <Link
                href={n.relatedLead ? `/leads/${n.relatedLead._id}` : "#"}
                className={cn(
                  "flex flex-col items-start gap-1 px-2 py-2",
                  !n.read && "bg-muted/50",
                )}
              >
                <span className="text-xs">{n.message}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
