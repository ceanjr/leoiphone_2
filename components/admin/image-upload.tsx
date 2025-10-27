'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  disabled?: boolean
}

export function ImageUpload({ images, onChange, maxImages = 5, disabled = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Validar número máximo de imagens
    if (images.length + files.length > maxImages) {
      toast.error(`Você pode adicionar no máximo ${maxImages} imagens`)
      return
    }

    // Validar tipo de arquivo
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/')
      if (!isValid) {
        toast.error(`${file.name} não é uma imagem válida`)
      }
      return isValid
    })

    if (validFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadedUrls: string[] = []
      const totalFiles = validFiles.length

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]

        // Comprimir imagem antes do upload
        const options = {
          maxSizeMB: 0.5, // 500KB máximo
          maxWidthOrHeight: 1024, // Largura/altura máxima
          useWebWorker: true,
          fileType: 'image/webp', // Converter para WebP
        }

        let fileToUpload: File
        try {
          const compressedFile = await imageCompression(file, options)
          fileToUpload = compressedFile

          // Calcular redução de tamanho
          const originalSizeKB = (file.size / 1024).toFixed(0)
          const compressedSizeKB = (compressedFile.size / 1024).toFixed(0)
          console.log(`Imagem comprimida: ${originalSizeKB}KB → ${compressedSizeKB}KB`)
        } catch (compressionError) {
          console.warn('Erro ao comprimir imagem, usando original:', compressionError)
          fileToUpload = file
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao fazer upload')
        }

        const { url } = await response.json()
        uploadedUrls.push(url)

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      onChange([...images, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'imagem enviada' : 'imagens enviadas'} com sucesso!`)

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload das imagens')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
    toast.success('Imagem removida')
  }

  const handleSetAsPrincipal = (index: number) => {
    if (index === 0) return
    const newImages = [...images]
    const [removed] = newImages.splice(index, 1)
    newImages.unshift(removed)
    onChange(newImages)
    toast.success('Foto principal atualizada')
  }

  return (
    <div className="space-y-4">
      {/* Preview das imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {images.map((url, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-lg border-2 border-zinc-800 bg-zinc-950"
            >
              {/* Imagem */}
              <div className="aspect-square relative">
                <Image
                  src={url}
                  alt={`Foto ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  className="object-cover"
                />
              </div>

              {/* Badge "Principal" */}
              {index === 0 && (
                <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-black shadow-lg">
                  <Star className="h-3 w-3 fill-current" />
                  Principal
                </div>
              )}

              {/* Botões de ação - Sempre visíveis no mobile, hover no desktop */}
              <div className="absolute bottom-0 left-0 right-0 flex gap-1 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetAsPrincipal(index)
                    }}
                    disabled={disabled || uploading}
                    className="flex-1 gap-1 text-xs h-8"
                    title="Definir como principal"
                  >
                    <Star className="h-3 w-3" />
                    Principal
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage(index)
                  }}
                  disabled={disabled || uploading}
                  className={`gap-1 text-xs h-8 ${index === 0 ? 'flex-1' : 'flex-none px-3'}`}
                  title="Remover imagem"
                >
                  <X className="h-3 w-3" />
                  {index === 0 && 'Remover'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Área de upload */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950 p-8 text-center transition-colors hover:border-zinc-600 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    Enviando imagens...
                  </p>
                  <p className="text-xs text-zinc-500">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-zinc-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    Clique para adicionar fotos
                  </p>
                  <p className="text-xs text-zinc-500">
                    PNG, JPG, WEBP • Compressão automática • Máximo {maxImages} fotos
                  </p>
                  {images.length > 0 && (
                    <p className="text-xs text-zinc-600">
                      {images.length}/{maxImages} {images.length === 1 ? 'foto adicionada' : 'fotos adicionadas'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Dica sobre foto principal */}
      {images.length > 0 && (
        <p className="text-xs text-zinc-500">
          💡 A primeira foto será a foto principal do produto. Use o botão &quot;Principal&quot; para reorganizar.
        </p>
      )}
    </div>
  )
}
