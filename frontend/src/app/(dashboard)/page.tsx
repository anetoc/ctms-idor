"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api-client"
import { DashboardStats } from "@/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const SEVERITY_COLORS = {
  critical: "#ef4444",
  major: "#f97316",
  minor: "#eab308",
  info: "#3b82f6",
}

const STATUS_COLORS = {
  new: "#3b82f6",
  in_progress: "#8b5cf6",
  waiting_external: "#f59e0b",
  done: "#22c55e",
}

interface DashboardKPIs {
  overdue_count: number
  aging_p90_days: number | null
  total_items: number
  sla_compliance_pct: number
  items_by_severity: Record<string, number>
  items_created_last_7_days: number
  items_resolved_last_7_days: number
}

interface ParetoItem {
  category: string
  count: number
  percentage: number
  cumulative_percentage: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [pareto, setPareto] = useState<ParetoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisRes, paretoRes, actionItemsStatsRes] = await Promise.all([
          api.dashboard.getKpis(),
          api.dashboard.getPareto(),
          api.actionItems.getStats(),
        ])
        setKpis(kpisRes.data)
        setPareto(paretoRes.data)

        // Transform data to DashboardStats format for StatsCards
        setStats({
          total_action_items: kpisRes.data.total_items,
          overdue_count: kpisRes.data.overdue_count,
          aging_p90_days: kpisRes.data.aging_p90_days || 0,
          sla_compliance_percent: kpisRes.data.sla_compliance_pct,
          by_status: actionItemsStatsRes.data.by_status || {},
          by_category: actionItemsStatsRes.data.by_category || {},
          by_severity: kpisRes.data.items_by_severity,
        })
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Prepare chart data
  const severityData = stats
    ? Object.entries(stats.by_severity).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: SEVERITY_COLORS[name as keyof typeof SEVERITY_COLORS],
      }))
    : []

  const statusData = stats
    ? Object.entries(stats.by_status)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          value,
          color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || "#6b7280",
        }))
    : []

  const categoryData = pareto.map((item) => ({
    name: item.category
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    value: item.count,
  }))

  return (
    <div className="flex flex-col h-full">
      <Header title="Command Center" />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* KPI Cards */}
        <StatsCards stats={stats} isLoading={isLoading} />

        {/* Charts row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Severity distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por Severidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category bar chart */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Por Categoria (Top 6)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for additional content */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Itens Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Lista de action items recentes aparecera aqui.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proximos Vencimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Action items com vencimento proximo aparecerao aqui.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
