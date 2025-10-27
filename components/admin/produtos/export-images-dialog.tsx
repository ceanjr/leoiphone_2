'use client'

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

  const allImages = [
    produto.foto_principal ? { url: produto.foto_principal, label: 'Foto Principal' } : null,
    ...(produto.fotos || []).map((url, idx) => ({
      url,
      label: `Foto ${idx + 1}`,
    })),
  ].filter((img): img is { url: string; label: string } => img !== null && Boolean(img.url))

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
      const response = await fetch(url)
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
      console.error('Erro ao baixar imagem:', error)
    }
  }

  const handleExport = async () => {
    if (selectedImages.size === 0) return

    setDownloading(true)

    const selectedImagesList = allImages.filter((img) => selectedImages.has(img.url))

    for (const [index, image] of selectedImagesList.entries()) {
      const extension = image.url.split('.').pop()?.split('?')[0] || 'jpg'
      const slug = produto.slug || produto.nome.toLowerCase().replace(/\s+/g, '-')
      const filename = `${slug}-${image.label.toLowerCase().replace(/\s+/g, '-')}.${extension}`

      await downloadImage(image.url, filename)

      // Small delay between downloads to avoid browser blocking
      if (index < selectedImagesList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    setDownloading(false)
    setSelectedImages(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Exportar Imagens
          </DialogTitle>
          <DialogDescription>
            Selecione as imagens que deseja exportar de <strong>{produto.nome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedImages.size === allImages.length && allImages.length > 0}
                onCheckedChange={toggleAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Selecionar todas ({allImages.length})
              </label>
            </div>

            <Button
              onClick={handleExport}
              disabled={selectedImages.size === 0 || downloading}
              className="bg-[var(--brand-yellow)] text-black hover:bg-[var(--brand-yellow)]/90"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading
                ? `Exportando ${selectedImages.size}...`
                : `Exportar (${selectedImages.size})`}
            </Button>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {allImages.map((image, index) => (
              <div
                key={index}
                className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                  selectedImages.has(image.url)
                    ? 'border-[var(--brand-yellow)] shadow-lg shadow-[var(--brand-yellow)]/20'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
                onClick={() => toggleImage(image.url)}
              >
                {/* Checkbox */}
                <div className="absolute left-2 top-2 z-10">
                  <Checkbox
                    checked={selectedImages.has(image.url)}
                    onCheckedChange={() => toggleImage(image.url)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Image */}
                <div className="relative aspect-square overflow-hidden rounded-t-lg bg-zinc-900">
                  <Image
                    src={image.url}
                    alt={image.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>

                {/* Label */}
                <div className="p-2 text-center">
                  <p className="text-xs font-medium text-zinc-300">{image.label}</p>
                </div>
              </div>
            ))}
          </div>

          {allImages.length === 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-zinc-600" />
              <p className="mt-2 text-sm text-zinc-400">Nenhuma imagem disponível</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
