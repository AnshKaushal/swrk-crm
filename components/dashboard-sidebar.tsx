"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  IconLayoutKanban,
  IconUsers,
  IconSettings,
  IconBriefcase,
  IconX,
  IconReportMoney,
  IconUserSearch,
} from "@tabler/icons-react"

const navItems = [
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: IconLayoutKanban,
    roles: ["super_admin", "admin", "manager", "employee"],
  },
  {
    href: "/employees",
    label: "Employees",
    icon: IconUserSearch,
    roles: ["super_admin", "admin", "manager"],
  },
  {
    href: "/leads",
    label: "Leads",
    icon: IconBriefcase,
    roles: ["super_admin", "admin", "manager", "employee"],
  },
  {
    href: "/revenue",
    label: "Revenue",
    icon: IconReportMoney,
    roles: ["super_admin"],
  },
  { href: "/users", label: "Users", icon: IconUsers, roles: ["super_admin"] },
  {
    href: "/settings",
    label: "Settings",
    icon: IconSettings,
    roles: ["super_admin", "admin", "manager", "employee"],
  },
]

export function DashboardSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(role ?? "employee"),
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform duration-200 md:relative md:translate-x-0 md:h-screen md:sticky md:top-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/pipeline" className="flex items-center">
            <img src="/logo-dark.svg" alt="SWRK CRM" className="h-6 dark:hidden" />
            <img src="/logo-light.svg" alt="SWRK CRM" className="hidden h-6 dark:block" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <IconX className="size-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {filteredNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-3 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-3 text-[10px] text-sidebar-foreground/40">
          SWRK CRM v0.1
        </div>
      </aside>
    </>
  )
}
