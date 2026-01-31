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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.dashboard.getStats()
        setStats(response.data)
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        // Use mock data for development
        setStats({
          total_action_items: 47,
          overdue_count: 8,
          aging_p90_days: 12,
          sla_compliance_percent: 82,
          by_status: {
            new: 15,
            in_progress: 18,
            waiting_external: 9,
            done: 5,
            cancelled: 0,
          },
          by_category: {
            regulatory_finding: 12,
            protocol_deviation: 8,
            safety_report: 5,
            document_pending: 10,
            training_required: 4,
            site_issue: 3,
            sponsor_request: 3,
            internal_task: 2,
            other: 0,
          },
          by_severity: {
            critical: 6,
            major: 15,
            minor: 18,
            info: 8,
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
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

  const categoryData = stats
    ? Object.entries(stats.by_category)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name: name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : []

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
