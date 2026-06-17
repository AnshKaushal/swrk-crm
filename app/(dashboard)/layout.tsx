"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { NotificationBanner } from "@/components/notification-banner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <NotificationBanner />
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-0 p-4 md:p-6 flex flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
