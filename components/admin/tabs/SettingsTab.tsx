"use client"

import { useEffect, useState } from "react"
import { Download, Loader2, Save, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { type Assessment, getProfessorSession, saveProfessorSession, updateProfessorAccount } from "@/lib/store"
import { FinancialConfig } from "@/components/financial-config"
import { GradingConfig } from "@/components/grading-config"
import { AvatarUpload } from "@/components/avatar-upload"

interface Props {
  assessments: Assessment[]
  onRefresh: (showLoading?: boolean) => void
  onLogout: () => void
}

export function SettingsTab({ assessments, onRefresh, onLogout }: Props) {
  const active = assessments[0]
  const supabase = createClient()
  const session = typeof window !== "undefined" ? getProfessorSession() : null
  const isMaster = session?.role === "master"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  useEffect(() => {
    async function fetchUserInfo() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setName(user.user_metadata?.full_name || "")
        setEmail(user.email || "")
        
        if (session?.professorId) {
            const { data } = await supabase.from('professor_accounts').select('bio').eq('id', session.professorId).maybeSingle()
            if (data?.bio) setBio(data.bio)
        }
      }
    }
    fetchUserInfo()
  }, [session?.professorId])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return alert("O nome não pode estar vazio.")
    if (!email.trim() || !email.includes("@")) return alert("E-mail inválido.")
    if (password && password.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.")

    setIsUpdatingProfile(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        email: email.trim(),
        password: password ? password : undefined,
        data: { full_name: name.trim() }
      })

      if (authError) throw authError

        if (session?.professorId) {
            const up = await updateProfessorAccount(session.professorId, {
                name: name.trim(),
                email: email.trim(),
                bio: bio.trim(),
                ...(password ? { password } : {})
            })
            if (session && up) {
                const newAvatar = up?.avatar_url || session?.avatar_url || null
                saveProfessorSession(session.professorId, session.role, newAvatar)
            }
        }

      alert("Perfil atualizado com sucesso!")
      setPassword("") 
      onRefresh()
    } catch (err: any) {
      alert("Erro ao atualizar perfil: " + err.message)
    } finally {
      setIsUpdatingProfile(false)
    }
  }


  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-xl font-bold font-serif text-foreground">Configurações do Sistema</h2>
        <p className="text-muted-foreground text-sm">Gerencie preferências e configurações gerais da plataforma.</p>
      </div>

      {isMaster && (
        <>
          <FinancialConfig />
          <GradingConfig />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <UserCircle className="h-5 w-5" />
            <h3 className="font-bold text-foreground">Meu Perfil</h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 mb-4">
                <AvatarUpload 
                    currentUrl={session?.avatar_url}
                    userId={session?.professorId || ""}
                    userName={name}
                    type="professor"
                    onUploadSuccess={(url) => {
                        if (session) saveProfessorSession(session.professorId, session.role, url)
                        onRefresh(false)
                    }}
                />
                <p className="text-xs text-muted-foreground">Clique na câmera para alterar sua foto de perfil</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome Completo</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">E-mail</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile-bio">Mini Biografia</Label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Fale um pouco sobre você, sua formação ou experiência..."
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-transparent shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Label htmlFor="profile-password">Nova Senha (opcional)</Label>
              <Input
                id="profile-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-10"
                autoComplete="new-password"
              />
              <p className="text-[10px] text-muted-foreground">Deixe em branco para não alterar a senha atual.</p>
            </div>
            <Button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full h-10 font-bold bg-primary hover:bg-primary/90 transition-all"
            >
              {isUpdatingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Alterações do Perfil
            </Button>
          </form>
        </div>

        <div className="space-y-6">

          <div className="bg-muted/30 border border-border/50 rounded-xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Informações Técnicas</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Versão do Sistema:</span>
                <span className="font-mono font-medium text-primary">v1.2.2-cloud</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status do Banco:</span>
                <span className="text-green-600 font-medium">Conectado (Supabase)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tipo de Acesso:</span>
                <span className="font-medium">{isMaster ? "Administrador Master" : "Professor"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
