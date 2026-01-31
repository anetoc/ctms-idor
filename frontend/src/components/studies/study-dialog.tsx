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
import { Study, StudyPhase, StudyStatus } from "@/types"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface StudyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  study?: Study | null
  onSuccess?: (study: Study) => void
}

const PHASES: { value: StudyPhase; label: string }[] = [
  { value: "I", label: "Fase I" },
  { value: "II", label: "Fase II" },
  { value: "III", label: "Fase III" },
  { value: "IV", label: "Fase IV" },
  { value: "NA", label: "Nao Aplicavel" },
]

const STATUSES: { value: StudyStatus; label: string }[] = [
  { value: "in_development", label: "Em Desenvolvimento" },
  { value: "active", label: "Ativo" },
  { value: "enrolling", label: "Em Recrutamento" },
  { value: "closed_to_enrollment", label: "Recrutamento Fechado" },
  { value: "completed", label: "Concluido" },
  { value: "terminated", label: "Encerrado" },
  { value: "suspended", label: "Suspenso" },
]

const THERAPEUTIC_AREAS = [
  "Cardiologia",
  "Oncologia",
  "Neurologia",
  "Endocrinologia",
  "Reumatologia",
  "Infectologia",
  "Hematologia",
  "Pneumologia",
  "Gastroenterologia",
  "Nefrologia",
  "Outro",
]

interface FormData {
  protocol_number: string
  short_title: string
  full_title: string
  sponsor: string
  phase: StudyPhase
  therapeutic_area: string
  status: StudyStatus
  pi_name: string
  enrollment_target: number | ""
  start_date: string
}

const initialFormData: FormData = {
  protocol_number: "",
  short_title: "",
  full_title: "",
  sponsor: "",
  phase: "III",
  therapeutic_area: "",
  status: "in_development",
  pi_name: "",
  enrollment_target: "",
  start_date: "",
}

export function StudyDialog({
  open,
  onOpenChange,
  study,
  onSuccess,
}: StudyDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isEditing = !!study

  useEffect(() => {
    if (study) {
      setFormData({
        protocol_number: study.protocol_number,
        short_title: study.short_title,
        full_title: study.full_title,
        sponsor: study.sponsor,
        phase: study.phase,
        therapeutic_area: study.therapeutic_area,
        status: study.status,
        pi_name: (study as any).pi_name || "",
        enrollment_target: (study as any).enrollment_target || "",
        start_date: study.start_date || "",
      })
    } else {
      setFormData(initialFormData)
    }
  }, [study, open])

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.protocol_number.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Numero do protocolo e obrigatorio.",
      })
      return
    }

    if (!formData.short_title.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome curto e obrigatorio.",
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        enrollment_target:
          formData.enrollment_target === ""
            ? null
            : Number(formData.enrollment_target),
        start_date: formData.start_date || null,
      }

      let result: Study
      if (isEditing) {
        const response = await api.studies.update(study.id, payload)
        result = response.data
        toast({
          title: "Estudo atualizado",
          description: `"${formData.short_title}" foi atualizado com sucesso.`,
        })
      } else {
        const response = await api.studies.create(payload)
        result = response.data
        toast({
          title: "Estudo criado",
          description: `"${formData.short_title}" foi criado com sucesso.`,
        })
      }

      onSuccess?.(result)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving study:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error.response?.data?.detail ||
          "Falha ao salvar estudo. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Estudo" : "Novo Estudo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informacoes do estudo clinico."
              : "Preencha as informacoes para criar um novo estudo clinico."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Protocol Number */}
          <div className="grid gap-2">
            <Label htmlFor="protocol_number">
              Numero do Protocolo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="protocol_number"
              value={formData.protocol_number}
              onChange={(e) => handleChange("protocol_number", e.target.value)}
              placeholder="Ex: IDOR-2024-001"
              disabled={isLoading}
            />
          </div>

          {/* Short Title */}
          <div className="grid gap-2">
            <Label htmlFor="short_title">
              Nome Curto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="short_title"
              value={formData.short_title}
              onChange={(e) => handleChange("short_title", e.target.value)}
              placeholder="Ex: Estudo Cardio Alpha"
              disabled={isLoading}
            />
          </div>

          {/* Full Title */}
          <div className="grid gap-2">
            <Label htmlFor="full_title">Titulo Completo</Label>
            <Textarea
              id="full_title"
              value={formData.full_title}
              onChange={(e) => handleChange("full_title", e.target.value)}
              placeholder="Titulo completo do estudo..."
              disabled={isLoading}
              rows={2}
            />
          </div>

          {/* Sponsor */}
          <div className="grid gap-2">
            <Label htmlFor="sponsor">Patrocinador</Label>
            <Input
              id="sponsor"
              value={formData.sponsor}
              onChange={(e) => handleChange("sponsor", e.target.value)}
              placeholder="Ex: Pharma Inc"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phase */}
            <div className="grid gap-2">
              <Label htmlFor="phase">Fase</Label>
              <Select
                value={formData.phase}
                onValueChange={(value) =>
                  handleChange("phase", value as StudyPhase)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map((phase) => (
                    <SelectItem key={phase.value} value={phase.value}>
                      {phase.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleChange("status", value as StudyStatus)
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
          </div>

          {/* Therapeutic Area */}
          <div className="grid gap-2">
            <Label htmlFor="therapeutic_area">Area Terapeutica</Label>
            <Select
              value={formData.therapeutic_area}
              onValueChange={(value) => handleChange("therapeutic_area", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {THERAPEUTIC_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PI Name */}
          <div className="grid gap-2">
            <Label htmlFor="pi_name">Investigador Principal</Label>
            <Input
              id="pi_name"
              value={formData.pi_name}
              onChange={(e) => handleChange("pi_name", e.target.value)}
              placeholder="Nome do investigador principal"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Enrollment Target */}
            <div className="grid gap-2">
              <Label htmlFor="enrollment_target">Meta de Recrutamento</Label>
              <Input
                id="enrollment_target"
                type="number"
                min={0}
                value={formData.enrollment_target}
                onChange={(e) =>
                  handleChange(
                    "enrollment_target",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="Ex: 100"
                disabled={isLoading}
              />
            </div>

            {/* Start Date */}
            <div className="grid gap-2">
              <Label htmlFor="start_date">Data de Inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
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
              {isEditing ? "Salvar Alteracoes" : "Criar Estudo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
