'use client'

import { useState, useEffect } from 'react'
import { Calculator, Trash2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getMetricsStats, resetMetric } from '@/lib/utils/metrics'
import { toast } from 'sonner'

interface MetricItem {
  key: string
  label: string
  description: string
  icon: React.ReactNode
}

const METRICS: MetricItem[] = [
  {
    key: 'calculadora_taxas_open',
    label: 'Calculadora Aberta',
    description: 'Vezes que a calculadora foi aberta',
    icon: <Calculator className="h-4 w-4 text-blue-500" />,
  },
  {
    key: 'calculadora_taxas_calculate',
    label: 'Cálculos Realizados',
    description: 'Valores calculados na calculadora',
    icon: <Calculator className="h-4 w-4 text-green-500" />,
  },
  {
    key: 'calculadora_taxas_download',
    label: 'Downloads de Simulação',
    description: 'Imagens de simulação baixadas',
    icon: <Calculator className="h-4 w-4 text-purple-500" />,
  },
  {
    key: 'calculadora_taxas_share',
    label: 'Compartilhamentos',
    description: 'Simulações compartilhadas',
    icon: <Calculator className="h-4 w-4 text-yellow-500" />,
  },
]

interface SiteMetricsCardProps {
  onRefresh?: () => void
}

export function SiteMetricsCard({ onRefresh }: SiteMetricsCardProps) {
  const [stats, setStats] = useState<Record<string, { total: number; unique: number }>>({})
  const [loading, setLoading] = useState(true)
  const [metricToReset, setMetricToReset] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const loadStats = async () => {
    setLoading(true)
    const data = await getMetricsStats('all')
    setStats(data)
    setLoading(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleResetMetric = async (metricType: string) => {
    setResetting(true)
    const result = await resetMetric(metricType)

    if (result.success) {
      toast.success('Métrica resetada com sucesso!')
      await loadStats()
      onRefresh?.()
    } else {
      toast.error(`Erro ao resetar métrica: ${result.error}`)
    }

    setResetting(false)
    setMetricToReset(null)
  }

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="flex flex-col items-start justify-between gap-3 pb-4 sm:flex-row sm:items-center sm:gap-0">
          <div>
            <CardTitle className="text-base font-semibold text-white sm:text-lg">
              Métricas do Site
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 sm:text-sm">
              Interações e ações dos usuários
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 text-xs sm:w-auto sm:text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-yellow-500" />
              <p className="mt-4 text-sm text-zinc-400">Carregando métricas...</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {METRICS.map((metric) => {
                const stat = stats[metric.key] || { total: 0, unique: 0 }

                return (
                  <div
                    key={metric.key}
                    className="flex flex-col items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                  >
                    <div className="flex w-full items-center gap-3">
                      <div className="flex-shrink-0">{metric.icon}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white sm:text-base">
                          {metric.label}
                        </p>
                        <p className="text-xs text-zinc-500 sm:text-sm">{metric.description}</p>
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-between border-t border-zinc-800 pt-3 sm:w-auto sm:gap-6 sm:border-0 sm:pt-0">
                      <div className="">
                        <p className="text-xl font-bold text-white sm:text-2xl">
                          {stat.total} <span className="text-[11px] font-normal">clicks</span>
                        </p>
                        <p className="text-[11px] text-zinc-500 sm:text-xs">
                          {stat.unique} {stat.unique === 1 ? 'visitante' : 'visitantes'}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMetricToReset(metric.key)}
                        className="flex-shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        disabled={stat.total === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={metricToReset !== null}
        onOpenChange={(open) => !open && setMetricToReset(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Resetar Métrica</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja resetar esta métrica? Todos os dados serão permanentemente
              removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => metricToReset && handleResetMetric(metricToReset)}
              disabled={resetting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {resetting ? 'Resetando...' : 'Resetar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
