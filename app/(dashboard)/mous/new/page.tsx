"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowLeft, IconFileDescription } from "@tabler/icons-react"
import { toast } from "sonner"
import Link from "next/link"

export default function NewMOUPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !date) {
      toast.error("Please fill in all fields")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/mous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), date }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to create")
        return
      }

      toast.success("Agreement created")
      router.push("/mous")
    } catch {
      toast.error("Failed to create agreement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/mous">
            <IconArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-medium">New BDE Agreement</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <IconFileDescription className="size-4" />
            Associate Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs">
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs">
                Agreement Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
              >
                <Link href="/mous">Cancel</Link>
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Creating..." : "Create Agreement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
