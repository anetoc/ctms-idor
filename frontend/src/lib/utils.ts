import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a human-readable format
 */
export function formatDate(date: string | Date | null, formatStr: string = "dd/MM/yyyy"): string {
  if (!date) return "-"
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ptBR })
}

/**
 * Format a date string to relative time (e.g., "2 days ago")
 */
export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return "-"
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR })
}

/**
 * Calculate days remaining until due date
 * Returns negative number if overdue
 */
export function getDaysRemaining(dueDate: string | Date | null): number | null {
  if (!dueDate) return null
  const dateObj = typeof dueDate === "string" ? parseISO(dueDate) : dueDate
  return differenceInDays(dateObj, new Date())
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: string | Date | null): boolean {
  const days = getDaysRemaining(dueDate)
  return days !== null && days < 0
}

/**
 * Get severity color class
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-500 text-white",
    major: "bg-orange-500 text-white",
    minor: "bg-yellow-500 text-black",
    info: "bg-blue-500 text-white",
  }
  return colors[severity] || "bg-gray-500 text-white"
}

/**
 * Get severity badge variant
 */
export function getSeverityVariant(severity: string): "destructive" | "default" | "secondary" | "outline" {
  const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    critical: "destructive",
    major: "default",
    minor: "secondary",
    info: "outline",
  }
  return variants[severity] || "default"
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-blue-500 text-white",
    in_progress: "bg-violet-500 text-white",
    waiting_external: "bg-amber-500 text-black",
    done: "bg-green-500 text-white",
    cancelled: "bg-gray-500 text-white",
  }
  return colors[status] || "bg-gray-500 text-white"
}

/**
 * Format status for display
 */
export function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    new: "Novo",
    in_progress: "Em Progresso",
    waiting_external: "Aguardando Externo",
    done: "Concluído",
    cancelled: "Cancelado",
  }
  return labels[status] || status
}

/**
 * Format category for display
 */
export function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    regulatory_finding: "Achado Regulatório",
    protocol_deviation: "Desvio de Protocolo",
    safety_report: "Relatório de Segurança",
    document_pending: "Documento Pendente",
    training_required: "Treinamento Necessário",
    site_issue: "Problema do Site",
    sponsor_request: "Solicitação do Patrocinador",
    internal_task: "Tarefa Interna",
    other: "Outro",
  }
  return labels[category] || category
}

/**
 * Format severity for display
 */
export function formatSeverity(severity: string): string {
  const labels: Record<string, string> = {
    critical: "Crítico",
    major: "Maior",
    minor: "Menor",
    info: "Informativo",
  }
  return labels[severity] || severity
}

/**
 * Format study status for display
 */
export function formatStudyStatus(status: string): string {
  const labels: Record<string, string> = {
    in_development: "Em Desenvolvimento",
    active: "Ativo",
    enrolling: "Em Recrutamento",
    closed_to_enrollment: "Recrutamento Fechado",
    completed: "Concluído",
    terminated: "Encerrado",
    suspended: "Suspenso",
  }
  return labels[status] || status
}

/**
 * Format study phase for display
 */
export function formatPhase(phase: string): string {
  const labels: Record<string, string> = {
    I: "Fase I",
    II: "Fase II",
    III: "Fase III",
    IV: "Fase IV",
    NA: "Não Aplicável",
  }
  return labels[phase] || `Fase ${phase}`
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}
