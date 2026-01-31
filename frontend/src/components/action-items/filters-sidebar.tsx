"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useActionItemsStore } from "@/stores/action-items-store"
import {
  ActionItemCategory,
  ActionItemSeverity,
  Study,
  User,
} from "@/types"
import { formatCategory, formatSeverity, cn } from "@/lib/utils"
import { X, Filter, AlertTriangle } from "lucide-react"

interface FiltersSidebarProps {
  studies?: Study[]
  users?: User[]
  className?: string
}

const CATEGORIES: ActionItemCategory[] = [
  "regulatory_finding",
  "protocol_deviation",
  "safety_report",
  "document_pending",
  "training_required",
  "site_issue",
  "sponsor_request",
  "internal_task",
  "other",
]

const SEVERITIES: ActionItemSeverity[] = ["critical", "major", "minor", "info"]

export function FiltersSidebar({ studies = [], users = [], className }: FiltersSidebarProps) {
  const { filters, setFilters, clearFilters } = useActionItemsStore()

  const hasActiveFilters =
    (filters.category?.length ?? 0) > 0 ||
    (filters.severity?.length ?? 0) > 0 ||
    filters.study_id ||
    filters.assigned_to_id ||
    filters.is_overdue !== undefined

  const toggleCategory = (category: ActionItemCategory) => {
    const current = filters.category || []
    const newCategories = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    setFilters({ category: newCategories.length > 0 ? newCategories : undefined })
  }

  const toggleSeverity = (severity: ActionItemSeverity) => {
    const current = filters.severity || []
    const newSeverities = current.includes(severity)
      ? current.filter((s) => s !== severity)
      : [...current, severity]
    setFilters({ severity: newSeverities.length > 0 ? newSeverities : undefined })
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <Separator />

      {/* Overdue toggle */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Apenas Atrasados
        </Label>
        <Button
          variant={filters.is_overdue ? "destructive" : "outline"}
          size="sm"
          className="w-full"
          onClick={() =>
            setFilters({
              is_overdue: filters.is_overdue === true ? undefined : true,
            })
          }
        >
          {filters.is_overdue ? "Mostrando atrasados" : "Mostrar apenas atrasados"}
        </Button>
      </div>

      <Separator />

      {/* Category filter */}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              variant={filters.category?.includes(category) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => toggleCategory(category)}
            >
              {formatCategory(category)}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Severity filter */}
      <div className="space-y-2">
        <Label>Severidade</Label>
        <div className="flex flex-wrap gap-1">
          {SEVERITIES.map((severity) => {
            const isSelected = filters.severity?.includes(severity)
            return (
              <Badge
                key={severity}
                variant={isSelected ? (severity as "critical" | "major" | "minor" | "info") : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => toggleSeverity(severity)}
              >
                {formatSeverity(severity)}
              </Badge>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Study filter */}
      <div className="space-y-2">
        <Label>Estudo</Label>
        <Select
          value={filters.study_id || "all"}
          onValueChange={(value) =>
            setFilters({ study_id: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os estudos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estudos</SelectItem>
            {studies.map((study) => (
              <SelectItem key={study.id} value={study.id}>
                {study.short_title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Assigned to filter */}
      <div className="space-y-2">
        <Label>Responsavel</Label>
        <Select
          value={filters.assigned_to_id || "all"}
          onValueChange={(value) =>
            setFilters({ assigned_to_id: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os usuarios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuarios</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
