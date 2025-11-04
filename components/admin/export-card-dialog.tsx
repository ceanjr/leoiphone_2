'use client'

import { useRef, useState } from 'react'
import { toBlob, toPng } from 'html-to-image'
import { Download, Loader2, X, Grid2X2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProductCardRenderer, type ProductCardData } from './product-card-renderer'
import {
  exportProductCard,
  exportMultipleCards,
  exportProductGrid,
  generateFileName,
  generateGridFileName,
  downloadFile,
} from './export-card-utils'
import { logger } from '@/lib/utils/logger'

interface ExportCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produtos: ProductCardData[]
}

export function ExportCardDialog({ open, onOpenChange, produtos }: ExportCardDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 })

  const handleExportSingle = async (produto: ProductCardData) => {
    setIsExporting(true)
    try {
      logger.info(`\n🎯 Exportação individual: ${produto.nome}`)
      const blob = await exportProductCard(produto, `product-card-${produto.id}`)
      const fileName = generateFileName(produto)
      downloadFile(blob, fileName)
      logger.info('✅ Exportação individual concluída')
    } catch (error) {
      logger.error('❌ Erro ao exportar card:', error)
      alert(
        `Erro ao exportar card: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportAll = async () => {
    if (produtos.length === 0) return

    setIsExporting(true)
    setExportProgress({ current: 0, total: produtos.length })

    try {
      await exportMultipleCards(produtos, (current, total) => {
        setExportProgress({ current, total })
      })

      alert(`✅ ${produtos.length} cards exportados com sucesso!`)
      onOpenChange(false)
    } catch (error) {
      logger.error('❌ Erro ao exportar cards:', error)
      alert(
        `Erro ao exportar cards: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    } finally {
      setIsExporting(false)
      setExportProgress({ current: 0, total: 0 })
    }
  }

  const handleExportGrid = async () => {
    if (produtos.length < 4) {
      alert('Selecione pelo menos 4 produtos para exportar em grade.')
      return
    }

    setIsExporting(true)

    try {
      logger.info('\n🎯 Exportação em grade 2x2')

      // Pegar os 4 primeiros produtos
      const produtosParaGrade = produtos.slice(0, 4)

      const blob = await exportProductGrid(produtosParaGrade)
      const fileName = generateGridFileName()
      downloadFile(blob, fileName)

      logger.info('✅ Grade exportada com sucesso')
      alert('✅ Grade 2x2 exportada com sucesso!')
    } catch (error) {
      logger.error('❌ Erro ao exportar grade:', error)
      alert(
        `Erro ao exportar grade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Cards de Produtos</DialogTitle>
          <DialogDescription>
            {produtos.length === 0
              ? 'Nenhum produto selecionado para exportação.'
              : `${produtos.length} produto(s) selecionado(s). Escolha o formato de exportação.`}
          </DialogDescription>
        </DialogHeader>

        {produtos.length > 0 && (
          <div className="space-y-4">
            {/* Botões de exportação em grade */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Exportar Grade 2x2 */}
              <Button
                onClick={handleExportGrid}
                disabled={isExporting || produtos.length < 4}
                variant="default"
                size="lg"
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Grid2X2 className="mr-2 h-4 w-4" />
                    Grade 2x2 (4 produtos)
                  </>
                )}
              </Button>

              {/* Exportar Todos Individuais */}
              <Button
                onClick={handleExportAll}
                disabled={isExporting}
                variant="outline"
                size="lg"
                className="w-full"
              >
                {isExporting && exportProgress.total > 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando {exportProgress.current}/{exportProgress.total}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Todos Individual ({produtos.length} ZIP)
                  </>
                )}
              </Button>
            </div>

            {/* Info sobre a grade */}
            {produtos.length >= 4 && (
              <div className="rounded-lg border border-purple-800/40 bg-gradient-to-r from-purple-950/30 to-blue-950/30 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Grid2X2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                  <div>
                    <p className="font-medium text-purple-200">Grade 2x2 (Colagem)</p>
                    <p className="mt-1 text-xs text-purple-300/80">
                      Exporta os 4 primeiros produtos selecionados em uma única imagem otimizada
                      para posts. Dimensões: 1680x1960px • Ideal para redes sociais
                    </p>
                  </div>
                </div>
              </div>
            )}

            {produtos.length < 4 && (
              <div className="rounded-lg border border-amber-800/40 bg-amber-950/30 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Grid2X2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-200">Grade 2x2 desabilitada</p>
                    <p className="mt-1 text-xs text-amber-300/80">
                      Selecione pelo menos 4 produtos para usar este formato.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Aviso sobre tempo de exportação */}
            {produtos.length > 1 && (
              <div className="text-muted-foreground rounded-lg border border-blue-800 bg-blue-950/30 p-3 text-sm">
                <p className="mb-1 font-medium">ℹ️ Exportação Individual</p>
                <p className="text-xs">
                  Tempo estimado: ~{produtos.length * 2}s • As imagens são processadas
                  sequencialmente para garantir qualidade.
                </p>
              </div>
            )}

            {/* Lista de produtos com preview e botão individual */}
            <div className="border-t pt-4">
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold">
                Produtos Selecionados ({produtos.length})
              </h3>
              <div className="grid max-h-[400px] gap-3 overflow-y-auto pr-2">
                {produtos.map((produto, index) => (
                  <div
                    key={produto.id}
                    className={`flex items-center gap-4 rounded-lg border p-3 ${
                      index < 4 ? 'border-purple-800/40 bg-purple-950/20' : 'bg-zinc-900/50'
                    }`}
                  >
                    {/* Indicador de posição na grade */}
                    {index < 4 && (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                    )}

                    {/* Thumbnail pequeno */}
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-900">
                      <img
                        src={produto.foto_principal}
                        alt={produto.nome}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Info do produto */}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium">{produto.nome}</h4>
                      <p className="text-muted-foreground text-xs">{produto.codigo_produto}</p>
                      <p className="text-sm font-bold text-yellow-500">
                        R$ {produto.preco_promocional.toFixed(2)}
                      </p>
                    </div>

                    {/* Botão de exportação individual */}
                    <Button
                      onClick={() => handleExportSingle(produto)}
                      disabled={isExporting}
                      size="sm"
                      variant="ghost"
                      title="Exportar este card"
                      className="flex-shrink-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Renderizar cards escondidos para exportação */}
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '0',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          {produtos.map((produto) => (
            <ProductCardRenderer key={produto.id} produto={produto} visible={true} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente legado para compatibilidade
interface ProdutoCardExportProps {
  produto: {
    nome: string
    codigo_produto: string
    preco: number
    preco_promocional: number
    foto_principal: string
    condicao: string
    nivel_bateria?: number
    garantia?: 'nenhuma' | '3_meses' | '6_meses' | '1_ano'
    cores?: string[]
  }
}

export function ProdutoCardExport({ produto }: ProdutoCardExportProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showDevPreview, setShowDevPreview] = useState(process.env.NODE_ENV === 'development')

  // BatteryIcon SVG inline
  const BatteryIcon = ({ level }: { level: number }) => {
    const getBatteryState = () => {
      if (level >= 80) return { color: '#22c55e', bars: 4 }
      else if (level >= 70) return { color: '#facc15', bars: 3 }
      else return { color: '#ef4444', bars: 2 }
    }

    const { color, bars } = getBatteryState()

    return (
      <svg
        width="28"
        height="18"
        viewBox="0 0 20 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block"
      >
        <rect
          x="0.5"
          y="0.5"
          width="16"
          height="11"
          rx="2"
          stroke="white"
          strokeWidth="1"
          fill="none"
        />
        <rect x="17" y="3.5" width="2.5" height="5" rx="1" fill="white" />
        {[...Array(4)].map((_, index) => (
          <rect
            key={index}
            x={2.5 + index * 3.5}
            y="3"
            width="2"
            height="6"
            rx="0.5"
            fill={index < bars ? color : 'rgba(255, 255, 255, 0.15)'}
          />
        ))}
      </svg>
    )
  }

  // Função para obter texto de garantia
  const getGarantiaText = (garantia?: string) => {
    if (!garantia || garantia === 'nenhuma') return null
    const garantiaMap: Record<string, string> = {
      '3_meses': '3 meses',
      '6_meses': '6 meses',
      '1_ano': '1 ano',
    }
    return garantiaMap[garantia] || null
  }

  const exportCard = async () => {
    if (!cardRef.current) return
    setIsExporting(true)

    try {
      logger.info('\n🎯 Exportação via ProdutoCardExport')
      logger.info('📦 Produto:', produto.nome)

      // 1. Forçar reload das imagens
      const images = cardRef.current.querySelectorAll('img')
      const timestamp = Date.now()
      logger.info(`🔄 Recarregando ${images.length} imagens...`)

      await Promise.all(
        Array.from(images).map((img, index) => {
          return new Promise((resolve) => {
            const timeout = setTimeout(() => {
              logger.warn(`⚠️ Timeout na imagem ${index}`)
              resolve(null)
            }, 8000)

            const onLoad = () => {
              clearTimeout(timeout)
              logger.info(`✅ Imagem ${index}: ${img.naturalWidth}x${img.naturalHeight}`)
              resolve(null)
            }

            const onError = () => {
              clearTimeout(timeout)
              logger.warn(`❌ Erro na imagem ${index}`)
              resolve(null)
            }

            if (img.complete && img.naturalHeight !== 0) {
              clearTimeout(timeout)
              resolve(null)
              return
            }

            img.addEventListener('load', onLoad, { once: true })
            img.addEventListener('error', onError, { once: true })

            // Cache busting
            const originalSrc = img.src
            const separator = originalSrc.includes('?') ? '&' : '?'
            img.src = `${originalSrc}${separator}_cb=${timestamp}&_idx=${index}`
          })
        })
      )

      // 2. Delay para renderização
      logger.info('⏳ Aguardando renderização...')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      logger.info('🎨 Gerando blob...')

      // 3. Gerar blob
      let blob: Blob | null = null

      try {
        blob = await toBlob(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#000000',
          skipFonts: false,
        })
      } catch (error) {
        logger.error('⚠️ toBlob falhou, tentando toPng:', error)

        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#000000',
          skipFonts: false,
        })

        if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
          throw new Error('Data URL inválido')
        }

        const response = await fetch(dataUrl)
        blob = await response.blob()
      }

      if (!blob) {
        throw new Error('Blob é null')
      }

      if (blob.size < 1024) {
        throw new Error(`Blob muito pequeno: ${blob.size} bytes`)
      }

      logger.info(`✅ Blob: ${(blob.size / 1024).toFixed(2)} KB`)

      // 4. Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `produto-${produto.codigo_produto}-${timestamp}.png`
      link.href = url
      link.click()

      setTimeout(() => URL.revokeObjectURL(url), 1000)

      logger.info('✅ Exportado com sucesso!')
      alert('✅ Imagem exportada com sucesso!')
    } catch (error) {
      logger.error('❌ Erro ao exportar:', error)
      alert(`Erro ao exportar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsExporting(false)
    }
  }

  const desconto = Math.round(((produto.preco - produto.preco_promocional) / produto.preco) * 100)

  return (
    <div className="space-y-4">
      {/* Toggle Preview (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex items-center gap-2 rounded border border-yellow-500/30 bg-zinc-900 p-2">
          <input
            type="checkbox"
            id="show-dev-preview"
            checked={showDevPreview}
            onChange={(e) => setShowDevPreview(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="show-dev-preview" className="cursor-pointer text-sm">
            🔧 <strong>DEV:</strong> Mostrar preview do card (1080x1350px)
          </label>
        </div>
      )}

      {/* Card que será exportado */}
      <div
        ref={cardRef}
        className={`relative bg-black ${showDevPreview ? 'border-2 border-yellow-500' : ''}`}
        style={{
          width: '1080px',
          height: '1350px',
          ...(showDevPreview
            ? {}
            : {
                position: 'fixed',
                left: '-9999px',
                top: '-9999px',
                zIndex: -1,
              }),
        }}
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-black via-zinc-950 to-black p-12">
          {/* Logo/Marca */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-yellow-500">LEOIPHONE</h1>
          </div>

          {/* Badge de Desconto */}
          {desconto > 0 && (
            <div className="absolute top-12 right-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 px-6 py-3 shadow-2xl">
              <span className="text-4xl font-black text-white">-{desconto}%</span>
            </div>
          )}

          {/* Imagem do Produto - IMPORTANTE: usar img nativo, não Next Image */}
          <div className="relative mx-auto mb-8 h-[700px] w-[700px] overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl">
            <img
              src={produto.foto_principal}
              alt={produto.nome}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              crossOrigin="anonymous"
            />
          </div>

          {/* Informações */}
          <div className="flex-1 space-y-6 rounded-2xl border-2 border-zinc-800 bg-zinc-950/80 p-8 backdrop-blur">
            <h2 className="text-4xl font-bold text-white">{produto.nome}</h2>

            <p className="font-mono text-xl text-zinc-400">{produto.codigo_produto}</p>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {produto.condicao === 'novo' && !produto.nivel_bateria && (
                <div className="rounded-full bg-green-600 px-4 py-2 text-lg font-bold text-white">
                  Novo
                </div>
              )}
              {produto.condicao === 'seminovo' && !produto.nivel_bateria && (
                <div className="rounded-full bg-amber-600 px-4 py-2 text-lg font-bold text-white">
                  Seminovo
                </div>
              )}
              {produto.nivel_bateria && (
                <div className="flex items-center gap-2 rounded-full bg-zinc-700 px-4 py-2 text-lg font-bold text-white">
                  <BatteryIcon level={produto.nivel_bateria} />
                  <span>{produto.nivel_bateria}%</span>
                </div>
              )}
              {getGarantiaText(produto.garantia) && (
                <div className="rounded-full bg-purple-600 px-4 py-2 text-lg font-bold text-white">
                  Garantia {getGarantiaText(produto.garantia)}
                </div>
              )}
            </div>

            {/* Cores */}
            {produto.cores && produto.cores.length > 0 && (
              <div className="flex gap-2">
                {produto.cores.map((cor) => (
                  <div
                    key={cor}
                    className="h-12 w-12 rounded-full border-2 border-zinc-700"
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
            )}

            {/* Preços */}
            <div className="border-t-2 border-zinc-800 pt-6">
              {produto.preco_promocional < produto.preco && (
                <p className="text-2xl text-zinc-500 line-through">R$ {produto.preco.toFixed(2)}</p>
              )}
              <p className="text-7xl font-black text-yellow-500">
                R$ {produto.preco_promocional.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Watermark */}
          <div className="mt-6 text-center">
            <p className="text-xl text-zinc-600">leoiphone.com.br</p>
          </div>
        </div>
      </div>

      {/* Botão de Export */}
      <Button onClick={exportCard} disabled={isExporting} className="w-full">
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Exportar como Imagem
          </>
        )}
      </Button>

      {/* Info do preview */}
      {showDevPreview && (
        <div className="text-muted-foreground rounded border border-zinc-800 bg-zinc-900 p-3 text-xs">
          <p className="mb-1 font-semibold">💡 Preview de Desenvolvimento:</p>
          <p>• Dimensões: 1080x1350px (tamanho de exportação)</p>
          <p>• Este card será capturado e exportado como PNG</p>
          <p>• Usando &lt;img&gt; nativo para melhor compatibilidade</p>
        </div>
      )}
    </div>
  )
}
