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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-white">Métricas do Site</CardTitle>
            <CardDescription className="text-zinc-400">
              Interações e ações dos usuários
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-yellow-500" />
              <p className="mt-4 text-sm text-zinc-400">Carregando métricas...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {METRICS.map((metric) => {
                const stat = stats[metric.key] || { total: 0, unique: 0 }
                
                return (
                  <div
                    key={metric.key}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      {metric.icon}
                      <div>
                        <p className="text-sm font-medium text-white">{metric.label}</p>
                        <p className="text-xs text-zinc-500">{metric.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{stat.total}</p>
                        <p className="text-xs text-zinc-500">
                          {stat.unique} {stat.unique === 1 ? 'visitante' : 'visitantes'}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMetricToReset(metric.key)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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

      <AlertDialog open={metricToReset !== null} onOpenChange={(open) => !open && setMetricToReset(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Resetar Métrica</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja resetar esta métrica? Todos os dados serão permanentemente removidos.
              Esta ação não pode ser desfeita.
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
