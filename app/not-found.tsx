"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Redireciona para a raiz se a rota não existir
    // Isso garante que a SPA (app/page.tsx) assuma o controle
    router.replace("/")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium">Redirecionando...</p>
      </div>
    </div>
  )
}
