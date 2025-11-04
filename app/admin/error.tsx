'use client'
import { logger } from '@/lib/utils/logger'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Admin area error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-red-500/20 bg-zinc-950">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Erro na Área Admin</CardTitle>
          <CardDescription className="text-zinc-400">
            Ocorreu um erro ao processar esta operação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-xs text-red-400">{error.message}</p>
              {error.digest && (
                <p className="mt-1 text-xs text-zinc-500">Digest: {error.digest}</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={reset}
              className="flex-1"
              style={{
                backgroundColor: 'var(--brand-yellow)',
                color: 'var(--brand-black)',
              }}
            >
              Tentar Novamente
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/dashboard'}
              variant="outline"
              className="flex-1"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
