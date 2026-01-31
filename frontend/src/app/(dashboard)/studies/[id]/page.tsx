"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StudyDialog } from "@/components/studies/study-dialog"
import { Study, ActionItem, StudyStatus } from "@/types"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { formatDate, formatCategory, formatSeverity } from "@/lib/utils"
import {
  ArrowLeft,
  Edit,
  Calendar,
  Building,
  User,
  Target,
  ListTodo,
  Clock,
  AlertTriangle,
} from "lucide-react"

const STATUS_LABELS: Record<StudyStatus, string> = {
  in_development: "Em Desenvolvimento",
  active: "Ativo",
  enrolling: "Em Recrutamento",
  closed_to_enrollment: "Recrutamento Fechado",
  completed: "Concluido",
  terminated: "Encerrado",
  suspended: "Suspenso",
}

const STATUS_COLORS: Record<StudyStatus, string> = {
  in_development: "bg-gray-500",
  active: "bg-green-500",
  enrolling: "bg-blue-500",
  closed_to_enrollment: "bg-amber-500",
  completed: "bg-violet-500",
  terminated: "bg-red-500",
  suspended: "bg-orange-500",
}

// Mock data
const mockStudy: Study & { pi_name?: string; enrollment_target?: number; enrollment_current?: number } = {
  id: "study-1",
  protocol_number: "IDOR-2024-001",
  short_title: "Estudo Cardio Alpha",
  full_title: "Estudo de Fase III em Cardiologia para Avaliacao de Nova Terapia Anti-Hipertensiva",
  sponsor: "Pharma Inc",
  phase: "III",
  therapeutic_area: "Cardiologia",
  status: "active",
  start_date: "2024-01-15",
  end_date: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-15",
  pi_name: "Dr. Maria Santos",
  enrollment_target: 100,
  enrollment_current: 45,
}

const mockActionItems: ActionItem[] = [
  {
    id: "1",
    study_id: "study-1",
    title: "Resolver pendencia ANVISA",
    description: "Documentacao de submissao incompleta",
    category: "regulatory_finding",
    severity: "critical",
    status: "new",
    assigned_to_id: "user-1",
    created_by_id: "user-2",
    due_date: "2024-02-20",
    completed_at: null,
    sla_days: 7,
    source_type: null,
    source_id: null,
    created_at: "2024-01-13",
    updated_at: "2024-01-13",
  },
  {
    id: "2",
    study_id: "study-1",
    title: "Desvio de protocolo - Visita fora da janela",
    description: "Paciente 003 realizou visita V3 fora da janela permitida",
    category: "protocol_deviation",
    severity: "major",
    status: "in_progress",
    assigned_to_id: "user-1",
    created_by_id: "user-2",
    due_date: "2024-02-15",
    completed_at: null,
    sla_days: 14,
    source_type: null,
    source_id: null,
    created_at: "2024-01-25",
    updated_at: "2024-01-26",
  },
  {
    id: "3",
    study_id: "study-1",
    title: "Treinamento de equipe",
    description: "Treinamento GCP para novos membros",
    category: "training_required",
    severity: "info",
    status: "done",
    assigned_to_id: "user-1",
    created_by_id: "user-2",
    due_date: "2024-01-30",
    completed_at: "2024-01-28",
    sla_days: 14,
    source_type: null,
    source_id: null,
    created_at: "2024-01-15",
    updated_at: "2024-01-28",
  },
]

export default function StudyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const studyId = params.id as string

  const [study, setStudy] = useState<(Study & { pi_name?: string; enrollment_target?: number; enrollment_current?: number }) | null>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchStudy = async () => {
    try {
      const [studyRes, itemsRes] = await Promise.all([
        api.studies.get(studyId),
        api.actionItems.list({ study_id: studyId }),
      ])
      setStudy(studyRes.data)
      setActionItems(itemsRes.data.data || itemsRes.data || [])
    } catch (error) {
      console.log("Using mock data for development")
      setStudy(mockStudy)
      setActionItems(mockActionItems)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (studyId) {
      fetchStudy()
    }
  }, [studyId])

  const handleStudyUpdated = (updatedStudy: Study) => {
    setStudy({ ...study, ...updatedStudy })
    toast({
      title: "Estudo atualizado",
      description: "As alteracoes foram salvas com sucesso.",
    })
  }

  const handleActionItemClick = (item: ActionItem) => {
    router.push(`/action-items?item=${item.id}`)
  }

  // Calculate enrollment progress
  const enrollmentProgress = study?.enrollment_target && study?.enrollment_current
    ? Math.round((study.enrollment_current / study.enrollment_target) * 100)
    : 0

  // Calculate action item stats
  const openItems = actionItems.filter((item) => item.status !== "done" && item.status !== "cancelled")
  const overdueItems = actionItems.filter((item) => {
    if (!item.due_date || item.status === "done" || item.status === "cancelled") return false
    return new Date(item.due_date) < new Date()
  })

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Carregando estudo...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!study) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Estudo nao encontrado" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Estudo nao encontrado</h2>
            <p className="text-muted-foreground mt-1">
              O estudo solicitado nao existe ou foi removido.
            </p>
            <Button className="mt-4" onClick={() => router.push("/studies")}>
              Voltar para Estudos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title={study.short_title} />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/studies")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Estudos
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Study Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{study.short_title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {study.protocol_number}
                </p>
              </div>
              <Badge className={`${STATUS_COLORS[study.status]} text-white`}>
                {STATUS_LABELS[study.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {study.full_title && (
              <p className="text-muted-foreground mb-4">{study.full_title}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Patrocinador</p>
                  <p className="font-medium">{study.sponsor || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Investigador Principal</p>
                  <p className="font-medium">{study.pi_name || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de Inicio</p>
                  <p className="font-medium">{formatDate(study.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fase / Area</p>
                  <p className="font-medium">
                    Fase {study.phase} - {study.therapeutic_area || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Enrollment Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Progresso de Recrutamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {study.enrollment_target ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {study.enrollment_current || 0}
                    </span>
                    <span className="text-muted-foreground">
                      / {study.enrollment_target} participantes
                    </span>
                  </div>
                  <Progress value={enrollmentProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {enrollmentProgress}% da meta
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Meta de recrutamento nao definida
                </p>
              )}
            </CardContent>
          </Card>

          {/* Open Action Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Action Items Abertos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openItems.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                de {actionItems.length} total
              </p>
            </CardContent>
          </Card>

          {/* Overdue Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Itens Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overdueItems.length > 0 ? "text-red-600" : ""}`}>
                {overdueItems.length}
              </div>
              {overdueItems.length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Requerem atencao imediata
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Items Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Action Items ({actionItems.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/action-items?study=${studyId}`)}
              >
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {actionItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum action item para este estudo.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionItems.slice(0, 5).map((item) => {
                    const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "done"
                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => handleActionItemClick(item)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <Clock className="h-4 w-4 text-red-500" />
                            )}
                            {item.title}
                          </div>
                        </TableCell>
                        <TableCell>{formatCategory(item.category)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.severity === "critical"
                                ? "destructive"
                                : item.severity === "major"
                                ? "default"
                                : item.severity === "minor"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {formatSeverity(item.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell className={isOverdue ? "text-red-600 font-medium" : ""}>
                          {formatDate(item.due_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            {actionItems.length > 5 && (
              <div className="p-4 text-center border-t">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => router.push(`/action-items?study=${studyId}`)}
                >
                  Ver todos os {actionItems.length} itens
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <StudyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        study={study}
        onSuccess={handleStudyUpdated}
      />
    </div>
  )
}
