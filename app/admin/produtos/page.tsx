export const revalidate = 30

import { ProdutosManager } from '@/components/admin/produtos/products-manager'
import { getProdutos } from './actions'

interface ProdutosPageProps {
  searchParams?: Promise<{ modal?: string; id?: string }>
}

export default async function ProdutosPage({ searchParams }: ProdutosPageProps) {
  const params = searchParams ? await searchParams : undefined
  const { produtos, error } = await getProdutos()

  const initialModalMode =
    params?.modal === 'create'
      ? 'create'
      : params?.modal === 'edit' && params.id
        ? 'edit'
        : undefined

  const initialProductId = initialModalMode === 'edit' ? params?.id ?? null : null

  return (
    <ProdutosManager
      produtos={produtos}
      errorMessage={error}
      initialModalMode={initialModalMode}
      initialProductId={initialProductId}
    />
  )
}
