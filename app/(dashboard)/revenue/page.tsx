"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { IconCurrencyDollar, IconCurrencyRupee, IconTrendingUp, IconBriefcase, IconCash } from "@tabler/icons-react"

interface RevenueData {
  totalLeads: number
  wonLeads: number
  byCurrency: {
    USD: { pipeline: number; won: number }
    INR: { pipeline: number; won: number }
  }
  byStage: { _id: string; count: number; totalValue: number }[]
  payments: {
    USD: { totalCollected: number; totalPending: number; paidCount: number; totalCount: number }
    INR: { totalCollected: number; totalPending: number; paidCount: number; totalCount: number }
  }
}

export default function RevenuePage() {
  const router = useRouter()
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/revenue")
      if (res.status === 403) { router.push("/pipeline"); return }
      const d = await res.json()
      setData(d)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) return null

  const formatUSD = (v: number) => `$${v.toLocaleString("en-US")}`
  const formatINR = (v: number) => `₹${v.toLocaleString("en-US")}`

  const stages = [
    { key: "new", label: "New", color: "bg-blue-500" },
    { key: "contacted", label: "Contacted", color: "bg-amber-500" },
    { key: "qualified", label: "Qualified", color: "bg-violet-500" },
    { key: "proposal", label: "Proposal", color: "bg-indigo-500" },
    { key: "negotiation", label: "Negotiation", color: "bg-orange-500" },
    { key: "closed_won", label: "Closed Won", color: "bg-emerald-500" },
    { key: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium">Revenue</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <IconBriefcase className="size-3.5" />
              Pipeline (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{formatUSD(data.byCurrency.USD.pipeline)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Won: {formatUSD(data.byCurrency.USD.won)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <IconCurrencyRupee className="size-3.5" />
              Pipeline (INR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{formatINR(data.byCurrency.INR.pipeline)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Won: {formatINR(data.byCurrency.INR.won)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <IconCash className="size-3.5" />
              Collected (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{formatUSD(data.payments.USD.totalCollected)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Pending: {formatUSD(data.payments.USD.totalPending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <IconCash className="size-3.5" />
              Collected (INR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{formatINR(data.payments.INR.totalCollected)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Pending: {formatINR(data.payments.INR.totalPending)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage) => {
                const s = data.byStage.find((s) => s._id === stage.key)
                const count = s?.count || 0
                const totalVal = s?.totalValue || 0
                const maxVal = Math.max(...data.byStage.map((s) => s.totalValue), 1)

                return (
                  <div key={stage.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${stage.color}`} />
                        <span>{stage.label}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {count} deals · ${totalVal.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stage.color} transition-all`}
                        style={{ width: `${(totalVal / maxVal) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium mb-2">USD</p>
              <div className="space-y-2">
                <PaymentBar
                  label="Collected"
                  value={data.payments.USD.totalCollected}
                  total={data.payments.USD.totalCollected + data.payments.USD.totalPending}
                  color="bg-emerald-500"
                />
                <PaymentBar
                  label="Pending"
                  value={data.payments.USD.totalPending}
                  total={data.payments.USD.totalCollected + data.payments.USD.totalPending}
                  color="bg-amber-500"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{data.payments.USD.paidCount} of {data.payments.USD.totalCount} payments cleared</span>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium mb-2">INR</p>
              <div className="space-y-2">
                <PaymentBar
                  label="Collected"
                  value={data.payments.INR.totalCollected}
                  total={data.payments.INR.totalCollected + data.payments.INR.totalPending}
                  color="bg-emerald-500"
                />
                <PaymentBar
                  label="Pending"
                  value={data.payments.INR.totalPending}
                  total={data.payments.INR.totalCollected + data.payments.INR.totalPending}
                  color="bg-amber-500"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{data.payments.INR.paidCount} of {data.payments.INR.totalCount} payments cleared</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PaymentBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">${value.toLocaleString("en-US")}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
