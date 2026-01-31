"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { KanbanBoard } from "@/components/action-items/kanban-board"
import { FiltersSidebar } from "@/components/action-items/filters-sidebar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useActionItemsStore } from "@/stores/action-items-store"
import { api } from "@/lib/api-client"
import { ActionItem, Study, User } from "@/types"
import { Filter, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Mock data for development
const mockActionItems: ActionItem[] = [
  {
    id: "1",
    study_id: "study-1",
    study: {
      id: "study-1",
      protocol_number: "IDOR-2024-001",
      short_title: "Estudo Cardio Alpha",
      full_title: "Estudo de Fase III em Cardiologia",
      sponsor: "Pharma Inc",
      phase: "III",
      therapeutic_area: "Cardiology",
      status: "active",
      start_date: "2024-01-15",
      end_date: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-15",
    },
    title: "Resolver pendencia ANVISA - Documentacao incompleta",
    description: "Documentacao de submissao incompleta conforme solicitacao",
    category: "regulatory_finding",
    severity: "critical",
    status: "new",
    assigned_to_id: "user-1",
    assigned_to: {
      id: "user-1",
      email: "maria@idor.org",
      name: "Maria Silva",
      role: "coordinator",
      department: "Regulatory",
      is_active: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    created_by_id: "user-2",
    due_date: "2024-01-20",
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
    study: {
      id: "study-1",
      protocol_number: "IDOR-2024-001",
      short_title: "Estudo Cardio Alpha",
      full_title: "Estudo de Fase III em Cardiologia",
      sponsor: "Pharma Inc",
      phase: "III",
      therapeutic_area: "Cardiology",
      status: "active",
      start_date: "2024-01-15",
      end_date: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-15",
    },
    title: "Desvio de protocolo - Visita fora da janela",
    description: "Paciente 003 realizou visita V3 fora da janela permitida",
    category: "protocol_deviation",
    severity: "major",
    status: "in_progress",
    assigned_to_id: "user-1",
    assigned_to: {
      id: "user-1",
      email: "maria@idor.org",
      name: "Maria Silva",
      role: "coordinator",
      department: "Regulatory",
      is_active: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
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
    study_id: "study-2",
    study: {
      id: "study-2",
      protocol_number: "IDOR-2024-002",
      short_title: "Estudo Onco Beta",
      full_title: "Estudo de Fase II em Oncologia",
      sponsor: "Bio Corp",
      phase: "II",
      therapeutic_area: "Oncology",
      status: "enrolling",
      start_date: "2024-02-01",
      end_date: null,
      created_at: "2024-01-15",
      updated_at: "2024-02-01",
    },
    title: "Aguardando resposta do patrocinador",
    description: "Query sobre criterios de inclusao pendente de resposta",
    category: "sponsor_request",
    severity: "minor",
    status: "waiting_external",
    assigned_to_id: "user-3",
    assigned_to: {
      id: "user-3",
      email: "joao@idor.org",
      name: "Joao Santos",
      role: "monitor",
      department: "Clinical Ops",
      is_active: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    created_by_id: "user-2",
    due_date: "2024-02-28",
    completed_at: null,
    sla_days: 30,
    source_type: null,
    source_id: null,
    created_at: "2024-02-01",
    updated_at: "2024-02-05",
  },
  {
    id: "4",
    study_id: "study-1",
    study: {
      id: "study-1",
      protocol_number: "IDOR-2024-001",
      short_title: "Estudo Cardio Alpha",
      full_title: "Estudo de Fase III em Cardiologia",
      sponsor: "Pharma Inc",
      phase: "III",
      therapeutic_area: "Cardiology",
      status: "active",
      start_date: "2024-01-15",
      end_date: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-15",
    },
    title: "Treinamento de equipe concluido",
    description: "Treinamento GCP atualizado para toda equipe do estudo",
    category: "training_required",
    severity: "info",
    status: "done",
    assigned_to_id: "user-1",
    assigned_to: {
      id: "user-1",
      email: "maria@idor.org",
      name: "Maria Silva",
      role: "coordinator",
      department: "Regulatory",
      is_active: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
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

const mockStudies: Study[] = [
  {
    id: "study-1",
    protocol_number: "IDOR-2024-001",
    short_title: "Estudo Cardio Alpha",
    full_title: "Estudo de Fase III em Cardiologia",
    sponsor: "Pharma Inc",
    phase: "III",
    therapeutic_area: "Cardiology",
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
    therapeutic_area: "Oncology",
    status: "enrolling",
    start_date: "2024-02-01",
    end_date: null,
    created_at: "2024-01-15",
    updated_at: "2024-02-01",
  },
]

const mockUsers: User[] = [
  {
    id: "user-1",
    email: "maria@idor.org",
    name: "Maria Silva",
    role: "coordinator",
    department: "Regulatory",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: "user-3",
    email: "joao@idor.org",
    name: "Joao Santos",
    role: "monitor",
    department: "Clinical Ops",
    is_active: true,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
]

export default function ActionItemsPage() {
  const { setItems, setLoading, items } = useActionItemsStore()
  const [studies, setStudies] = useState<Study[]>(mockStudies)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      // Try to fetch from API
      const [itemsRes, studiesRes, usersRes] = await Promise.all([
        api.actionItems.list(),
        api.studies.list(),
        api.users.list(),
      ])
      setItems(itemsRes.data.data || itemsRes.data)
      setStudies(studiesRes.data.data || studiesRes.data)
      setUsers(usersRes.data.data || usersRes.data)
    } catch (error) {
      // Use mock data in development
      console.log("Using mock data for development")
      setItems(mockActionItems)
      setStudies(mockStudies)
      setUsers(mockUsers)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast({
      title: "Atualizado",
      description: "Lista de action items atualizada.",
    })
  }

  const handleItemClick = (item: ActionItem) => {
    // TODO: Open detail modal/drawer
    console.log("Item clicked:", item)
    toast({
      title: item.title,
      description: `Status: ${item.status} | Severidade: ${item.severity}`,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Action Items" />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                Kanban Board ({items.length} itens)
              </h2>
            </div>

            <div className="flex items-center gap-2">
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

              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>

              {/* Mobile filter trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <FiltersSidebar
                    studies={studies}
                    users={users}
                    className="mt-6"
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Kanban board */}
          <KanbanBoard onItemClick={handleItemClick} />
        </div>

        {/* Desktop filters sidebar */}
        <aside className="hidden lg:block w-72 border-l bg-card p-4 overflow-auto">
          <FiltersSidebar studies={studies} users={users} />
        </aside>
      </div>
    </div>
  )
}
