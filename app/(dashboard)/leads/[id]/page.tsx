"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useConfirm } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconTrash,
  IconCurrencyDollar,
  IconCurrencyRupee,
  IconSend,
  IconHistory,
} from "@tabler/icons-react"
import Link from "next/link"

const STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
]

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
}

interface Lead {
  _id: string
  name: string
  company: string
  email: string
  phone: string
  stage: string
  value: number
  currency: string
  notes: string
  assignedTo?: { _id: string; name: string; email: string }
  createdBy?: { _id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
  commentCount?: number
}

interface Comment {
  _id: string
  leadId: string
  userId: { _id: string; name: string; email: string }
  text: string
  createdAt: string
}

interface AuditEntry {
  _id: string
  userId: { _id: string; name: string; email: string }
  oldStage: string
  newStage: string
  createdAt: string
}

interface PaymentData {
  _id: string
  type: "advance" | "milestone" | "completion"
  percentage: number
  amount: number
  currency: string
  status: "pending" | "paid" | "overdue"
  dueDate?: string
  paidDate?: string
  milestoneDescription: string
  notes: string
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { confirm: confirmDelete, dialog: deleteDialog } = useConfirm()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    stage: "new",
    value: "",
    currency: "INR",
    notes: "",
  })

  const fetchLead = useCallback(async () => {
    try {
      const res = await fetch("/api/leads")
      if (!res.ok) {
        router.push("/pipeline")
        return
      }
      const leads = await res.json()
      const found = leads.find((l: Lead) => l._id === params.id)
      if (found) {
        setLead(found)
        setForm({
          name: found.name,
          company: found.company,
          email: found.email || "",
          phone: found.phone || "",
          stage: found.stage,
          value: String(found.value || ""),
          currency: found.currency || "INR",
          notes: found.notes || "",
        })
      }
    } catch {
      toast.error("Failed to load lead")
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${params.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(Array.isArray(data) ? data : [])
      }
    } catch {
      // silently fail
    }
  }, [params.id])

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments?leadId=${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(Array.isArray(data) ? data : [])
      }
    } catch {
      // silently fail
    }
  }, [params.id])

  const fetchAuditLog = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${params.id}/audit`)
      if (res.ok) {
        const data = await res.json()
        setAuditLog(Array.isArray(data) ? data : [])
      }
    } catch {}
  }, [params.id])

  useEffect(() => {
    fetchLead()
    fetchComments()
    fetchPayments()
    fetchAuditLog()
  }, [fetchLead, fetchComments, fetchPayments, fetchAuditLog])

  const isOwner = lead?.assignedTo?._id === session?.user?.id
  const canEdit = session?.user?.role !== "employee" || isOwner
  const canDelete = !!session?.user
  const currencySymbol = CURRENCY_SYMBOLS[lead?.currency || "INR"] || "₹"

  async function handleSave() {
    if (!lead) return
    setSaving(true)

    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: Number(form.value) || 0,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to update")
        return
      }

      toast.success("Lead updated")
      setLead(await res.json())
    } catch {
      toast.error("Failed to update lead")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!lead) return
    const ok = await confirmDelete({
      title: "Delete Lead?",
      description: `Are you sure you want to delete "${lead.name}" from ${lead.company}? This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    })
    if (!ok) return

    try {
      const res = await fetch(`/api/leads/${lead._id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete")
        return
      }
      toast.success("Lead deleted")
      router.push("/pipeline")
    } catch {
      toast.error("Failed to delete")
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return

    setCommentLoading(true)
    try {
      const res = await fetch(`/api/leads/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      })

      if (!res.ok) {
        toast.error("Failed to add comment")
        return
      }

      const newComment = await res.json()
      setComments((prev) => [newComment, ...prev])
      setCommentText("")
      toast.success("Comment added")
    } catch {
      toast.error("Failed to add comment")
    } finally {
      setCommentLoading(false)
    }
  }

  async function handlePaymentUpdate(
    paymentId: string,
    updates: Record<string, any>,
  ) {
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, ...updates }),
      })
      if (!res.ok) {
        toast.error("Failed to update payment")
        return
      }
      const updated = await res.json()
      setPayments((prev) =>
        prev.map((p) => (p._id === paymentId ? { ...p, ...updated } : p)),
      )
      toast.success("Payment updated")
    } catch {
      toast.error("Failed to update payment")
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Lead not found</p>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href="/pipeline">Back to pipeline</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 w-full">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pipeline" className="flex items-center gap-1">
            <IconArrowLeft className="size-3.5" />
            Back
          </Link>
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive"
          >
            <IconTrash className="size-3.5" />
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">{lead.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{lead.company}</p>
            </div>
            <Badge variant="outline">
              {STAGES.find((s) => s.key === lead.stage)?.label || lead.stage}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Assigned To</p>
              <p className="text-xs">{lead.assignedTo?.name || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Created By</p>
              <p className="text-xs">{lead.createdBy?.name || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Value</p>
              <p className="text-xs">
                {currencySymbol}
                {lead.value.toLocaleString("en-US")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Created</p>
              <p className="text-xs">
                {new Date(lead.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {canEdit && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <p className="text-xs font-medium">Edit Lead</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={form.company}
                      onChange={(e) =>
                        setForm({ ...form, company: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Stage</Label>
                  <Select
                    value={form.stage}
                    onValueChange={(v) => setForm({ ...form, stage: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Deal Value</Label>
                    <Input
                      type="number"
                      value={form.value}
                      onChange={(e) =>
                        setForm({ ...form, value: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Currency</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) => setForm({ ...form, currency: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className="text-xs min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {auditLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <IconHistory className="size-3.5" />
              Stage History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {auditLog.map((entry, idx) => {
                const stageLabels: Record<string, string> = {
                  new: "New",
                  contacted: "Contacted",
                  qualified: "Qualified",
                  proposal: "Proposal",
                  negotiation: "Negotiation",
                  closed_won: "Closed Won",
                  closed_lost: "Closed Lost",
                }
                return (
                  <div
                    key={entry._id}
                    className="relative flex gap-3 pb-4 last:pb-0"
                  >
                    {idx < auditLog.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                    )}
                    <div className="mt-1 size-[14px] shrink-0 rounded-full bg-muted-foreground/30" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium">
                          {entry.userId?.name}
                        </span>{" "}
                        moved from{" "}
                        <span className="font-medium">
                          {stageLabels[entry.oldStage] || entry.oldStage}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {stageLabels[entry.newStage] || entry.newStage}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {session?.user?.role === "super_admin" &&
        lead?.stage === "closed_won" &&
        payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {payments.map((payment, idx) => {
                  const labels: Record<string, string> = {
                    advance: "Advance (30%)",
                    milestone: "Milestone (30%)",
                    completion: "Completion (40%)",
                  }
                  const statusColors: Record<string, string> = {
                    paid: "bg-emerald-500",
                    pending: "bg-amber-500",
                    overdue: "bg-red-500",
                  }
                  const statusLabels: Record<string, string> = {
                    paid: "Paid",
                    pending: "Pending",
                    overdue: "Overdue",
                  }
                  return (
                    <div
                      key={payment._id}
                      className="relative flex gap-4 pb-6 last:pb-0"
                    >
                      {idx < payments.length - 1 && (
                        <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border" />
                      )}
                      <div
                        className={`mt-1.5 size-[22px] shrink-0 rounded-full ${statusColors[payment.status]} flex items-center justify-center`}
                      >
                        <span className="text-[10px] font-medium text-white">
                          {payment.percentage}%
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">
                            {labels[payment.type]}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${payment.status === "paid" ? "text-emerald-500 border-emerald-500" : payment.status === "overdue" ? "text-red-500 border-red-500" : ""}`}
                          >
                            {statusLabels[payment.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {payment.currency === "INR" ? "₹" : "$"}
                          {payment.amount.toLocaleString("en-US")}
                        </p>
                        {payment.type === "milestone" && (
                          <div className="mt-2 flex gap-2">
                            <Input
                              className="h-7 text-[10px] flex-1"
                              placeholder="Describe milestone trigger..."
                              defaultValue={
                                payment.milestoneDescription !==
                                "Milestone payment (30%) - set trigger description"
                                  ? payment.milestoneDescription
                                  : ""
                              }
                              onBlur={(e) => {
                                if (
                                  e.target.value.trim() &&
                                  e.target.value !==
                                    payment.milestoneDescription
                                ) {
                                  handlePaymentUpdate(payment._id, {
                                    milestoneDescription: e.target.value.trim(),
                                  })
                                }
                              }}
                            />
                          </div>
                        )}
                        <div className="mt-2 flex gap-1.5">
                          {payment.status === "pending" && (
                            <Button
                              size="xs"
                              variant="outline"
                              className="text-[10px] h-6"
                              onClick={() =>
                                handlePaymentUpdate(payment._id, {
                                  status: "paid",
                                })
                              }
                            >
                              Mark Paid
                            </Button>
                          )}
                          {payment.status === "paid" && (
                            <Button
                              size="xs"
                              variant="outline"
                              className="text-[10px] h-6"
                              onClick={() =>
                                handlePaymentUpdate(payment._id, {
                                  status: "pending",
                                })
                              }
                            >
                              Revert
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Comments
            {comments.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {comments.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={commentLoading || !commentText.trim()}
            >
              <IconSend className="size-3.5" />
            </Button>
          </form>
          <Separator />
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No comments yet
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {comment.userId?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {comment.userId?.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {deleteDialog}
    </div>
  )
}
