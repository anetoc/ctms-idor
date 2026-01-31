"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { ActionItem, ActionItemStatus } from "@/types"
import { ActionItemCard } from "./action-item-card"
import { cn, formatStatus } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface KanbanColumnProps {
  id: ActionItemStatus
  title: string
  items: ActionItem[]
  onItemClick?: (item: ActionItem) => void
}

const columnColors: Record<ActionItemStatus, string> = {
  new: "border-t-blue-500",
  in_progress: "border-t-violet-500",
  waiting_external: "border-t-amber-500",
  done: "border-t-green-500",
  cancelled: "border-t-gray-500",
}

const badgeVariants: Record<ActionItemStatus, "new" | "in-progress" | "waiting" | "done" | "default"> = {
  new: "new",
  in_progress: "in-progress",
  waiting_external: "waiting",
  done: "done",
  cancelled: "default",
}

export function KanbanColumn({ id, title, items, onItemClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-[500px] bg-muted/50 rounded-lg border-t-4 transition-colors",
        columnColors[id],
        isOver && "bg-muted ring-2 ring-primary"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">{formatStatus(id)}</h3>
        <Badge variant={badgeVariants[id]} className="ml-2">
          {items.length}
        </Badge>
      </div>

      {/* Column content */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            Nenhum item
          </div>
        )}
      </div>
    </div>
  )
}
