"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"

const STAGES = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-amber-500" },
  { key: "qualified", label: "Qualified", color: "bg-violet-500" },
  { key: "proposal", label: "Proposal", color: "bg-indigo-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { key: "closed_won", label: "Closed Won", color: "bg-emerald-500" },
  { key: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
] as const

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
  commentCount: number
  assignedTo?: { _id: string; name: string; email: string }
  createdBy?: { _id: string; name: string; email: string }
}

export function KanbanBoard({ userId }: { userId?: string }) {
  const { data: session } = useSession()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const fetchLeads = useCallback(async () => {
    try {
      const url = userId ? `/api/leads?assignedTo=${userId}` : "/api/leads"
      const res = await fetch(url)
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
  }, [userId])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const getLeadsByStage = (stage: string) =>
    leads.filter((lead) => lead.stage === stage)

  const activeLead = activeId ? leads.find((l) => l._id === activeId) : null

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const overId = over.id as string
    const targetStage = STAGES.find(
      (s) => s.key === overId || getLeadsByStage(s.key).some((l) => l._id === overId),
    )

    if (!targetStage) return

    const leadId = active.id as string
    const lead = leads.find((l) => l._id === leadId)
    if (!lead || lead.stage === targetStage.key) return

    if (
      session?.user?.role === "employee" &&
      lead.assignedTo?._id !== session.user.id
    ) {
      toast.error("You can only move your own leads")
      return
    }

    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, stage: targetStage.key } : l)),
    )

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage.key }),
      })

      if (!res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l._id === leadId ? { ...l, stage: lead.stage } : l)),
        )
        toast.error("Failed to update stage")
        return
      }

      toast.success(`Moved to ${targetStage.label}`)
    } catch {
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, stage: lead.stage } : l)),
      )
      toast.error("Failed to update stage")
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage.key} className="flex shrink-0 flex-col gap-3 w-64">
            <Skeleton className="h-8 w-full" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Sales Pipeline</h1>
        <Button asChild size="sm">
          <Link href="/leads/new">
            <IconPlus className="size-3.5" />
            Add Lead
          </Link>
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.key}
              id={stage.key}
              label={stage.label}
              color={stage.color}
              leads={getLeadsByStage(stage.key)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeLead ? <KanbanCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
