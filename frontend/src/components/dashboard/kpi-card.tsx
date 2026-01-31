"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    direction: "up" | "down"
    isPositive?: boolean
  }
  threshold?: {
    good: number
    warning: number
    type: "below" | "above" // below = lower is better, above = higher is better
  }
  className?: string
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  threshold,
  className,
}: KpiCardProps) {
  // Determine traffic light color based on threshold
  const getTrafficLightColor = () => {
    if (!threshold) return "bg-primary"

    const numValue = typeof value === "string" ? parseFloat(value) : value

    if (threshold.type === "below") {
      // Lower is better (e.g., overdue count)
      if (numValue <= threshold.good) return "bg-green-500"
      if (numValue <= threshold.warning) return "bg-yellow-500"
      return "bg-red-500"
    } else {
      // Higher is better (e.g., SLA compliance %)
      if (numValue >= threshold.good) return "bg-green-500"
      if (numValue >= threshold.warning) return "bg-yellow-500"
      return "bg-red-500"
    }
  }

  const trafficLightColor = getTrafficLightColor()

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Traffic light indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full transition-colors",
          trafficLightColor
        )}
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn("h-4 w-4", trafficLightColor.replace("bg-", "text-"))} />
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <div
              className={cn(
                "flex items-center text-sm",
                trend.isPositive ?? (trend.direction === "down")
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
