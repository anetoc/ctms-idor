"use client"

import { KpiCard } from "./kpi-card"
import { AlertCircle, Clock, ListTodo, Target } from "lucide-react"
import { DashboardStats } from "@/types"

interface StatsCardsProps {
  stats: DashboardStats | null
  isLoading?: boolean
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Itens em Atraso"
        value={stats.overdue_count}
        description="Action items past due date"
        icon={AlertCircle}
        threshold={{
          good: 0,
          warning: 5,
          type: "below",
        }}
        trend={
          stats.overdue_count > 0
            ? { value: 12, direction: "up", isPositive: false }
            : undefined
        }
      />

      <KpiCard
        title="Aging P90 (dias)"
        value={stats.aging_p90_days}
        description="90th percentile aging in days"
        icon={Clock}
        threshold={{
          good: 7,
          warning: 14,
          type: "below",
        }}
      />

      <KpiCard
        title="Total de Action Items"
        value={stats.total_action_items}
        description="Open items across all studies"
        icon={ListTodo}
      />

      <KpiCard
        title="SLA Compliance"
        value={`${stats.sla_compliance_percent}%`}
        description="Items closed within SLA"
        icon={Target}
        threshold={{
          good: 90,
          warning: 75,
          type: "above",
        }}
        trend={{
          value: 3,
          direction: "up",
          isPositive: true,
        }}
      />
    </div>
  )
}
