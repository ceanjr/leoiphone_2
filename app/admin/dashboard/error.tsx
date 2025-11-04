'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-lg border-red-900 bg-zinc-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-white">Erro no Dashboard</CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Ocorreu um erro ao carregar o dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-red-400">
              {error.message || 'Erro desconhecido'}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-zinc-500">ID: {error.digest}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={() => reset()} variant="outline" className="flex-1">
              Tentar Novamente
            </Button>
            <Button
              onClick={() => (window.location.href = '/admin/produtos')}
              variant="outline"
              className="flex-1"
            >
              Ir para Produtos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
