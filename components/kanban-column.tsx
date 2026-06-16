"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import { cn } from "@/lib/utils"

interface Lead {
  _id: string
  name: string
  company: string
  value: number
  assignedTo?: { name: string; email: string }
}

interface KanbanColumnProps {
  id: string
  label: string
  color: string
  leads: Lead[]
}

export function KanbanColumn({ id, label, color, leads }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex shrink-0 flex-col gap-3 w-64 rounded-sm border bg-muted/30 p-3 transition-colors",
        isOver && "bg-muted/60",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", color)} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <SortableContext items={leads.map((l) => l._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[120px]">
          {leads.map((lead) => (
            <KanbanCard key={lead._id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-20 rounded-sm border border-dashed text-[10px] text-muted-foreground">
              Drop leads here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
