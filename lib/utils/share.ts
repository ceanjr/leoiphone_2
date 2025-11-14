/**
 * Utilitários para compartilhamento nativo no mobile
 */

import { logger } from './logger'

/**
 * Detecta se o dispositivo é mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Verifica se a Web Share API está disponível
 */
export function isShareSupported(): boolean {
  if (typeof window === 'undefined') return false

  return 'share' in navigator && 'canShare' in navigator
}

/**
 * Compartilha uma imagem usando a API nativa do dispositivo (mobile)
 * ou faz download tradicional (desktop)
 *
 * @param blob - Blob da imagem a ser compartilhada
 * @param fileName - Nome do arquivo
 * @param title - Título do compartilhamento (opcional)
 * @param text - Texto do compartilhamento (opcional)
 */
export async function shareOrDownloadImage(
  blob: Blob,
  fileName: string,
  options?: {
    title?: string
    text?: string
  }
): Promise<void> {
  const isMobile = isMobileDevice()
  const canShare = isShareSupported()

  logger.info('📱 Detectando compartilhamento:', { isMobile, canShare })

  // No mobile com suporte a Web Share API, usar compartilhamento nativo
  if (isMobile && canShare) {
    try {
      // Criar arquivo a partir do blob
      const file = new File([blob], fileName, { type: blob.type })

      // Verificar se pode compartilhar este arquivo
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        logger.warn('⚠️ Compartilhamento de arquivos não suportado, fazendo download')
        downloadBlob(blob, fileName)
        return
      }

      // Compartilhar usando a API nativa
      await navigator.share({
        files: [file],
        title: options?.title || 'Compartilhar imagem',
        text: options?.text || '',
      })

      logger.info('✅ Imagem compartilhada com sucesso via API nativa')
    } catch (error) {
      // Se o usuário cancelou o compartilhamento
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('ℹ️ Compartilhamento cancelado pelo usuário')
        return
      }

      // Fallback para download em caso de erro
      logger.error('❌ Erro ao compartilhar, fazendo download:', error)
      downloadBlob(blob, fileName)
    }
  } else {
    // Desktop ou sem suporte: fazer download tradicional
    logger.info('💻 Desktop ou sem suporte, fazendo download')
    downloadBlob(blob, fileName)
  }
}

/**
 * Faz download de um blob (método tradicional)
 *
 * @param blob - Blob a ser baixado
 * @param fileName - Nome do arquivo
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Limpar URL depois de um tempo
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Compartilha ou baixa múltiplas imagens
 * No mobile, compartilha uma por vez (limitação da API)
 * No desktop, faz download de todas
 *
 * @param blobs - Array de blobs e nomes de arquivo
 * @param options - Opções de compartilhamento
 */
export async function shareOrDownloadMultipleImages(
  blobs: Array<{ blob: Blob; fileName: string }>,
  options?: {
    title?: string
    text?: string
  }
): Promise<void> {
  const isMobile = isMobileDevice()
  const canShare = isShareSupported()

  if (isMobile && canShare && blobs.length === 1) {
    // Se for apenas uma imagem no mobile, usar compartilhamento nativo
    await shareOrDownloadImage(blobs[0].blob, blobs[0].fileName, options)
  } else if (isMobile && canShare && blobs.length > 1) {
    // Múltiplas imagens no mobile: perguntar ao usuário
    const userChoice = confirm(
      `Deseja compartilhar ${blobs.length} imagens? (Serão compartilhadas uma por vez)`
    )

    if (userChoice) {
      for (const { blob, fileName } of blobs) {
        await shareOrDownloadImage(blob, fileName, options)
        // Pequeno delay entre compartilhamentos
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  } else {
    // Desktop ou sem suporte: fazer download de todas
    for (const { blob, fileName } of blobs) {
      downloadBlob(blob, fileName)
      // Pequeno delay entre downloads
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
}
