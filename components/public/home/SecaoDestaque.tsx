import { ProdutoCard } from '@/components/public/produto-card'
import type { Produto } from '@/types/produto'

interface Secao {
  id: string
  tipo: 'destaques' | 'promocoes' | 'lancamentos'
  titulo: string
  subtitulo: string | null
  produtos: Produto[]
}

interface SecaoDestaqueProps {
  secao: Secao
  returnParams: string
}

export function SecaoDestaque({ secao, returnParams }: SecaoDestaqueProps) {
  if (secao.produtos.length === 0) return null

  return (
    <section className="mb-12 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">{secao.titulo}</h2>
        {secao.subtitulo && <p className="text-lg text-zinc-400">{secao.subtitulo}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {secao.produtos.map((produto, index) => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            view="grid"
            priority={index < 4}
            returnParams={returnParams}
          />
        ))}
      </div>
    </section>
  )
}
