"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ActionItem,
  ActionItemCategory,
  ActionItemSeverity,
  ActionItemStatus,
  Study,
} from "@/types"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface ActionItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionItem?: ActionItem | null
  studies: Study[]
  defaultStudyId?: string
  onSuccess?: (actionItem: ActionItem) => void
}

const CATEGORIES: { value: ActionItemCategory; label: string }[] = [
  { value: "regulatory_finding", label: "Achado Regulatorio" },
  { value: "protocol_deviation", label: "Desvio de Protocolo" },
  { value: "safety_report", label: "Relatorio de Seguranca" },
  { value: "document_pending", label: "Documento Pendente" },
  { value: "training_required", label: "Treinamento Necessario" },
  { value: "site_issue", label: "Problema do Site" },
  { value: "sponsor_request", label: "Solicitacao do Patrocinador" },
  { value: "internal_task", label: "Tarefa Interna" },
  { value: "other", label: "Outro" },
]

const SEVERITIES: { value: ActionItemSeverity; label: string }[] = [
  { value: "critical", label: "Critico" },
  { value: "major", label: "Maior" },
  { value: "minor", label: "Menor" },
  { value: "info", label: "Informativo" },
]

const STATUSES: { value: ActionItemStatus; label: string }[] = [
  { value: "new", label: "Novo" },
  { value: "in_progress", label: "Em Progresso" },
  { value: "waiting_external", label: "Aguardando Externo" },
  { value: "done", label: "Concluido" },
  { value: "cancelled", label: "Cancelado" },
]

interface FormData {
  title: string
  description: string
  study_id: string
  category: ActionItemCategory
  severity: ActionItemSeverity
  status: ActionItemStatus
  due_date: string
  sla_days: number | ""
}

const initialFormData: FormData = {
  title: "",
  description: "",
  study_id: "",
  category: "internal_task",
  severity: "minor",
  status: "new",
  due_date: "",
  sla_days: "",
}

export function ActionItemDialog({
  open,
  onOpenChange,
  actionItem,
  studies,
  defaultStudyId,
  onSuccess,
}: ActionItemDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isEditing = !!actionItem

  useEffect(() => {
    if (actionItem) {
      setFormData({
        title: actionItem.title,
        description: actionItem.description || "",
        study_id: actionItem.study_id,
        category: actionItem.category,
        severity: actionItem.severity,
        status: actionItem.status,
        due_date: actionItem.due_date || "",
        sla_days: actionItem.sla_days || "",
      })
    } else {
      setFormData({
        ...initialFormData,
        study_id: defaultStudyId || "",
      })
    }
  }, [actionItem, open, defaultStudyId])

  const handleChange = (
    field: keyof FormData,
    value: string | number | ActionItemCategory | ActionItemSeverity | ActionItemStatus
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O titulo e obrigatorio.",
      })
      return
    }

    if (!formData.study_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um estudo.",
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        description: formData.description || null,
        due_date: formData.due_date || null,
        sla_days: formData.sla_days === "" ? null : Number(formData.sla_days),
      }

      let result: ActionItem
      if (isEditing) {
        const response = await api.actionItems.update(actionItem.id, payload)
        result = response.data
        toast({
          title: "Action Item atualizado",
          description: `"${formData.title}" foi atualizado com sucesso.`,
        })
      } else {
        const response = await api.actionItems.create(payload)
        result = response.data
        toast({
          title: "Action Item criado",
          description: `"${formData.title}" foi criado com sucesso.`,
        })
      }

      onSuccess?.(result)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving action item:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error.response?.data?.detail ||
          "Falha ao salvar action item. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Action Item" : "Novo Action Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informacoes do action item."
              : "Preencha as informacoes para criar um novo action item."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">
              Titulo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Descreva brevemente o action item"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Detalhes adicionais sobre o action item..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Study */}
          <div className="grid gap-2">
            <Label htmlFor="study_id">
              Estudo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.study_id}
              onValueChange={(value) => handleChange("study_id", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estudo..." />
              </SelectTrigger>
              <SelectContent>
                {studies.map((study) => (
                  <SelectItem key={study.id} value={study.id}>
                    {study.protocol_number} - {study.short_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  handleChange("category", value as ActionItemCategory)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="grid gap-2">
              <Label htmlFor="severity">Severidade</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) =>
                  handleChange("severity", value as ActionItemSeverity)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((sev) => (
                    <SelectItem key={sev.value} value={sev.value}>
                      {sev.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status (only when editing) */}
          {isEditing && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleChange("status", value as ActionItemStatus)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="grid gap-2">
              <Label htmlFor="due_date">Data de Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* SLA Days */}
            <div className="grid gap-2">
              <Label htmlFor="sla_days">SLA (dias)</Label>
              <Input
                id="sla_days"
                type="number"
                min={1}
                value={formData.sla_days}
                onChange={(e) =>
                  handleChange(
                    "sla_days",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="Ex: 7"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar Alteracoes" : "Criar Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
