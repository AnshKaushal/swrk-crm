"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconMessage, IconCurrencyDollar, IconCurrencyRupee } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface LeadCard {
  _id: string
  name: string
  company: string
  value: number
  currency?: string
  commentCount?: number
  assignedTo?: { name: string; email: string }
}

const currencyIcons: Record<string, typeof IconCurrencyDollar> = {
  USD: IconCurrencyDollar,
  INR: IconCurrencyRupee,
}

export function KanbanCard({ lead }: { lead: LeadCard }) {
  const router = useRouter()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const CurrencyIcon = currencyIcons[lead.currency || "INR"] || IconCurrencyRupee

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`/leads/${lead._id}`)}
      className="cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{lead.name}</p>
              {lead.commentCount && lead.commentCount > 0 ? (
                <Badge variant="outline" className="shrink-0 h-5 gap-1 text-[10px]">
                  <IconMessage className="size-2.5" />
                  {lead.commentCount}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
            {lead.value > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <CurrencyIcon className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {lead.value.toLocaleString("en-US")}
                </span>
              </div>
            )}
            {lead.assignedTo && (
              <Badge variant="outline" className="mt-2 text-[10px] h-5">
                {lead.assignedTo.name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
