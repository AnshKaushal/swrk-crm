"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useConfirm } from "@/components/confirm-dialog"
import { toast } from "sonner"
import Link from "next/link"

interface User {
  _id: string
  name: string
  email: string
  role: string
  mustChangePassword: boolean
  assignedManager?: { _id: string; name: string; email: string }
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-500",
  admin: "bg-amber-500",
  manager: "bg-blue-500",
  employee: "bg-gray-500",
}

export default function UsersPage() {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (res.status === 403) {
        router.push("/pipeline")
        return
      }
      const data = await res.json()
      setUsers(data)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleDelete(user: User) {
    const ok = await confirm({
      title: `Delete ${user.name}?`,
      description: "This action cannot be undone. The user will lose access immediately.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/users/${user._id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to delete")
        return
      }
      toast.success("User deleted")
      fetchUsers()
    } catch {
      toast.error("Failed to delete user")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Users</h1>
        <Button asChild size="sm">
          <Link href="/users/new">
            <IconPlus className="size-3.5" />
            Add User
          </Link>
        </Button>
      </div>

      <div className="rounded-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs">Manager</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="text-xs font-medium">{user.name}</TableCell>
                <TableCell className="text-xs">{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${ROLE_COLORS[user.role] || "bg-gray-500"}`} />
                    <span className="text-xs capitalize">{user.role.replace("_", " ")}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {user.assignedManager?.name || "—"}
                </TableCell>
                <TableCell>
                  {user.mustChangePassword ? (
                    <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500">
                      Password reset required
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Active</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.role !== "super_admin" && (
                    <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(user)}>
                      <IconTrash className="size-3 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {dialog}
    </div>
  )
}
