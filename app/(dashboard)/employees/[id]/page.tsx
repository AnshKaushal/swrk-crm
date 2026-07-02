"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { KanbanBoard } from "@/components/kanban-board"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconArrowLeft, IconCash, IconCircleCheck, IconClock } from "@tabler/icons-react"
import { toast } from "sonner"

function formatCurrency(value: number, currency: "INR" | "USD" = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
}

interface Employee {
  _id: string
  name: string
  email: string
  role: string
}

interface StageBreakdown {
  _id: string
  count: number
  totalValue: number
}

interface PipelineValue {
  _id: string
  total: number
}

interface PaymentBreakdown {
  _id: string
  totalCollected: number
  totalPending: number
  paidCount: number
  totalCount: number
}

interface Stats {
  totalLeads: number
  wonLeads: number
  byStage: StageBreakdown[]
  pipelineValue: PipelineValue[]
  payments: PaymentBreakdown[]
}

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
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [commLoading, setCommLoading] = useState(true)

  const isSuperAdmin = session?.user?.role === "super_admin"

  const fetchData = useCallback(async () => {
    try {
      const [empRes, statsRes, commRes] = await Promise.all([
        fetch(`/api/users/${params.id}`),
        fetch(`/api/employees/${params.id}/stats`),
        fetch(`/api/commissions?userId=${params.id}`),
      ])
      if (empRes.status === 403 || statsRes.status === 403) {
        router.push("/pipeline")
        return
      }
      const empData = await empRes.json()
      setEmployee(empData)

      const statsData = await statsRes.json()
      setStats(statsData)

      if (commRes.ok) {
        const commData = await commRes.json()
        setCommissions(commData)
      }
    } catch {
      toast.error("Failed to load employee data")
    } finally {
      setLoading(false)
      setCommLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Employee not found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/employees")}>
          <IconArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-lg font-medium">{employee.name}</h1>
          <p className="text-xs text-muted-foreground">{employee.email}</p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.totalLeads}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Won Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.wonLeads}</p>
            </CardContent>
          </Card>
          {stats.pipelineValue.map((pv) => (
            <Card key={pv._id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Pipeline Value ({pv._id})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatCurrency(pv.total, pv._id as "INR" | "USD")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stats && stats.byStage.length > 0 && (
        <div className="rounded-sm border">
          <div className="p-3 border-b">
            <h2 className="text-sm font-medium">Lead Breakdown by Stage</h2>
          </div>
          <div className="divide-y">
            {stats.byStage.map((s) => (
              <div key={s._id} className="flex items-center justify-between px-3 py-2">
                <span className="text-xs">{STAGE_LABELS[s._id] || s._id}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{s.count} leads</span>
                  <span className="text-xs font-medium">{formatCurrency(s.totalValue, "INR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!commLoading && commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <IconCash className="size-4" />
              Commissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Deal Value</TableHead>
                  <TableHead>Amount Received</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {isSuperAdmin && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.dealName}</TableCell>
                    <TableCell>{formatCurrency(c.dealValue, c.currency as "INR" | "USD")}</TableCell>
                    <TableCell>{formatCurrency(c.paymentAmount, c.currency as "INR" | "USD")}</TableCell>
                    <TableCell>{c.commissionRate}%</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(c.commissionAmount, c.currency as "INR" | "USD")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                        {c.status === "paid" ? "Disbursed" : "Pending"}
                      </Badge>
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
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/commissions", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ commissionId: c._id, status: "paid" }),
                                })
                                if (!res.ok) throw new Error()
                                toast.success("Commission marked as paid")
                                fetchData()
                              } catch {
                                toast.error("Failed to update commission")
                              }
                            }}
                          >
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-medium mb-3">Pipeline</h2>
        <KanbanBoard userId={params.id as string} />
      </div>
    </div>
  )
}
