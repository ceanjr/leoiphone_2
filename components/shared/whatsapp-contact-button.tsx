'use client'

import { useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet'
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
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WhatsAppContactButton({
  message,
  triggerIcon = false,
  className,
  label,
  produtoId,
  produtoNome,
  open: controlledOpen,
  onOpenChange,
  ...buttonProps
}: WhatsAppContactButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Usar estado controlado se fornecido, senão usar estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen

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
          await (supabase as any).from('conversions').insert({
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

    const url = baseMessage
      ? `https://wa.me/${number}?text=${baseMessage}`
      : `https://wa.me/${number}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <>
      {!className?.includes('hidden') && (
        <Button
          type="button"
          className={cn('gap-2', className)}
          onClick={() => setOpen(true)}
          {...buttonProps}
        >
          {triggerIcon ? <MessageCircle className="h-4 w-4" /> : null}
          {label ?? 'WhatsApp'}
        </Button>
      )}

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent className="max-w-md border-zinc-800 bg-zinc-950/95 text-white shadow-[0_24px_80px_-35px_rgba(0,0,0,0.85)]">
          <div className="flex flex-col overflow-hidden">
            {/* Header com badge */}
            <div className="animate-in fade-in slide-in-from-top-2 relative border-b border-zinc-800 bg-zinc-950 px-5 py-5 duration-300 sm:px-6 sm:py-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.12),transparent_55%)] opacity-60 blur-2xl" />
              <div className="relative flex flex-col items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <BottomSheetTitle className="text-lg font-semibold text-white sm:text-xl">
                    Escolha um contato
                  </BottomSheetTitle>
                  <BottomSheetDescription className="mt-1.5 text-sm text-zinc-400">
                    Atendimento das 09h às 19h.
                  </BottomSheetDescription>
                </div>
                <Badge className="animate-in zoom-in-95 shrink-0 border-yellow-500/30 bg-yellow-500/15 text-xs text-yellow-200 delay-100 duration-300">
                  WhatsApp
                </Badge>
              </div>
            </div>

            {/* Conteúdo com scroll */}
            <div className="overflow-y-auto px-5 py-5 text-sm text-zinc-300 sm:px-6 sm:py-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  {CONTACTS.map((contact, index) => (
                    <button
                      key={contact.number}
                      type="button"
                      onClick={() => handleContact(contact.number)}
                      className="animate-in fade-in slide-in-from-bottom-2 flex min-h-[60px] w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-left transition-all duration-200 hover:scale-[1.02] hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:shadow-lg hover:shadow-yellow-500/10 active:scale-[0.98]"
                      style={{ animationDelay: `${150 + index * 100}ms` }}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <span className="mb-1 block text-sm font-semibold text-white">
                          {contact.label}
                        </span>
                        <span className="text-xs text-zinc-400">Clique para abrir o WhatsApp</span>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-yellow-200">
                        {contact.number}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="animate-in fade-in px-2 text-[12px] leading-relaxed text-zinc-400 delay-300 duration-500">
                  *Se um contato estiver indisponível no momento, chame o outro número para garantir
                  o retorno.
                </p>
              </div>
            </div>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}
