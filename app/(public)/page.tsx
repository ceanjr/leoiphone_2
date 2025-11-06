'use client'

import { Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { ProdutoCard } from '@/components/public/produto-card'
import { BannerCarousel } from '@/components/public/banner-carousel'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { usePollingProdutos } from '@/hooks/use-polling-produtos'
import { useAuth } from '@/hooks/use-auth'
import { useHomeFilters } from '@/hooks/use-home-filters'
import { useHomeData } from '@/hooks/use-home-data'
import { useProdutosAgrupados } from '@/hooks/use-produtos-agrupados'
import { getSecaoConfig } from '@/lib/config/secao-config'
import { ordenarProdutosPorModelo } from '@/lib/utils/produtos/helpers'
import { ProductsByCategorySkeleton } from '@/components/shared/loading-skeleton'
import {
  BuscaForm,
  ViewToggle,
  VerMaisButton,
  CategoriaFilterBar,
  ProdutosPorCategoria,
} from '@/components/public/home'
import type { ProdutoComCategoria } from '@/types/produto'

export default function HomePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <HomePageContent />
    </Suspense>
  )
}

function HomePageContent() {
  // Autenticação
  const { isAuthenticated } = useAuth()

  // Filtros e URL params
  const {
    busca,
    setBusca,
    categoriaFiltro,
    viewMode,
    handleCategoriaChange,
    handleViewModeChange,
    limparFiltros,
    updateURL,
  } = useHomeFilters()

  // Dados da página
  const {
    produtos,
    setProdutos,
    categorias,
    secoes,
    produtosEmDestaqueIds,
    custosPorProduto,
    loading,
  } = useHomeData(isAuthenticated)

  // Agrupamento e paginação
  const { produtosAgrupados, carregarMais, loadingMore, temMaisProdutos } = useProdutosAgrupados(
    produtos,
    produtosEmDestaqueIds,
    categoriaFiltro,
    busca
  )

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectTriggerRef = useRef<HTMLButtonElement>(null)

  // Dropdown positioning
  const [dropdownSide, setDropdownSide] = useState<'top' | 'bottom'>('bottom')

  const checkDropdownSpace = useCallback(() => {
    if (!selectTriggerRef.current) return

    const triggerRect = selectTriggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - triggerRect.bottom
    const viewportHeight = window.innerHeight
    const spacePercentage = (spaceBelow / viewportHeight) * 100

    setDropdownSide(spacePercentage < 40 ? 'top' : 'bottom')
  }, [])

  // Polling de produtos atualiza em tempo real
  // Atualiza apenas os produtos sem filtrar - a filtragem acontece no useProdutosAgrupados
  const handleProdutosUpdate = useCallback(
    (produtosAtualizados: ProdutoComCategoria[]) => {
      // Ordenar produtos (não filtrar aqui para evitar race conditions)
      const produtosOrdenados = ordenarProdutosPorModelo(produtosAtualizados)
      setProdutos(produtosOrdenados)
    },
    [setProdutos]
  )

  usePollingProdutos({
    enabled: true,
    onUpdate: handleProdutosUpdate,
  })

  // Return params para navegação
  const returnParams = useMemo(() => {
    const params = new URLSearchParams()
    if (busca.trim()) params.set('busca', busca.trim())
    if (categoriaFiltro !== 'todas') params.set('categoria', categoriaFiltro)
    if (viewMode !== 'list') params.set('view', viewMode)
    return params.toString()
  }, [busca, categoriaFiltro, viewMode])

  return (
    <>
      <div className="container mx-auto px-4 pt-8 pb-2" suppressHydrationWarning>
        {/* Catálogo */}
        <div className="mb-8 text-center" suppressHydrationWarning>
          <h1 className="mb-2 text-center text-4xl font-bold text-(--brand-yellow)">
            Catálogo Completo
          </h1>
          <p className="text-center text-zinc-400">Explore todos os nossos produtos disponíveis</p>
        </div>

        {/* Carrossel de Banners */}
        <BannerCarousel />

        {/* Card informativo sobre preços de seminovos */}
        <div className="mb-4 rounded-lg border border-[var(--brand-yellow)]/30 bg-[var(--brand-yellow)]/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-center text-sm text-zinc-200 md:text-base">
            Os preços dos aparelhos seminovos podem variar de acordo com o estado de conservação e
            saúde da bateria.
          </p>
        </div>

        {/* Barra de Busca */}
        <div className="mb-4">
          <BuscaForm
            busca={busca}
            onBuscaChange={setBusca}
            onBuscaSubmit={(event) => {
              event.preventDefault()
              updateURL(busca)
            }}
            onLimpar={() => setBusca('')}
            inputRef={searchInputRef}
          />
        </div>

        {/* Label do Filtro - Desktop only */}
      </div>
      <div className="container mx-auto hidden px-4 md:block">
        <Label className="mb-2 block text-sm font-bold text-zinc-300">Filtrar por Categoria</Label>
      </div>

      {/* Filtro de Categoria Sticky */}
      <div className="sticky top-14 z-10 mb-8 border-b border-zinc-800 bg-black py-3 sm:top-16 md:static md:mb-0 md:border-b-0 md:py-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CategoriaFilterBar
              categoriaFiltro={categoriaFiltro}
              categorias={categorias}
              onCategoriaChange={handleCategoriaChange}
              dropdownSide={dropdownSide}
              triggerRef={selectTriggerRef}
              onOpenChange={(open) => {
                if (open) checkDropdownSpace()
              }}
            />

            {/* Limpar Filtros */}
            {(busca.trim() || categoriaFiltro !== 'todas') && (
              <Button
                variant="outline"
                onClick={limparFiltros}
                size="sm"
                className="min-h-[44px] bg-black sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Seções de Destaque (Promoções, Lançamentos, etc) */}
        {secoes.map((secao) => {
          const config = getSecaoConfig(secao.tipo)

          return (
            <section
              key={secao.id}
              className="mb-12 rounded-lg border-2 p-6"
              style={{
                borderColor: config.borderColor,
                background: config.bgGradient,
              }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{config.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--brand-yellow)]">
                      {secao.titulo}
                    </h2>
                    {secao.subtitulo && <p className="text-sm text-zinc-400">{secao.subtitulo}</p>}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${config.badgeColor}`}
                >
                  {config.badge}
                </span>
              </div>
              <div
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-3'
                    : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
                }
              >
                {secao.produtos.map((produto, index) => (
                  <ProdutoCard
                    key={produto.id}
                    produto={produto}
                    view={viewMode}
                    priority={index < 3}
                    returnParams={returnParams}
                    custos={custosPorProduto[produto.id] || []}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {/* Resultados e Toggle de Visualização */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            {loading
              ? 'Carregando...'
              : `${produtos.length} produto(s) encontrado(s) • Exibindo ${produtosAgrupados.reduce((acc, g) => acc + g.produtos.length, 0)} produtos`}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-zinc-500 sm:inline">Visualização:</span>
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>
        </div>

        {/* Grid de Produtos Agrupados por Categoria */}
        {loading ? (
          <ProductsByCategorySkeleton />
        ) : produtos.length > 0 ? (
          <>
            <ProdutosPorCategoria
              produtosAgrupados={produtosAgrupados}
              viewMode={viewMode}
              returnParams={returnParams}
              custosPorProduto={custosPorProduto}
              isAuthenticated={isAuthenticated}
            />

            <VerMaisButton
              onClick={carregarMais}
              loading={loadingMore}
              temMaisProdutos={temMaisProdutos}
            />
          </>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
            <p className="text-zinc-400">Nenhum produto encontrado com esses filtros.</p>
            <Button onClick={limparFiltros} variant="outline" className="mt-4">
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
