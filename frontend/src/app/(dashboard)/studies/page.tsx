"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StudyDialog } from "@/components/studies/study-dialog"
import { Study, StudyStatus } from "@/types"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, RefreshCw, Filter, FlaskConical } from "lucide-react"

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

// Mock data for development
const mockStudies: Study[] = [
  {
    id: "study-1",
    protocol_number: "IDOR-2024-001",
    short_title: "Estudo Cardio Alpha",
    full_title: "Estudo de Fase III em Cardiologia",
    sponsor: "Pharma Inc",
    phase: "III",
    therapeutic_area: "Cardiologia",
    status: "active",
    start_date: "2024-01-15",
    end_date: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-15",
  },
  {
    id: "study-2",
    protocol_number: "IDOR-2024-002",
    short_title: "Estudo Onco Beta",
    full_title: "Estudo de Fase II em Oncologia",
    sponsor: "Bio Corp",
    phase: "II",
    therapeutic_area: "Oncologia",
    status: "enrolling",
    start_date: "2024-02-01",
    end_date: null,
    created_at: "2024-01-15",
    updated_at: "2024-02-01",
  },
  {
    id: "study-3",
    protocol_number: "IDOR-2024-003",
    short_title: "Estudo Neuro Gamma",
    full_title: "Estudo de Fase I em Neurologia",
    sponsor: "Neuro Labs",
    phase: "I",
    therapeutic_area: "Neurologia",
    status: "in_development",
    start_date: null,
    end_date: null,
    created_at: "2024-02-10",
    updated_at: "2024-02-10",
  },
  {
    id: "study-4",
    protocol_number: "IDOR-2023-015",
    short_title: "Estudo Hemato Delta",
    full_title: "Estudo de Fase IV em Hematologia",
    sponsor: "Hemato Research",
    phase: "IV",
    therapeutic_area: "Hematologia",
    status: "completed",
    start_date: "2023-06-01",
    end_date: "2024-01-30",
    created_at: "2023-05-15",
    updated_at: "2024-01-30",
  },
]

export default function StudiesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [studies, setStudies] = useState<Study[]>([])
  const [filteredStudies, setFilteredStudies] = useState<Study[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sponsorFilter, setSponsorFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudy, setEditingStudy] = useState<Study | null>(null)

  // Get unique sponsors for filter
  const uniqueSponsors = Array.from(
    new Set(studies.map((s) => s.sponsor).filter(Boolean))
  )

  const fetchStudies = async () => {
    try {
      const response = await api.studies.list()
      const data = response.data.data || response.data
      setStudies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.log("Using mock data for development")
      setStudies(mockStudies)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudies()
  }, [])

  // Filter studies based on search and filters
  useEffect(() => {
    let filtered = [...studies]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (study) =>
          study.protocol_number.toLowerCase().includes(term) ||
          study.short_title.toLowerCase().includes(term) ||
          study.sponsor?.toLowerCase().includes(term) ||
          study.therapeutic_area?.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((study) => study.status === statusFilter)
    }

    // Sponsor filter
    if (sponsorFilter !== "all") {
      filtered = filtered.filter((study) => study.sponsor === sponsorFilter)
    }

    setFilteredStudies(filtered)
  }, [studies, searchTerm, statusFilter, sponsorFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchStudies()
    setIsRefreshing(false)
    toast({
      title: "Atualizado",
      description: "Lista de estudos atualizada.",
    })
  }

  const handleRowClick = (study: Study) => {
    router.push(`/studies/${study.id}`)
  }

  const handleNewStudy = () => {
    setEditingStudy(null)
    setDialogOpen(true)
  }

  const handleStudySuccess = (study: Study) => {
    if (editingStudy) {
      setStudies((prev) =>
        prev.map((s) => (s.id === study.id ? study : s))
      )
    } else {
      setStudies((prev) => [study, ...prev])
    }
    setEditingStudy(null)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setSponsorFilter("all")
  }

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || sponsorFilter !== "all"

  return (
    <div className="flex flex-col h-full">
      <Header title="Estudos Clinicos" />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, nome, patrocinador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sponsor Filter */}
            <Select value={sponsorFilter} onValueChange={setSponsorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Patrocinador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Patrocinadores</SelectItem>
                {uniqueSponsors.map((sponsor) => (
                  <SelectItem key={sponsor} value={sponsor}>
                    {sponsor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            <Button size="sm" onClick={handleNewStudy}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Estudo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Estudos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {studies.filter((s) => s.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Recrutamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {studies.filter((s) => s.status === "enrolling").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concluidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">
                {studies.filter((s) => s.status === "completed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Studies Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <p className="text-sm text-muted-foreground">
                    Carregando estudos...
                  </p>
                </div>
              </div>
            ) : filteredStudies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">
                  Nenhum estudo encontrado
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters
                    ? "Tente ajustar os filtros de busca."
                    : "Crie seu primeiro estudo clinico."}
                </p>
                {!hasActiveFilters && (
                  <Button className="mt-4" onClick={handleNewStudy}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Estudo
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Patrocinador</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudies.map((study) => (
                    <TableRow
                      key={study.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(study)}
                    >
                      <TableCell className="font-medium">
                        {study.protocol_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{study.short_title}</p>
                          {study.full_title && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {study.full_title}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{study.sponsor || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Fase {study.phase}</Badge>
                      </TableCell>
                      <TableCell>{study.therapeutic_area || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            STATUS_COLORS[study.status]
                          } text-white`}
                        >
                          {STATUS_LABELS[study.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Results count */}
        {!isLoading && filteredStudies.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Mostrando {filteredStudies.length} de {studies.length} estudos
          </p>
        )}
      </div>

      {/* Study Dialog */}
      <StudyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        study={editingStudy}
        onSuccess={handleStudySuccess}
      />
    </div>
  )
}
