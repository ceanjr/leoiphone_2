import { notFound } from 'next/navigation'
import { Header } from '@/components/admin/header'
import { BannerForm } from '@/components/admin/banners/banner-form'
import { getBannerById, updateBanner } from '../../actions'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Editar Banner - Admin Léo iPhone',
  description: 'Editar banner do carrossel',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarBannerPage({ params }: PageProps) {
  const { id } = await params
  const { banner } = await getBannerById(id)

  if (!banner) {
    notFound()
  }

  // Se for produtos_destaque, carregar dados completos dos produtos
  let selectedProdutos: any[] = []
  if (
    (banner as any).tipo === 'produtos_destaque' &&
    (banner as any).produtos_destaque?.length > 0
  ) {
    const supabase = await createClient()
    const produtoIds = (banner as any).produtos_destaque.map((p: any) => p.produto_id)
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, nome, codigo_produto, preco, foto_principal')
      .in('id', produtoIds)

    if (produtos) {
      selectedProdutos = produtos.map((p: any) => {
        const produtoDestaque = (banner as any).produtos_destaque.find(
          (pd: any) => pd.produto_id === p.id
        )
        return {
          ...p,
          preco_promocional: produtoDestaque?.preco_promocional || p.preco,
        }
      })
    }
  }

  const initialData = {
    titulo: (banner as any).titulo,
    subtitulo: (banner as any).subtitulo || '',
    imagem_url: (banner as any).imagem_url || '',
    ativo: (banner as any).ativo,
    tipo: (banner as any).tipo || 'banner',
    produtos_destaque: (banner as any).produtos_destaque || [],
    countdown_ends_at: (banner as any).countdown_ends_at || null,
    _selectedProdutos: selectedProdutos, // Passar produtos carregados
  }

  async function handleUpdate(data: any) {
    'use server'
    return updateBanner(id, data)
  }

  return (
    <div className="min-h-screen bg-black">
      <Header title="Editar Banner" description="Atualize as informações do banner" />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <BannerForm initialData={initialData} onSubmit={handleUpdate} submitLabel="Atualizar" />
        </div>
      </div>
    </div>
  )
}
