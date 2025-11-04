import { logger } from '@/lib/utils/logger'
import { toBlob, toPng } from 'html-to-image'
import type { ParcelaData } from './calculadora-export-renderer'

/**
 * Exporta a simulação de parcelas como imagem PNG
 */
export async function exportSimulacao(
  valor: string,
  parcelas: ParcelaData[]
): Promise<Blob> {
  const element = document.getElementById('calculadora-export')

  if (!element) {
    throw new Error('Elemento calculadora-export não encontrado')
  }

  logger.info(`🔍 Exportando simulação: R$ ${valor}`)

  // Delay para garantir renderização
  logger.info('⏳ Aguardando renderização...')
  await new Promise(resolve => setTimeout(resolve, 500))

  logger.info('🎨 Gerando blob...')
  
  // Log das dimensões do elemento
  const rect = element.getBoundingClientRect()
  logger.info(`📐 Dimensões do elemento: ${rect.width}x${rect.height}`)
  
  // Usar toBlob com tratamento de erro robusto
  let blob: Blob | null = null
  
  try {
    blob = await toBlob(element, {
      cacheBust: false,
      pixelRatio: 2,
      backgroundColor: '#000000',
      skipFonts: false,
      width: 800,
    })
    
    logger.info('✅ toBlob executou sem erro')
  } catch (error) {
    logger.error('❌ Erro no toBlob:', error)
    // Tentar com toPng como fallback
    logger.info('🔄 Tentando com toPng como fallback...')
    
    const dataUrl = await toPng(element, {
      cacheBust: false,
      pixelRatio: 2,
      backgroundColor: '#000000',
      skipFonts: false,
      width: 800,
    })
    
    if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('Falha ao gerar imagem (data URL inválido)')
    }
    
    // Converter data URL para blob
    const response = await fetch(dataUrl)
    blob = await response.blob()
  }

  if (!blob) {
    logger.error('❌ Blob é null após toBlob')
    throw new Error('Falha ao criar imagem - toBlob retornou null')
  }

  logger.info(`✅ Blob gerado: ${blob.size} bytes, tipo: ${blob.type}`)

  // Validar tamanho mínimo do blob (1KB)
  if (blob.size < 1024) {
    throw new Error(`Blob muito pequeno: ${blob.size} bytes - pode estar corrompido`)
  }

  return blob
}

/**
 * Faz o download da imagem
 */
export function downloadSimulacao(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `simulacao-parcelas-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Limpar URL depois de um tempo
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  
  logger.info('✅ Simulação baixada com sucesso!')
}

/**
 * Compartilha a imagem (mobile)
 */
export async function shareSimulacao(
  blob: Blob,
  valor: string
): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) {
    return false
  }

  const file = new File([blob], `simulacao-parcelas-${Date.now()}.png`, {
    type: 'image/png',
  })

  if (!navigator.canShare({ files: [file] })) {
    return false
  }

  try {
    await navigator.share({
      title: 'Simulação de Parcelamento - Léo iPhone',
      text: `Simulação de parcelamento para R$ ${valor}`,
      files: [file],
    })
    logger.info('✅ Simulação compartilhada com sucesso!')
    return true
  } catch (error) {
    logger.info('[Export] Erro no compartilhamento:', error)
    return false
  }
}
