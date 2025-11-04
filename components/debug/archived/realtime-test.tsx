'use client'
import { logger } from '@/lib/utils/logger'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

/**
 * Componente de Debug para Testar Realtime
 *
 * Como usar:
 * 1. Adicione este componente em qualquer página
 * 2. Abra o console (F12)
 * 3. Faça uma mudança no admin (produtos ou taxas)
 * 4. Observe os logs e o status neste componente
 *
 * Exemplo:
 * import { RealtimeTest } from '@/components/debug/realtime-test'
 *
 * export default function Page() {
 *   return (
 *     <div>
 *       <RealtimeTest />
 *       {/* resto da página *\/}
 *     </div>
 *   )
 * }
 */
export function RealtimeTest() {
  const [produtosStatus, setProdutosStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [taxasStatus, setTaxasStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [produtosEventos, setProdutosEventos] = useState<string[]>([])
  const [taxasEventos, setTaxasEventos] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()

    // Testar canal de produtos
    const produtosChannel = supabase
      .channel('test-produtos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos',
        },
        (payload) => {
          const evento = `${payload.eventType} às ${new Date().toLocaleTimeString()}`
          logger.log('[RealtimeTest] Evento de produtos:', evento, payload)
          setProdutosEventos((prev) => [evento, ...prev].slice(0, 5))
        }
      )
      .subscribe((status) => {
        logger.log('[RealtimeTest] Status produtos:', status)
        if (status === 'SUBSCRIBED') {
          setProdutosStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setProdutosStatus('error')
        }
      })

    // Testar canal de taxas
    const taxasChannel = supabase
      .channel('test-taxas')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracoes_taxas',
        },
        (payload) => {
          const evento = `${payload.eventType} às ${new Date().toLocaleTimeString()}`
          logger.log('[RealtimeTest] Evento de taxas:', evento, payload)
          setTaxasEventos((prev) => [evento, ...prev].slice(0, 5))
        }
      )
      .subscribe((status) => {
        logger.log('[RealtimeTest] Status taxas:', status)
        if (status === 'SUBSCRIBED') {
          setTaxasStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTaxasStatus('error')
        }
      })

    return () => {
      supabase.removeChannel(produtosChannel)
      supabase.removeChannel(taxasChannel)
    }
  }, [])

  const StatusIcon = ({ status }: { status: typeof produtosStatus }) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'connecting':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
    }
  }

  const StatusBadge = ({ status }: { status: typeof produtosStatus }) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Conectado</Badge>
      case 'error':
        return <Badge className="bg-red-500">Erro</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-500">Conectando...</Badge>
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="border-zinc-800 bg-zinc-900 shadow-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white">
            🔍 Debug: Realtime Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Produtos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon status={produtosStatus} />
                <span className="text-sm font-medium text-white">Produtos</span>
              </div>
              <StatusBadge status={produtosStatus} />
            </div>

            {produtosEventos.length > 0 && (
              <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                <p className="mb-1 text-xs font-semibold text-zinc-400">Últimos eventos:</p>
                <div className="space-y-1">
                  {produtosEventos.map((evento, index) => (
                    <p key={index} className="text-xs text-zinc-500">
                      • {evento}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Taxas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon status={taxasStatus} />
                <span className="text-sm font-medium text-white">Taxas</span>
              </div>
              <StatusBadge status={taxasStatus} />
            </div>

            {taxasEventos.length > 0 && (
              <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                <p className="mb-1 text-xs font-semibold text-zinc-400">Últimos eventos:</p>
                <div className="space-y-1">
                  {taxasEventos.map((evento, index) => (
                    <p key={index} className="text-xs text-zinc-500">
                      • {evento}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instruções */}
          <div className="rounded border border-blue-500/20 bg-blue-500/5 p-2">
            <p className="text-xs text-blue-400">
              💡 <strong>Como testar:</strong><br />
              1. Edite um produto ou taxas no admin<br />
              2. Observe os eventos aparecerem aqui<br />
              3. Verifique o console (F12) para mais detalhes
            </p>
          </div>

          {/* Status de Erro */}
          {(produtosStatus === 'error' || taxasStatus === 'error') && (
            <div className="rounded border border-red-500/20 bg-red-500/5 p-2">
              <p className="text-xs text-red-400">
                ⚠️ <strong>Realtime não está habilitado!</strong><br />
                Veja <code>REALTIME_SETUP.md</code> para instruções
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
