"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus, IconSearch, IconUpload } from "@tabler/icons-react"
import { toast } from "sonner"
import Link from "next/link"

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
}

const STAGE_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  qualified: "bg-violet-500",
  proposal: "bg-indigo-500",
  negotiation: "bg-orange-500",
  closed_won: "bg-emerald-500",
  closed_lost: "bg-red-500",
}

interface Lead {
  _id: string
  name: string
  company: string
  stage: string
  value: number
  currency: string
  assignedTo?: { _id: string; name: string; email: string }
  createdBy?: { _id: string; name: string; email: string }
  createdAt: string
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState("all")

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads")
      if (!res.ok) {
        setLeads([])
        toast.error("Failed to load leads")
        return
      }
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch {
      setLeads([])
      toast.error("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase())
    const matchesStage = stageFilter === "all" || lead.stage === stageFilter
    return matchesSearch && matchesStage
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">All Leads</h1>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/leads/upload">
              <IconUpload className="size-3.5" />
              Bulk Upload
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/leads/new">
              <IconPlus className="size-3.5" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No leads found</p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/leads/new">Create your first lead</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Company</TableHead>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">Value</TableHead>
                <TableHead className="text-xs">Assigned To</TableHead>
                <TableHead className="text-xs">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow
                  key={lead._id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/leads/${lead._id}`)}
                >
                  <TableCell className="text-xs font-medium">{lead.name}</TableCell>
                  <TableCell className="text-xs">{lead.company}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${STAGE_COLORS[lead.stage] || "bg-gray-500"}`} />
                      <span className="text-xs">{STAGE_LABELS[lead.stage] || lead.stage}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{CURRENCY_SYMBOLS[lead.currency] || "₹"}{lead.value.toLocaleString("en-US")}</TableCell>
                  <TableCell className="text-xs">{lead.assignedTo?.name || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
