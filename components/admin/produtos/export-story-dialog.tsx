'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, Smartphone, Flame, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import type { ProdutoComCategoria } from '@/types/produto'
import html2canvas from 'html2canvas'

interface ExportStoryDialogProps {
  open: boolean
  onClose: () => void
  produto: ProdutoComCategoria | null
}

interface BannerPromo {
  bannerId: string
  bannerTitulo: string
  precoPromocional: number
}

export function ExportStoryDialog({ open, onClose, produto }: ExportStoryDialogProps) {
  const [exporting, setExporting] = useState(false)
  const [bannerPromo, setBannerPromo] = useState<BannerPromo | null>(null)
  const storyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!produto || !open) return

    // Verificar se o produto está em banner ativo
    const checkBannerPromo = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { data: banners } = (await supabase
          .from('banners')
          .select('id, titulo, produtos_destaque')
          .eq('ativo', true)
          .eq('tipo', 'produtos_destaque')) as any

        if (banners && banners.length > 0) {
          for (const banner of banners) {
            const produtosDestaque = banner.produtos_destaque as Array<{
              produto_id: string
              preco_promocional: number
            }>

            const produtoNoBanner = produtosDestaque?.find(
              (p) => p.produto_id === produto.id
            )

            if (produtoNoBanner) {
              setBannerPromo({
                bannerId: banner.id,
                bannerTitulo: banner.titulo,
                precoPromocional: produtoNoBanner.preco_promocional,
              })
              return
            }
          }
        }
        setBannerPromo(null)
      } catch (error) {
        console.error('Erro ao verificar banner:', error)
        setBannerPromo(null)
      }
    }

    checkBannerPromo()
  }, [produto, open])

  if (!produto) return null

  const hasPromo = bannerPromo !== null
  const precoFinal = hasPromo ? bannerPromo.precoPromocional : produto.preco
  const desconto = hasPromo
    ? Math.round(((produto.preco - bannerPromo.precoPromocional) / produto.preco) * 100)
    : 0

  // Mapear garantia para texto amigável
  const garantiaTexto = {
    nenhuma: null,
    '3_meses': '3 meses',
    '6_meses': '6 meses',
    '1_ano': '1 ano',
  }[produto.garantia]

  // Mapear condição
  const condicaoInfo = {
    novo: { label: 'Novo', color: 'bg-green-500' },
    seminovo: { label: 'Seminovo', color: 'bg-amber-500' },
  }[produto.condicao]

  const handleExport = async () => {
    if (!storyRef.current) return

    setExporting(true)

    try {
      // Aguardar um pouco para garantir que tudo foi renderizado
      await new Promise((resolve) => setTimeout(resolve, 300))

      const canvas = await html2canvas(storyRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#000000',
        width: 1080,
        height: 1920,
        windowWidth: 1080,
        windowHeight: 1920,
      })

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Falha ao criar imagem')
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const slug = produto.slug || produto.nome.toLowerCase().replace(/\s+/g, '-')
        link.download = `${slug}-story.png`
        link.href = url
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        import('sonner').then(({ toast }) => {
          toast.success('Story exportado com sucesso!')
        })
      }, 'image/png')
    } catch (error) {
      console.error('Erro ao exportar story:', error)
      import('sonner').then(({ toast }) => {
        toast.error('Erro ao exportar story. Tente novamente.')
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col p-0 sm:max-w-2xl sm:max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Smartphone className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <div className="text-white">Exportar para Stories</div>
              <div className="text-sm font-normal text-zinc-400 mt-0.5">
                {produto.nome}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          <div className="space-y-4">
            {/* Preview do Story */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Container do Story - 1080x1920 scale 0.3 para preview */}
                <div
                  className="relative overflow-hidden rounded-2xl shadow-2xl"
                  style={{
                    width: '324px', // 1080 * 0.3
                    height: '576px', // 1920 * 0.3
                  }}
                >
                  <div
                    ref={storyRef}
                    className="relative"
                    style={{
                      width: '1080px',
                      height: '1920px',
                      transform: 'scale(0.3)',
                      transformOrigin: 'top left',
                    }}
                  >
                    {/* Background minimalista */}
                    <div className="absolute inset-0 bg-black" />

                    {/* Conteúdo Principal */}
                    <div className="relative z-10 flex flex-col h-full px-20 py-16">

                      {/* Logo no topo */}
                      <div className="text-center mb-8">
                        <div className="text-5xl font-black text-[#ffcc00] tracking-tight">
                          LÉO iPHONE
                        </div>
                      </div>

                      {/* Badge de promoção sutil (se houver) */}
                      {hasPromo && (
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center gap-3 bg-orange-500/10 border-2 border-orange-500 rounded-full px-8 py-4">
                            <Sparkles className="h-8 w-8 text-orange-500" />
                            <span className="text-3xl font-black text-orange-500">
                              PROMOÇÃO -{desconto}%
                            </span>
                            <Sparkles className="h-8 w-8 text-orange-500" />
                          </div>
                        </div>
                      )}

                      {/* Imagem do Produto - DESTAQUE PRINCIPAL */}
                      <div className="flex-1 flex items-center justify-center mb-8">
                        <div className="relative w-full max-w-[900px] aspect-square">
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black rounded-2xl" />
                          {produto.foto_principal && (
                            <Image
                              src={produto.foto_principal}
                              alt={produto.nome}
                              fill
                              className="object-contain p-8"
                              unoptimized
                            />
                          )}
                        </div>
                      </div>

                      {/* Nome do Produto */}
                      <div className="text-center mb-6">
                        <h1 className="text-6xl font-bold text-white leading-tight">
                          {produto.nome}
                        </h1>
                      </div>

                      {/* Badges minimalistas */}
                      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                        {/* Condição */}
                        <div className={`${condicaoInfo.color} text-white px-6 py-2 rounded-full text-2xl font-semibold`}>
                          {condicaoInfo.label}
                        </div>

                        {/* Bateria */}
                        {produto.nivel_bateria !== null && produto.nivel_bateria >= 80 && (
                          <div className="bg-green-500 text-white px-6 py-2 rounded-full text-2xl font-semibold">
                            🔋 {produto.nivel_bateria}%
                          </div>
                        )}

                        {/* Garantia */}
                        {garantiaTexto && (
                          <div className="bg-zinc-800 text-white px-6 py-2 rounded-full text-2xl font-semibold">
                            ✓ Garantia {garantiaTexto}
                          </div>
                        )}

                        {/* Cores disponíveis */}
                        {produto.cores && produto.cores.length > 1 && (
                          <div className="bg-zinc-800 text-white px-6 py-2 rounded-full text-2xl font-semibold">
                            {produto.cores.length} cores
                          </div>
                        )}
                      </div>

                      {/* Preço - Destaque */}
                      <div className="text-center mb-10">
                        {hasPromo ? (
                          <div className="space-y-3">
                            {/* Preço original */}
                            <div className="text-4xl font-semibold text-zinc-600 line-through">
                              R$ {produto.preco.toFixed(2)}
                            </div>
                            {/* Preço promocional */}
                            <div className="text-8xl font-black text-[#ffcc00]">
                              R$ {precoFinal.toFixed(2)}
                            </div>
                            {/* Economia */}
                            <div className="text-2xl font-semibold text-green-400">
                              Economize R$ {(produto.preco - precoFinal).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-8xl font-black text-[#ffcc00]">
                            R$ {precoFinal.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Call to Action minimalista */}
                      <div className="text-center">
                        <div className="inline-flex items-center gap-3 text-zinc-400 text-2xl">
                          <div className="h-px w-16 bg-zinc-700" />
                          <span>Deslize para cima</span>
                          <div className="h-px w-16 bg-zinc-700" />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Label de preview */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                  PREVIEW
                </div>
              </div>
            </div>

            {/* Informações */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-2xl">ℹ️</div>
                <div className="text-sm space-y-2">
                  <p className="text-white font-medium">Sobre o export:</p>
                  <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Resolução: 1080x1920 (Stories do Instagram)</li>
                    <li>Formato: PNG com alta qualidade</li>
                    {hasPromo && (
                      <li className="text-orange-400 font-medium">
                        ✨ Produto em promoção detectado!
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Botão de Export */}
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold text-base py-6"
            >
              <Download className="mr-2 h-5 w-5" />
              {exporting ? 'Exportando...' : 'Exportar Story'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
