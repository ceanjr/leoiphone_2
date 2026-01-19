'use client'

import { useState, useRef } from 'react'
import { OptimizedImage } from '@/components/shared/optimized-image'
import { Upload, X, Loader2, Star, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { logger } from '@/lib/utils/logger'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragMoveEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  onImageRemove?: (imageUrl: string) => void | Promise<void>
  maxImages?: number
  disabled?: boolean
}

// Função para salvar e restaurar posição de scroll
function saveScrollPosition() {
  return { x: window.scrollX, y: window.scrollY }
}

function restoreScrollPosition(position: { x: number; y: number }) {
  // Usar múltiplos frames para garantir que o DOM foi atualizado
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(position.x, position.y)
    })
  })
}

// Componente SortableImage para drag and drop
function SortableImage({
  url,
  index,
  onRemove,
  onSetAsPrincipal,
  disabled,
  uploading,
}: {
  url: string
  index: number
  onRemove: () => void
  onSetAsPrincipal: () => void
  disabled: boolean
  uploading: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border-2 border-zinc-800 bg-zinc-950 ${
        isDragging ? 'z-50 shadow-xl ring-2 ring-yellow-500' : ''
      }`}
    >
      {/* Imagem */}
      <div className="relative h-full w-full">
        <OptimizedImage
          src={url}
          alt={`Foto ${index + 1}`}
          fill
          sizes="128px"
          className="object-cover"
          key={url}
        />
      </div>

      {/* Drag Handle - sempre visível */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 cursor-grab touch-none rounded bg-black/70 p-1 text-white transition-colors select-none hover:bg-black/90 active:cursor-grabbing"
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Badge "Principal" */}
      {index === 0 && (
        <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-medium text-black shadow-lg">
          <Star className="h-2.5 w-2.5 fill-current" />
          1ª
        </div>
      )}

      {/* Botão de definir como principal - canto superior direito (apenas para imagens que não são a principal) */}
      {index !== 0 && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation()
            onSetAsPrincipal()
          }}
          disabled={disabled || uploading}
          className="absolute top-[-3px] right-1 z-10 h-6 w-6 p-0"
          title="Definir como principal"
        >
          <Star className="h-3 w-3" />
        </Button>
      )}

      {/* Botão de remover - canto inferior direito */}
      <div className="absolute right-0 bottom-0 left-0 flex justify-end bg-linear-to-t from-black/90 to-transparent p-1.5">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          disabled={disabled || uploading}
          className="h-6 w-6 p-0"
          title="Remover imagem"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function ImageUpload({
  images,
  onChange,
  onImageRemove,
  maxImages = 5,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [pendingImagesCount, setPendingImagesCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedScrollPositionRef = useRef<{ x: number; y: number } | null>(null)

  // Sensors para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Validar número máximo de imagens
    if (images.length + files.length > maxImages) {
      toast.error(`Você pode adicionar no máximo ${maxImages} imagens`)
      return
    }

    // Validar tipo de arquivo
    const validFiles = files.filter((file) => {
      const isValid = file.type.startsWith('image/')
      if (!isValid) {
        toast.error(`${file.name} não é uma imagem válida`)
      }
      return isValid
    })

    if (validFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setPendingImagesCount(validFiles.length)

    try {
      const uploadedUrls: string[] = []
      const totalFiles = validFiles.length

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]

        // Comprimir imagem antes do upload com qualidade alta
        const options = {
          maxSizeMB: 2, // 2MB máximo (aumentado para melhor qualidade)
          maxWidthOrHeight: 1920, // Full HD (aumentado de 1024 para 1920)
          useWebWorker: true,
          initialQuality: 0.9, // Qualidade inicial alta (90%)
          alwaysKeepResolution: false, // Permite redimensionar se necessário
        }

        let fileToUpload: File
        try {
          // Só comprimir se a imagem for maior que 2MB ou muito grande
          if (file.size > 2 * 1024 * 1024) {
            const compressedFile = await imageCompression(file, options)
            fileToUpload = compressedFile

            // Calcular redução de tamanho
            const originalSizeMB = (file.size / 1024 / 1024).toFixed(2)
            const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2)
            logger.debug(`[Upload] Imagem otimizada: ${originalSizeMB}MB → ${compressedSizeMB}MB`)
          } else {
            // Imagem já está em tamanho bom, usar original
            fileToUpload = file
            logger.debug(`[Upload] Imagem já otimizada: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
          }
        } catch (compressionError) {
          logger.warn('[Upload] Erro ao comprimir imagem, usando original:', compressionError)
          fileToUpload = file
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)

        // Usar API do Cloudinary para novos uploads
        const response = await fetch('/api/upload-cloudinary', {
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

      // Adicionar timestamp para evitar cache
      const urlsWithTimestamp = uploadedUrls.map((url) => {
        const separator = url.includes('?') ? '&' : '?'
        return `${url}${separator}t=${Date.now()}`
      })

      // Salvar posição de scroll antes de atualizar imagens
      savedScrollPositionRef.current = saveScrollPosition()

      onChange([...images, ...urlsWithTimestamp])

      // Restaurar posição após a atualização do DOM
      if (savedScrollPositionRef.current) {
        restoreScrollPosition(savedScrollPositionRef.current)
        savedScrollPositionRef.current = null
      }
    } catch (error) {
      logger.error('Erro no upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload das imagens')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setPendingImagesCount(0)
    }
  }

  const handleRemoveImage = async (index: number) => {
    const removedImage = images[index]
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)

    // Chamar callback de remoção se fornecido (para deletar do Cloudinary)
    if (onImageRemove && removedImage) {
      try {
        await onImageRemove(removedImage)
      } catch (error) {
        logger.error('Erro ao processar remoção de imagem:', error)
      }
    }

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

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((url) => url === active.id)
    const newIndex = images.findIndex((url) => url === over.id)

    const newImages = arrayMove(images, oldIndex, newIndex)
    onChange(newImages)
    toast.success('Ordem das fotos atualizada')
  }

  // Auto-scroll horizontal durante o arrasto
  const handleDragMove = (event: DragMoveEvent) => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const containerRect = container.getBoundingClientRect()

    // Usar a posição do overlay ativo
    const activeNode = event.active.rect.current.translated
    if (!activeNode) return

    const activeLeft = activeNode.left
    const activeRight = activeLeft + activeNode.width

    const threshold = 60 // pixels da borda para iniciar scroll
    const scrollSpeed = 15

    // Scroll para a esquerda quando arrasto perto da borda esquerda
    if (activeLeft < containerRect.left + threshold) {
      container.scrollBy({ left: -scrollSpeed, behavior: 'auto' })
    }
    // Scroll para a direita quando arrasto perto da borda direita
    if (activeRight > containerRect.right - threshold) {
      container.scrollBy({ left: scrollSpeed, behavior: 'auto' })
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Container com borda tracejada e altura fixa para evitar scroll da página */}
      <div className="w-full rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-colors hover:border-zinc-600 hover:bg-zinc-900">
        {/* Preview das imagens em linha horizontal com scroll - altura fixa */}
        {(images.length > 0 || pendingImagesCount > 0) && (
          <div className="flex h-[188px] flex-col">
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto p-3"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#52525b #27272a',
              }}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragMove={handleDragMove}
              >
                <SortableContext items={images} strategy={horizontalListSortingStrategy}>
                  <div className="flex gap-3">
                    {images.map((url, index) => (
                      <SortableImage
                        key={url}
                        url={url}
                        index={index}
                        onRemove={() => handleRemoveImage(index)}
                        onSetAsPrincipal={() => handleSetAsPrincipal(index)}
                        disabled={disabled}
                        uploading={uploading}
                      />
                    ))}
                    {/* Placeholders para imagens sendo carregadas com progresso */}
                    {pendingImagesCount > 0 &&
                      Array.from({ length: pendingImagesCount }).map((_, index) => (
                        <div
                          key={`placeholder-${index}`}
                          className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900"
                        >
                          {/* Barra de progresso circular */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                                {/* Círculo de fundo */}
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="14"
                                  fill="none"
                                  stroke="#3f3f46"
                                  strokeWidth="3"
                                />
                                {/* Círculo de progresso */}
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="14"
                                  fill="none"
                                  stroke="#eab308"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(uploadProgress / 100) * 88} 88`}
                                  className="transition-all duration-300"
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-yellow-500">
                                {uploadProgress}%
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500">Enviando...</span>
                          </div>
                        </div>
                      ))}
                    {/* Botão de adicionar inline quando já há imagens */}
                    {images.length > 0 && images.length < maxImages && !uploading && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={disabled || uploading}
                          className="flex h-32 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-colors hover:border-zinc-500 hover:bg-zinc-800/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Upload className="h-6 w-6 text-zinc-500" />
                          <span className="text-xs text-zinc-400">Adicionar</span>
                        </button>
                        {/* Spacer para garantir padding no final do scroll */}
                        <div className="w-3 shrink-0" aria-hidden="true" />
                      </>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            {/* Mensagem informativa sobre limite - sempre visível quando há imagens */}
            <div className="border-t border-zinc-800 px-3 py-1.5 text-center">
              <p className="text-[11px] text-zinc-500">
                {images.length >= maxImages
                  ? `Máximo de ${maxImages} fotos atingido`
                  : `${images.length} de ${maxImages} fotos`}
              </p>
            </div>
          </div>
        )}

        {/* Área de upload - mostrar apenas quando não há imagens e não está carregando */}
        {images.length === 0 && !uploading && pendingImagesCount === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex h-[188px] w-full flex-col items-center justify-center p-6 text-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-12 w-12 text-zinc-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Clique para adicionar fotos</p>
                <p className="text-xs text-zinc-500">
                  PNG, JPG, WEBP • Máximo {maxImages} fotos • Até 10MB por foto
                </p>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
