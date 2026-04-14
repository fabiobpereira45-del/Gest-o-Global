"use client"

import { useState } from "react"
import { Sparkles, X, Check, Megaphone, Wrench, Info, PartyPopper } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { type SystemUpdate } from "@/lib/store"
import { cn } from "@/lib/utils"

interface Props {
  update: SystemUpdate
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: () => void
}

export function SystemUpdateModal({ update, isOpen, onClose, onMarkAsRead }: Props) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onMarkAsRead()
      onClose()
    } catch (err) {
      console.error("Erro ao marcar como lido:", err)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = () => {
    switch (update.type) {
      case 'feature': return <Sparkles className="h-6 w-6 text-orange" />
      case 'announcement': return <Megaphone className="h-6 w-6 text-blue-500" />
      case 'fix': return <Wrench className="h-6 w-6 text-green-500" />
      default: return <Info className="h-6 w-6 text-slate-400" />
    }
  }

  const getBadge = () => {
    switch (update.type) {
      case 'feature': return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange/10 text-orange">Nova Ferramenta</span>
      case 'announcement': return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500">Aviso</span>
      case 'fix': return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-500">Correção</span>
      default: return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] border-none p-0 overflow-hidden bg-white dark:bg-slate-950 shadow-2xl">
        <div className="accent-gradient h-2 w-full" />
        
        <div className="p-8">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-muted rounded-2xl">
                {getIcon()}
              </div>
              {update.version && (
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                  v{update.version}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {getBadge()}
                <span className="text-[10px] text-muted-foreground font-medium">
                  {new Date(update.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {update.title}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="mt-6 text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
            {update.content}
          </div>

          {update.image_url && (
            <div className="mt-6 rounded-xl overflow-hidden border border-border/50">
              <img src={update.image_url} alt={update.title} className="w-full h-auto object-cover" />
            </div>
          )}

          <DialogFooter className="mt-10 sm:justify-start gap-3">
            <Button 
              onClick={handleConfirm} 
              className="accent-gradient text-white font-bold px-8 h-11 rounded-xl shadow-lg shadow-orange/20 hover:scale-[1.02] transition-transform"
              disabled={loading}
            >
              <Check className="h-4 w-4 mr-2" />
              Entendido
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="h-11 px-6 rounded-xl text-muted-foreground hover:bg-muted"
            >
              Ver depois
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
