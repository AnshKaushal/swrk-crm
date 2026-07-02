"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconCurrencyRupee,
  IconCurrencyDollar,
  IconCash,
  IconClock,
  IconCircleCheck,
  IconWallet,
  IconFilter,
} from "@tabler/icons-react"
import { toast } from "sonner"

interface Commission {
  _id: string
  dealName: string
  dealValue: number
  paymentAmount: number
  commissionRate: number
  commissionAmount: number
  currency: string
  status: "pending" | "paid"
  createdAt: string
  paidDate?: string
  exchangeRate?: number
  userId?: { _id: string; name: string; email: string; role: string }
  leadId?: { _id: string; name: string; company: string; value: number; currency: string }
}

interface UserOption {
  _id: string
  name: string
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function EarningsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  const isEmployee = session?.user?.role === "employee"
  const isSuperAdmin = session?.user?.role === "super_admin"

  const fetchCommissions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedUser) params.set("userId", selectedUser)
      const url = `/api/commissions${params.toString() ? `?${params.toString()}` : ""}`
      const res = await fetch(url)
      if (res.status === 403) { router.push("/pipeline"); return }
      const data = await res.json()
      setCommissions(data)
    } catch {
      toast.error("Failed to load commissions")
    } finally {
      setLoading(false)
    }
  }, [router, selectedUser])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/employees")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchCommissions()
    if (!isEmployee) fetchUsers()
  }, [fetchCommissions, fetchUsers, isEmployee])

  async function markAsPaid(commissionId: string) {
    try {
      const res = await fetch("/api/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId, status: "paid" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Commission marked as paid")
      fetchCommissions()
    } catch {
      toast.error("Failed to update commission")
    }
  }

  const totals = commissions.reduce(
    (acc, c) => {
      if (c.status === "paid") {
        acc.paid += c.commissionAmount
        acc.currency = c.currency
      } else if (c.status === "pending") {
        acc.pending += c.commissionAmount
        acc.currency = c.currency
      }
      return acc
    },
    { pending: 0, paid: 0, currency: "INR" },
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Earnings</h1>
        {!isEmployee && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <IconFilter className="size-3.5 mr-1.5" />
            Filters
          </Button>
        )}
      </div>

      {showFilters && !isEmployee && users.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">Filter by BDE:</label>
              <select
                className="h-8 rounded-sm border px-2 text-xs bg-background"
                value={selectedUser}
                onChange={(e) => { setSelectedUser(e.target.value); setLoading(true) }}
              >
                <option value="">All BDEs</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <IconWallet className="size-3.5" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {formatCurrency(totals.pending + totals.paid, totals.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <IconClock className="size-3.5" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {formatCurrency(totals.pending, totals.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <IconCircleCheck className="size-3.5" />
              Disbursed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {formatCurrency(totals.paid, totals.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {commissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <IconCash className="size-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No commissions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Commissions appear here when a deal payment is marked as received.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Commission History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {isEmployee ? (
                    <>
                      <TableHead>Deal</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>BDE</TableHead>
                      <TableHead>Deal</TableHead>
                      <TableHead>Deal Value</TableHead>
                      <TableHead>Amount Received</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      {isSuperAdmin && <TableHead>Action</TableHead>}
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c._id}>
                    {isEmployee ? (
                      <>
                        <TableCell className="font-medium">{c.dealName}</TableCell>
                        <TableCell>{c.commissionRate}%</TableCell>
                        <TableCell>{formatCurrency(c.commissionAmount, c.currency)}</TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">
                          {c.userId?.name || "Unknown"}
                        </TableCell>
                        <TableCell>{c.dealName}</TableCell>
                        <TableCell>
                          {formatCurrency(c.dealValue, c.currency)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(c.paymentAmount, c.currency)}
                        </TableCell>
                        <TableCell>{c.commissionRate}%</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(c.commissionAmount, c.currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            {c.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px]"
                                onClick={() => markAsPaid(c._id)}
                              >
                                Mark Disbursed
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "paid" ? "default" : "secondary"}>
      {status === "paid" ? "Disbursed" : "Pending"}
    </Badge>
  )
}
