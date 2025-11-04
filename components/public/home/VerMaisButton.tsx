import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface VerMaisButtonProps {
  onClick: () => void
  loading?: boolean
  temMaisProdutos: boolean
}

export const VerMaisButton = memo(function VerMaisButton({ onClick, loading = false, temMaisProdutos }: VerMaisButtonProps) {
  if (!temMaisProdutos) return null

  return (
    <div className="mt-8 flex justify-center">
      <Button
        onClick={onClick}
        disabled={loading}
        size="lg"
        className="min-w-[200px]"
        style={{
          backgroundColor: 'var(--brand-yellow)',
          color: 'var(--brand-black)',
        }}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : (
          'Ver Mais Produtos'
        )}
      </Button>
    </div>
  )
})
