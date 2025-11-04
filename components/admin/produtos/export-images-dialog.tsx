'use client'

import { logger } from '@/lib/utils/logger'
import { useState } from 'react'
import { Download, Image as ImageIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Image from 'next/image'
import type { ProdutoComCategoria } from '@/types/produto'

interface ExportImagesDialogProps {
  open: boolean
  onClose: () => void
  produto: ProdutoComCategoria | null
}

export function ExportImagesDialog({ open, onClose, produto }: ExportImagesDialogProps) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  if (!produto) return null

  // Evitar duplicação da foto principal
  const fotosAdicionais = (produto.fotos || []).filter(url => url !== produto.foto_principal)
  
  const allImages = [
    produto.foto_principal ? { url: produto.foto_principal, label: 'Foto Principal', isPrincipal: true } : null,
    ...fotosAdicionais.map((url, idx) => ({
      url,
      label: `Foto ${idx + 1}`,
      isPrincipal: false,
    })),
  ].filter((img): img is { url: string; label: string; isPrincipal: boolean } => img !== null && Boolean(img.url))

  const toggleImage = (url: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedImages(newSelected)
  }

  const toggleAll = () => {
    if (selectedImages.size === allImages.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(allImages.map((img) => img.url)))
    }
  }

  const downloadImage = async (url: string, filename: string) => {
    try {
      // Use API route to proxy image download
      const apiUrl = `/api/download-image?url=${encodeURIComponent(url)}`
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      logger.error('Erro ao baixar imagem:', error)
      throw error
    }
  }

  const handleExport = async () => {
    if (selectedImages.size === 0) return

    setDownloading(true)

    const selectedImagesList = allImages.filter((img) => selectedImages.has(img.url))
    let successCount = 0
    let errorCount = 0

    for (const [index, image] of selectedImagesList.entries()) {
      try {
        const extension = image.url.split('.').pop()?.split('?')[0] || 'jpg'
        const slug = produto.slug || produto.nome.toLowerCase().replace(/\s+/g, '-')
        const filename = `${slug}-${image.label.toLowerCase().replace(/\s+/g, '-')}.${extension}`

        await downloadImage(image.url, filename)
        successCount++

        // Small delay between downloads to avoid browser blocking
        if (index < selectedImagesList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      } catch (error) {
        logger.error(`Erro ao baixar imagem ${image.label}:`, error)
        errorCount++
      }
    }

    setDownloading(false)
    setSelectedImages(new Set())

    // Show result notification
    if (errorCount === 0) {
      import('sonner').then(({ toast }) => {
        toast.success(`${successCount} imagem(ns) exportada(s) com sucesso!`)
      })
    } else if (successCount > 0) {
      import('sonner').then(({ toast }) => {
        toast.warning(`${successCount} imagem(ns) exportada(s), ${errorCount} falharam.`)
      })
    } else {
      import('sonner').then(({ toast }) => {
        toast.error('Erro ao exportar as imagens. Tente novamente.')
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col p-0 sm:max-w-5xl sm:max-h-[85vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-yellow)]/10">
              <ImageIcon className="h-5 w-5 text-[var(--brand-yellow)]" />
            </div>
            <div>
              <div className="text-white">Exportar Imagens</div>
              <div className="text-sm font-normal text-zinc-400 mt-0.5">
                {produto.nome}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          <div className="space-y-5">
            {/* Stats & Actions Bar */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="select-all"
                  checked={selectedImages.size === allImages.length && allImages.length > 0}
                  onCheckedChange={toggleAll}
                  className="data-[state=checked]:bg-[var(--brand-yellow)] data-[state=checked]:border-[var(--brand-yellow)]"
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer select-none">
                  <span className="text-white">Selecionar todas</span>
                  <span className="ml-2 text-zinc-500">({allImages.length} {allImages.length === 1 ? 'imagem' : 'imagens'})</span>
                </label>
              </div>

              <Button
                onClick={handleExport}
                disabled={selectedImages.size === 0 || downloading}
                className="bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90 font-medium min-h-[44px]"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloading
                  ? `Exportando ${selectedImages.size}...`
                  : selectedImages.size === 0
                  ? 'Selecione imagens'
                  : `Exportar ${selectedImages.size} ${selectedImages.size === 1 ? 'imagem' : 'imagens'}`}
              </Button>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {allImages.map((image, index) => (
                <div
                  key={index}
                  className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                    selectedImages.has(image.url)
                      ? 'border-[var(--brand-yellow)] shadow-lg shadow-[var(--brand-yellow)]/20 scale-[1.02]'
                      : 'border-zinc-800 hover:border-zinc-700 hover:shadow-md'
                  }`}
                  onClick={() => toggleImage(image.url)}
                >
                  {/* Checkbox */}
                  <div className="absolute left-3 top-3 z-10">
                    <Checkbox
                      checked={selectedImages.has(image.url)}
                      onCheckedChange={() => toggleImage(image.url)}
                      onClick={(e) => e.stopPropagation()}
                      className="border-2 bg-black/50 backdrop-blur-sm data-[state=checked]:bg-[var(--brand-yellow)] data-[state=checked]:border-[var(--brand-yellow)]"
                    />
                  </div>

                  {/* Principal Badge */}
                  {image.isPrincipal && (
                    <div className="absolute right-3 top-3 z-10">
                      <div className="rounded-full bg-[var(--brand-yellow)] px-2 py-1 text-[10px] font-bold text-black">
                        PRINCIPAL
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-zinc-900">
                    <Image
                      src={image.url}
                      alt={image.label}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>

                  {/* Label */}
                  <div className={`p-3 text-center ${selectedImages.has(image.url) ? 'bg-[var(--brand-yellow)]/10' : 'bg-zinc-900/50'}`}>
                    <p className={`text-xs font-medium truncate ${selectedImages.has(image.url) ? 'text-[var(--brand-yellow)]' : 'text-zinc-400'}`}>
                      {image.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {allImages.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
                  <ImageIcon className="h-8 w-8 text-zinc-600" />
                </div>
                <p className="mt-4 text-sm font-medium text-zinc-400">Nenhuma imagem disponível</p>
                <p className="mt-1 text-xs text-zinc-500">Este produto não possui imagens cadastradas</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
