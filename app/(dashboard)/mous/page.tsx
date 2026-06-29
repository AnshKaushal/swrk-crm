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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconPlus,
  IconDownload,
  IconSend,
  IconTrash,
} from "@tabler/icons-react"
import { useConfirm } from "@/components/confirm-dialog"
import { toast } from "sonner"
import Link from "next/link"

interface MOU {
  _id: string
  name: string
  email: string
  date: string
  status: "pending" | "sent" | "signed"
  sentAt?: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  sent: "bg-blue-500",
  signed: "bg-emerald-500",
}

export default function MOUsPage() {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()
  const [mous, setMOUs] = useState<MOU[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  const fetchMOUs = useCallback(async () => {
    try {
      const res = await fetch("/api/mous")
      if (res.status === 403) {
        router.push("/pipeline")
        return
      }
      const data = await res.json()
      setMOUs(data)
    } catch {
      toast.error("Failed to load agreements")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchMOUs()
  }, [fetchMOUs])

  async function handleSend(mou: MOU) {
    setSending(mou._id)
    try {
      const res = await fetch(`/api/mous/${mou._id}/send`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to send")
        return
      }
      toast.success(`Agreement sent to ${mou.email}`)
      fetchMOUs()
    } catch {
      toast.error("Failed to send email")
    } finally {
      setSending(null)
    }
  }

  async function handleDownload(mou: MOU) {
    try {
      const res = await fetch(`/api/mous/${mou._id}/download`)
      if (!res.ok) throw new Error("Failed to download")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = `SWRK-BDE-Agreement-${mou.name.replace(/\s+/g, "-")}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to download")
    }
  }

  async function handleDelete(mou: MOU) {
    const ok = await confirm({
      title: `Delete agreement for ${mou.name}?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/mous/${mou._id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to delete")
        return
      }
      toast.success("Agreement deleted")
      fetchMOUs()
    } catch {
      toast.error("Failed to delete")
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
        <h1 className="text-lg font-medium">BDE Agreements</h1>
        <Button asChild size="sm">
          <Link href="/mous/new">
            <IconPlus className="size-3.5" />
            New Agreement
          </Link>
        </Button>
      </div>

      <div className="rounded-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Sent</TableHead>
              <TableHead className="text-xs">Created</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mous.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-xs text-muted-foreground py-8"
                >
                  No agreements yet
                </TableCell>
              </TableRow>
            ) : (
              mous.map((mou) => (
                <TableRow key={mou._id}>
                  <TableCell className="text-xs font-medium">
                    {mou.name}
                  </TableCell>
                  <TableCell className="text-xs">{mou.email}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(mou.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-1.5 rounded-full ${STATUS_COLORS[mou.status] || "bg-gray-500"}`}
                      />
                      <span className="text-xs capitalize">{mou.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {mou.sentAt
                      ? new Date(mou.sentAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(mou.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDownload(mou)}
                        title="Download PDF"
                      >
                        <IconDownload className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleSend(mou)}
                        disabled={sending === mou._id}
                        title="Send via Email"
                      >
                        <IconSend
                          className={`size-3 ${sending === mou._id ? "animate-pulse" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(mou)}
                        title="Delete"
                      >
                        <IconTrash className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {dialog}
    </div>
  )
}
