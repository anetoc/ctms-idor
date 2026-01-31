"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ActionItem } from "@/types"
import {
  cn,
  formatCategory,
  formatSeverity,
  getDaysRemaining,
  getInitials,
  truncate,
} from "@/lib/utils"
import { Calendar, GripVertical } from "lucide-react"

interface ActionItemCardProps {
  item: ActionItem
  onClick?: () => void
}

export function ActionItemCard({ item, onClick }: ActionItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const daysRemaining = getDaysRemaining(item.due_date)
  const isOverdue = daysRemaining !== null && daysRemaining < 0

  // Determine severity badge variant
  const getSeverityVariant = (
    severity: string
  ): "critical" | "major" | "minor" | "info" => {
    return severity as "critical" | "major" | "minor" | "info"
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isDragging && "opacity-50 shadow-lg rotate-2",
        isOverdue && "border-red-500 border-2"
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="font-medium text-sm leading-tight">
              {truncate(item.title, 60)}
            </h4>

            {/* Study name */}
            {item.study && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.study.short_title}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant={getSeverityVariant(item.severity)} className="text-xs">
            {formatSeverity(item.severity)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {formatCategory(item.category)}
          </Badge>
        </div>

        {/* Footer with due date and assignee */}
        <div className="flex items-center justify-between mt-2">
          {/* SLA countdown */}
          {item.due_date && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {isOverdue ? (
                <span>ATRASADO ({Math.abs(daysRemaining!)}d)</span>
              ) : (
                <span>{daysRemaining}d restantes</span>
              )}
            </div>
          )}

          {/* Assigned to */}
          {item.assigned_to && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(item.assigned_to.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
