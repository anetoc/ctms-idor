"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth-store"
import { api } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { FlaskConical, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await api.auth.login(email, password)
      const { access_token, user } = response.data

      login(user, access_token)

      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${user.name}!`,
      })

      router.push("/")
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Email ou senha incorretos. Tente novamente."

      toast({
        variant: "destructive",
        title: "Falha no login",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl">CTMS IDOR</span>
            </div>
          </div>
          <CardTitle>Bem-vindo de volta</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@idor.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Problemas para acessar?{" "}
              <a href="mailto:suporte@idor.org" className="text-primary hover:underline">
                Contate o suporte
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
