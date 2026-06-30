"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { toast } from "sonner"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

const ROLES = [
  { key: "admin", label: "Admin" },
  { key: "manager", label: "Manager" },
  { key: "employee", label: "Employee" },
]

interface Manager {
  _id: string
  name: string
  email: string
}

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<Manager[]>([])
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "employee",
    assignedManager: "",
  })

  const fetchManagers = useCallback(async () => {
    try {
      const res = await fetch("/api/users?role=manager")
      if (!res.ok) return
      const data = await res.json()
      setManagers(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchManagers()
  }, [fetchManagers])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email) {
      toast.error("Name and email are required")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to create user")
        return
      }

      toast.success(`User created! A welcome email has been sent to ${form.email}`)
      router.push("/users")
    } catch {
      toast.error("Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 w-full">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/users" className="flex items-center gap-1">
            <IconArrowLeft className="size-3.5" />
            Back
          </Link>
        </Button>
        <h1 className="text-lg font-medium">Add User</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">User Details</CardTitle>
          <CardDescription className="text-xs">
            A random password will be generated and sent to the user's email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-8 text-xs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-8 text-xs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.role === "employee" && managers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="manager" className="text-xs">Manager</Label>
                <Select
                  value={form.assignedManager}
                  onValueChange={(v) => setForm({ ...form, assignedManager: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/users">Cancel</Link>
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
