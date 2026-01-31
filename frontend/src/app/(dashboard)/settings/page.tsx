"use client"

import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth-store"
import { getInitials, formatDate } from "@/lib/utils"
import { LogOut, User, Shield, Building, Mail, Calendar } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  coordinator: "Coordenador",
  monitor: "Monitor",
  investigator: "Investigador",
  regulatory: "Regulatorio",
  viewer: "Visualizador",
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Configuracoes" />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Usuario</CardTitle>
              <CardDescription>
                Informacoes da sua conta no sistema CTMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{user?.name || "Usuario"}</h3>
                  <Badge variant="outline" className="mt-1">
                    {user?.role ? ROLE_LABELS[user.role] || user.role : "N/A"}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* User Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Funcao</p>
                    <p className="font-medium">
                      {user?.role ? ROLE_LABELS[user.role] || user.role : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departamento</p>
                    <p className="font-medium">{user?.department || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Membro desde</p>
                    <p className="font-medium">
                      {user?.created_at ? formatDate(user.created_at) : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={user?.is_active ? "default" : "destructive"}
                      className="mt-1"
                    >
                      {user?.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sessao</CardTitle>
              <CardDescription>Gerencie sua sessao no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Encerrar sessao</p>
                  <p className="text-sm text-muted-foreground">
                    Voce sera desconectado e redirecionado para a pagina de login
                  </p>
                </div>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informacoes do Sistema</CardTitle>
              <CardDescription>Versao e informacoes tecnicas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versao</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ambiente</span>
                  <Badge variant="outline">Desenvolvimento</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API</span>
                  <span className="font-medium text-sm">
                    {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ajuda e Suporte</CardTitle>
              <CardDescription>
                Precisa de ajuda com o sistema?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Para duvidas ou problemas tecnicos, entre em contato com a equipe de TI
                ou acesse a documentacao do sistema.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" disabled>
                  Documentacao
                </Button>
                <Button variant="outline" disabled>
                  Contato Suporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
