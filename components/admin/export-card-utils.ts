import { toBlob, toPng } from 'html-to-image'
import { logger } from '@/lib/utils/logger'
import { shareOrDownloadImage, isMobileDevice as detectMobile } from '@/lib/utils/share'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { ProductCardData } from './product-card-renderer'

/**
 * Re-exportar função de detecção de mobile
 */
export { detectMobile as isMobileDevice }

/**
 * Converte URL para usar proxy e adicionar otimizações
 * Usa o proxy /api/proxy-image para evitar problemas de CORS
 */
function optimizeImageUrl(url: string): string {
  if (!url) return ''
  
  // Sempre usar proxy para imagens externas (Firebase ou Supabase)
  // Isso garante que não haverá problemas de CORS
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  }
  
  // Para URLs relativas, retornar como está
  return url
}

/**
 * Força o reload de todas as imagens em um elemento
 * Converte para data URLs (base64) para evitar problemas de CORS com html-to-image
 */
async function forceReloadImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img')

  logger.info(`🔄 Convertendo ${images.length} imagens para base64...`)

  // Criar array de promises para aguardar todas as imagens
  const loadPromises = Array.from(images).map((img, index) => {
    return new Promise<void>(async (resolve) => {
      try {
        const currentSrc = img.src
        
        if (!currentSrc || currentSrc.startsWith('data:')) {
          logger.info(`⭐️ Imagem ${index} já é data URL ou vazia`)
          resolve()
          return
        }

        logger.info(`📸 Imagem ${index}: Convertendo para base64...`)

        // Timeout de segurança
        const timeout = setTimeout(() => {
          logger.warn(`⚠️ Timeout na imagem ${index}`)
          resolve()
        }, 15000)

        try {
          // Fazer fetch da imagem usando o src atual (que já deve estar com proxy)
          const response = await fetch(currentSrc, {
            method: 'GET',
            cache: 'no-cache',
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const blob = await response.blob()
          
          // Converter blob para data URL (base64)
          const reader = new FileReader()
          
          await new Promise<void>((resolveLoad) => {
            reader.onloadend = () => {
              clearTimeout(timeout)
              const dataUrl = reader.result as string
              
              // Definir o src como data URL
              img.onload = () => {
                logger.info(
                  `✅ Imagem ${index} carregada: ${img.naturalWidth}x${img.naturalHeight}`
                )
                resolveLoad()
              }
              img.onerror = () => {
                logger.warn(`⚠️ Erro ao carregar imagem ${index} após conversão`)
                resolveLoad()
              }
              img.src = dataUrl
            }
            
            reader.onerror = () => {
              clearTimeout(timeout)
              logger.warn(`⚠️ Erro ao converter imagem ${index} para data URL`)
              resolveLoad()
            }
            
            reader.readAsDataURL(blob)
          })
        } catch (fetchError) {
          logger.error(`❌ Erro ao carregar imagem ${index}:`, fetchError)
          clearTimeout(timeout)
        }

        resolve()
      } catch (error) {
        logger.error(`❌ Erro geral na imagem ${index}:`, error)
        resolve()
      }
    })
  })

  // Aguardar todas as imagens
  await Promise.all(loadPromises)

  // Delay adicional para garantir renderização
  logger.info('⏳ Aguardando renderização final...')
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

/**
 * Limpa os atributos de cache das imagens
 */
function cleanupImageCache(element: HTMLElement): void {
  // Nada a fazer - imagens já estão como data URLs
  logger.info('🧹 Cache de imagens limpo')
}

/**
 * Exporta um único card de produto como imagem PNG
 */
export async function exportProductCard(
  produto: ProductCardData,
  elementId: string
): Promise<Blob> {
  const element = document.getElementById(elementId)

  if (!element) {
    throw new Error(`Elemento ${elementId} não encontrado`)
  }

  logger.info(`\n📦 Iniciando exportação: ${produto.nome} (${produto.codigo_produto})`)

  try {
    // 1. Forçar reload das imagens
    await forceReloadImages(element)

    // 2. Log das dimensões
    const rect = element.getBoundingClientRect()
    logger.info(`📏 Dimensões: ${rect.width}x${rect.height}`)

    // 3. Tentar exportar com toBlob primeiro
    logger.info('🎨 Gerando blob...')

    let blob: Blob | null = null

    try {
      blob = await toBlob(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#000000',
        skipFonts: false,
        includeQueryParams: false, // Importante: não incluir query params para evitar problemas
      })
    } catch (error) {
      logger.error('⚠️ toBlob falhou, tentando toPng:', error)

      // Fallback para toPng
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#000000',
        skipFonts: false,
        includeQueryParams: false,
      })

      if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
        throw new Error('Data URL inválido')
      }

      const response = await fetch(dataUrl)
      blob = await response.blob()
    }

    // 4. Validar blob
    if (!blob) {
      throw new Error('Blob é null - falha na conversão')
    }

    if (blob.size < 1024) {
      throw new Error(`Blob muito pequeno: ${blob.size} bytes`)
    }

    logger.info(`✅ Blob gerado com sucesso: ${(blob.size / 1024).toFixed(2)} KB`)

    // 5. Limpar cache para próxima exportação
    cleanupImageCache(element)

    return blob
  } catch (error) {
    logger.error('❌ Erro na exportação:', error)
    cleanupImageCache(element)
    throw error
  }
}

/**
 * Exporta uma grade de 4 produtos (2x2)
 */
export async function exportProductGrid(produtos: ProductCardData[]): Promise<Blob> {
  if (produtos.length !== 4) {
    throw new Error('A grade precisa ter exatamente 4 produtos')
  }

  logger.info('\n🎨 Iniciando exportação de grade 2x2')

  // Criar elemento temporário para a grade
  const gridContainer = document.createElement('div')
  gridContainer.id = 'product-grid-temp'
  gridContainer.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    z-index: 9999;
    width: 1680px;
    height: 1960px;
    background: linear-gradient(to bottom, #000000, #0a0a0a, #000000);
    padding: 40px;
    box-sizing: border-box;
    opacity: 0;
    pointer-events: none;
  `

  // Header da grade
  const header = document.createElement('div')
  header.style.cssText = `
    text-align: center;
    margin-bottom: 30px;
  `
  header.innerHTML = `
    <h1 style="
      font-size: 48px;
      font-weight: bold;
      color: #eab308;
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    ">LEOIPHONE - PROMOÇÕES</h1>
  `
  gridContainer.appendChild(header)

  // Container da grade 2x2
  const grid = document.createElement('div')
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    width: 100%;
  `

  // Adicionar cada produto à grade
  for (let i = 0; i < 4; i++) {
    const produto = produtos[i]
    const card = createCompactProductCard(produto)
    grid.appendChild(card)
  }

  gridContainer.appendChild(grid)

  // Footer
  const footer = document.createElement('div')
  footer.style.cssText = `
    text-align: center;
    margin-top: 30px;
  `
  footer.innerHTML = `
    <p style="
      font-size: 28px;
      color: #52525b;
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    ">leoiphone.com.br</p>
  `
  gridContainer.appendChild(footer)

  // Adicionar ao DOM
  document.body.appendChild(gridContainer)

  try {
    // Tornar visível temporariamente para renderização
    gridContainer.style.opacity = '1'
    
    // Aguardar imagens carregarem
    await forceReloadImages(gridContainer)

    // Delay adicional para renderização completa
    await new Promise((resolve) => setTimeout(resolve, 1500))

    logger.info('🎨 Gerando blob da grade...')

    let blob: Blob | null = null

    try {
      blob = await toBlob(gridContainer, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#000000',
        skipFonts: false,
        includeQueryParams: false,
        filter: (node: HTMLElement) => {
          // Garantir que imagens sejam incluídas
          if (node.tagName === 'IMG') {
            logger.info(`📸 Incluindo imagem: ${(node as HTMLImageElement).src?.slice(0, 50)}...`)
            return true
          }
          return true
        },
      })
    } catch (error) {
      logger.error('⚠️ toBlob falhou, tentando toPng:', error)

      const dataUrl = await toPng(gridContainer, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#000000',
        skipFonts: false,
        includeQueryParams: false,
        filter: (node: HTMLElement) => {
          if (node.tagName === 'IMG') {
            logger.info(`📸 Incluindo imagem: ${(node as HTMLImageElement).src?.slice(0, 50)}...`)
            return true
          }
          return true
        },
      })

      const response = await fetch(dataUrl)
      blob = await response.blob()
    }
    
    // Ocultar novamente
    gridContainer.style.opacity = '0'

    if (!blob || blob.size < 1024) {
      throw new Error('Falha ao gerar blob da grade')
    }

    logger.info(`✅ Grade gerada: ${(blob.size / 1024).toFixed(2)} KB`)

    return blob
  } finally {
    // Limpar elemento temporário e object URLs
    cleanupImageCache(gridContainer)
    document.body.removeChild(gridContainer)
  }
}

/**
 * Cria um card compacto para a grade
 */
function createCompactProductCard(produto: ProductCardData): HTMLElement {
  const card = document.createElement('div')
  card.style.cssText = `
    background: linear-gradient(to bottom, #18181b, #09090b);
    border: 2px solid #27272a;
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  `

  const desconto = Math.round(((produto.preco - produto.preco_promocional) / produto.preco) * 100)

  // Badge de desconto
  if (desconto > 0) {
    const badge = document.createElement('div')
    badge.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f97316, #dc2626);
      border-radius: 12px;
      padding: 8px 16px;
      z-index: 10;
    `
    badge.innerHTML = `
      <span style="
        font-size: 24px;
        font-weight: 900;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
      ">-${desconto}%</span>
    `
    card.appendChild(badge)
  }

  // Imagem do produto
  const imageContainer = document.createElement('div')
  imageContainer.style.cssText = `
    width: 100%;
    height: 320px;
    border-radius: 16px;
    overflow: hidden;
    background: #18181b;
    margin-bottom: 16px;
    position: relative;
  `

  const img = document.createElement('img')
  img.src = optimizeImageUrl(produto.foto_principal)
  img.alt = produto.nome
  // Não usar crossOrigin para evitar problemas de CORS
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `
  imageContainer.appendChild(img)
  card.appendChild(imageContainer)

  // Informações do produto
  const info = document.createElement('div')
  info.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `

  // Nome
  const title = document.createElement('h3')
  title.textContent = produto.nome
  title.style.cssText = `
    font-size: 22px;
    font-weight: bold;
    color: white;
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.3;
  `
  info.appendChild(title)

  // Código
  const code = document.createElement('p')
  code.textContent = produto.codigo_produto
  code.style.cssText = `
    font-size: 14px;
    color: #a1a1aa;
    margin: 0;
    font-family: 'Courier New', monospace;
  `
  info.appendChild(code)

  // Badges (condição, bateria, garantia)
  const badgesContainer = document.createElement('div')
  badgesContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `

  // Badge de condição
  if (produto.condicao === 'novo' && !produto.nivel_bateria) {
    const badge = document.createElement('span')
    badge.textContent = 'Novo'
    badge.style.cssText = `
      background: #16a34a;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      font-family: system-ui, -apple-system, sans-serif;
    `
    badgesContainer.appendChild(badge)
  } else if (produto.condicao === 'seminovo' && !produto.nivel_bateria) {
    const badge = document.createElement('span')
    badge.textContent = 'Seminovo'
    badge.style.cssText = `
      background: #d97706;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      font-family: system-ui, -apple-system, sans-serif;
    `
    badgesContainer.appendChild(badge)
  }

  // Badge de bateria
  if (produto.nivel_bateria) {
    const badge = document.createElement('span')
    badge.textContent = `🔋 ${produto.nivel_bateria}%`
    badge.style.cssText = `
      background: #3f3f46;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      font-family: system-ui, -apple-system, sans-serif;
    `
    badgesContainer.appendChild(badge)
  }

  // Badge de garantia
  if (produto.garantia && produto.garantia !== 'nenhuma') {
    const garantiaMap: Record<string, string> = {
      '3_meses': '3 meses',
      '6_meses': '6 meses',
      '1_ano': '1 ano',
    }
    const garantiaText = garantiaMap[produto.garantia]
    if (garantiaText) {
      const badge = document.createElement('span')
      badge.textContent = `✓ ${garantiaText}`
      badge.style.cssText = `
        background: #7c3aed;
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: bold;
        font-family: system-ui, -apple-system, sans-serif;
      `
      badgesContainer.appendChild(badge)
    }
  }

  info.appendChild(badgesContainer)

  // Preços
  const priceContainer = document.createElement('div')
  priceContainer.style.cssText = `
    border-top: 2px solid #27272a;
    padding-top: 12px;
    margin-top: auto;
  `

  if (produto.preco_promocional < produto.preco) {
    const oldPrice = document.createElement('p')
    oldPrice.textContent = `R$ ${produto.preco.toFixed(2)}`
    oldPrice.style.cssText = `
      font-size: 16px;
      color: #71717a;
      text-decoration: line-through;
      margin: 0 0 4px 0;
      font-family: system-ui, -apple-system, sans-serif;
    `
    priceContainer.appendChild(oldPrice)
  }

  const newPrice = document.createElement('p')
  newPrice.textContent = `R$ ${produto.preco_promocional.toFixed(2)}`
  newPrice.style.cssText = `
    font-size: 36px;
    font-weight: 900;
    color: #eab308;
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
  `
  priceContainer.appendChild(newPrice)

  info.appendChild(priceContainer)
  card.appendChild(info)

  return card
}

/**
 * Gera nome de arquivo para o produto
 */
export function generateFileName(produto: ProductCardData): string {
  const timestamp = Date.now()
  const codigo = produto.codigo_produto
    ? produto.codigo_produto.replace(/[^a-zA-Z0-9]/g, '-')
    : produto.id.substring(0, 8)
  return `produto-${codigo}-${timestamp}.png`
}

/**
 * Gera nome de arquivo para a grade
 */
export function generateGridFileName(): string {
  const timestamp = Date.now()
  return `grade-produtos-${timestamp}.png`
}

/**
 * Baixa um único arquivo ou compartilha no mobile
 */
export async function downloadFile(
  blob: Blob,
  fileName: string,
  produto?: ProductCardData
): Promise<void> {
  await shareOrDownloadImage(blob, fileName, {
    title: produto?.nome || 'Card de produto',
    text: produto ? `${produto.nome} - ${produto.codigo_produto}` : 'Card de produto',
  })

  logger.info(`💾 Download/Compartilhamento iniciado: ${fileName}`)
}

/**
 * Exporta múltiplos cards e cria um arquivo ZIP
 */
export async function exportMultipleCards(
  produtos: ProductCardData[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  logger.info(`\n🚀 Iniciando exportação em lote: ${produtos.length} produtos\n`)

  const zip = new JSZip()
  const folder = zip.folder('produtos-destaque')

  if (!folder) {
    throw new Error('Falha ao criar pasta no ZIP')
  }

  // Exportar cada card sequencialmente
  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i]

    // Notificar progresso
    if (onProgress) {
      onProgress(i + 1, produtos.length)
    }

    try {
      logger.info(`\n📦 [${i + 1}/${produtos.length}] ${produto.nome}`)

      // Exportar card
      const blob = await exportProductCard(produto, `product-card-${produto.id}`)
      const fileName = generateFileName(produto)
      folder.file(fileName, blob)

      logger.info(`✅ Adicionado ao ZIP: ${fileName}`)

      // Delay entre exportações (crítico para evitar cache)
      if (i < produtos.length - 1) {
        logger.info('⏳ Aguardando 2s antes do próximo...')
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    } catch (error) {
      logger.error(`❌ Erro ao exportar ${produto.codigo_produto}:`, error)
      // Continua com os outros produtos ao invés de falhar completamente
    }
  }

  logger.info('\n🗜️ Gerando arquivo ZIP...')

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  logger.info(`✅ ZIP gerado: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`)

  // Download
  const timestamp = Date.now()
  saveAs(zipBlob, `produtos-destaque-${timestamp}.zip`)

  logger.info('🎉 Exportação concluída!')
}