'use client'

import { useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

const CONTACTS = [
  { label: 'Léo iPhone (Léo)', number: '77988343473' },
  { label: 'Léo iPhone (Júnior)', number: '77981341126' },
] as const

// Função para pegar visitor_id
function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('visitor_id') || ''
}

// Verificar se está em produção
function isProduction(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname.includes('leoiphone.com.br') || hostname.includes('vercel.app')
}

interface WhatsAppContactButtonProps extends ButtonProps {
  message?: string
  triggerIcon?: boolean
  label?: string
  produtoId?: string
  produtoNome?: string
}

export function WhatsAppContactButton({
  message,
  triggerIcon = false,
  className,
  label,
  produtoId,
  produtoNome,
  ...buttonProps
}: WhatsAppContactButtonProps) {
  const [open, setOpen] = useState(false)

  const baseMessage = useMemo(() => {
    if (!message) return ''
    return encodeURIComponent(message)
  }, [message])

  async function handleContact(number: string) {
    // Rastrear conversão apenas em produção
    if (isProduction()) {
      const visitorId = getVisitorId()
      if (visitorId) {
        const supabase = createClient()
        try {
          await supabase.from('conversions').insert({
            visitor_id: visitorId,
            produto_id: produtoId || null,
            produto_nome: produtoNome || null,
          })
          console.log('[Conversion] Rastreada:', { produtoId, produtoNome })
        } catch (error) {
          console.error('[Conversion] Erro ao rastrear:', error)
        }
      }
    }

    const url = baseMessage ? `https://wa.me/${number}?text=${baseMessage}` : `https://wa.me/${number}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        className={cn('gap-2', className)}
        onClick={() => setOpen(true)}
        {...buttonProps}
      >
        {triggerIcon ? <MessageCircle className="h-4 w-4" /> : null}
        {label ?? 'WhatsApp'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950/95 p-0 text-white shadow-[0_24px_80px_-35px_rgba(0,0,0,0.85)]">
          <div className="flex flex-col overflow-hidden rounded-2xl">
            <div className="relative border-b border-zinc-800 bg-zinc-950 px-6 py-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.12),transparent_55%)] blur-2xl opacity-60" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Escolha um contato
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-zinc-400">
                    Atendimento das 09h às 19h.
                  </DialogDescription>
                </div>
                <Badge className="border-yellow-500/30 bg-yellow-500/15 text-yellow-200">
                  WhatsApp
                </Badge>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6 text-sm text-zinc-300">
              <p>
                Se a resposta demorar mais de <span className="font-semibold">1 hora</span>, chame o outro número para garantir o retorno.
              </p>

              <div className="space-y-3">
                {CONTACTS.map((contact) => (
                  <button
                    key={contact.number}
                    type="button"
                    onClick={() => handleContact(contact.number)}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-left transition hover:border-yellow-500/40 hover:bg-yellow-500/10"
                  >
                    <div>
                      <span className="block text-sm font-semibold text-white">{contact.label}</span>
                      <span className="text-xs text-zinc-400">Clique para abrir o WhatsApp</span>
                    </div>
                    <span className="text-sm font-medium text-yellow-200">{contact.number}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
