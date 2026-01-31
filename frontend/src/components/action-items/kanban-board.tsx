"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { ActionItem, ActionItemStatus } from "@/types"
import { KanbanColumn } from "./kanban-column"
import { ActionItemCard } from "./action-item-card"
import { useActionItemsStore, useItemsByStatus } from "@/stores/action-items-store"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

interface KanbanBoardProps {
  onItemClick?: (item: ActionItem) => void
}

const KANBAN_COLUMNS: { id: ActionItemStatus; title: string }[] = [
  { id: "new", title: "Novo" },
  { id: "in_progress", title: "Em Progresso" },
  { id: "waiting_external", title: "Aguardando Externo" },
  { id: "done", title: "Concluído" },
]

export function KanbanBoard({ onItemClick }: KanbanBoardProps) {
  const itemsByStatus = useItemsByStatus()
  const { updateItemStatus, items } = useActionItemsStore()
  const { toast } = useToast()
  const [activeItem, setActiveItem] = useState<ActionItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const item = items.find((i) => i.id === active.id)
    if (item) {
      setActiveItem(item)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dropped on a column
    const targetStatus = KANBAN_COLUMNS.find((col) => col.id === overId)?.id
    if (!targetStatus) return

    // Find the item being dragged
    const item = items.find((i) => i.id === activeId)
    if (!item || item.status === targetStatus) return

    // Optimistic update
    updateItemStatus(activeId, targetStatus)

    try {
      // Update on server
      await api.actionItems.updateStatus(activeId, targetStatus)
      toast({
        title: "Status atualizado",
        description: `Item movido para "${targetStatus.replace("_", " ")}"`,
      })
    } catch (error) {
      // Revert on error
      updateItemStatus(activeId, item.status)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar status. Tente novamente.",
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            items={itemsByStatus[column.id] || []}
            onItemClick={onItemClick}
          />
        ))}
      </div>

      {/* Drag overlay for smooth dragging */}
      <DragOverlay>
        {activeItem ? (
          <div className="rotate-3 opacity-90">
            <ActionItemCard item={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
