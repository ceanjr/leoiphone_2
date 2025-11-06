'use client'

import { useState, useRef, useEffect, TouchEvent, memo } from 'react'
import NextImage from 'next/image'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  productName: string
  selectedIndex: number
  onIndexChange: (index: number) => void
}

function ImageGalleryWithZoomComponent({
  images,
  productName,
  selectedIndex,
  onIndexChange,
}: ImageGalleryProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoading, setImageLoading] = useState(false)

  // Touch events refs
  const touchStartRef = useRef<{ x: number; y: number; distance: number } | null>(null)
  const lastScaleRef = useRef(1)

  // Preload imagens adjacentes para carregamento rápido
  useEffect(() => {
    // Preload TODAS as imagens ao abrir o componente
    images.forEach((src) => {
      if (src) {
        const img = new Image()
        img.src = src
        // Priority hint for faster loading
        img.loading = 'eager'
      }
    })
  }, [images])
  
  // Preload específico para imagens adjacentes à selecionada
  useEffect(() => {
    // Preload imagem anterior e próxima com alta prioridade
    const imagesToPreload = [
      images[selectedIndex - 1],
      images[selectedIndex],
      images[selectedIndex + 1],
    ].filter(Boolean)

    imagesToPreload.forEach((src) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })
  }, [selectedIndex, images])

  // Reset zoom when changing image
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsZoomed(false)
  }, [selectedIndex])

  // Handle pinch zoom
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2

      touchStartRef.current = { x: centerX, y: centerY, distance }
      lastScaleRef.current = scale
    }
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      e.preventDefault()

      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)

      const newScale = Math.min(
        Math.max(lastScaleRef.current * (distance / touchStartRef.current.distance), 1),
        4
      )

      setScale(newScale)
      setIsZoomed(newScale > 1)
    }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  // Handle double tap to zoom
  const handleDoubleTap = () => {
    if (scale === 1) {
      setScale(2)
      setIsZoomed(true)
    } else {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      setIsZoomed(false)
    }
  }

  // Handle image change with instant preload
  const handleImageChange = (index: number) => {
    // Immediately change the index (no loading state delay)
    onIndexChange(index)
    
    // Preload next and previous for smooth navigation
    const adjacentImages = [
      images[index - 1],
      images[index + 1],
    ].filter(Boolean)
    
    adjacentImages.forEach((src) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })
  }

  // Fullscreen modal
  const [showFullscreen, setShowFullscreen] = useState(false)

  const openFullscreen = () => {
    // Images already preloaded at component mount, just open immediately
    setShowFullscreen(true)
    // Bloquear scroll do body
    document.body.style.overflow = 'hidden'
  }

  const closeFullscreen = () => {
    setShowFullscreen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsZoomed(false)
    // Restaurar scroll do body
    document.body.style.overflow = ''
  }

  // Desktop zoom with mouse
  const handleMouseZoom = (zoomIn: boolean) => {
    const newScale = zoomIn ? Math.min(scale + 0.5, 4) : Math.max(scale - 0.5, 1)
    setScale(newScale)
    setIsZoomed(newScale > 1)
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  return (
    <>
      {/* Main Image */}
      <div className="relative">
        <div
          className="relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 cursor-pointer"
          onClick={openFullscreen}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images[selectedIndex] ? (
            <>
              <NextImage
                src={images[selectedIndex]}
                alt={productName}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
                className={`object-cover transition-opacity duration-200 ${imageLoading ? 'opacity-70' : 'opacity-100'}`}
                priority={selectedIndex === 0}
                onLoad={() => setImageLoading(false)}
              />
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-[var(--brand-yellow)]" />
                </div>
              )}
              {/* Zoom indicator */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-white backdrop-blur-sm">
                <ZoomIn className="h-4 w-4" />
                <span className="text-xs">Toque para ampliar</span>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-700">
              Sem imagem disponível
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {images.map((foto, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`relative aspect-square overflow-hidden rounded border-2 bg-zinc-950 transition-all duration-200 ${
                  selectedIndex === index
                    ? 'scale-105 border-yellow-500 ring-2 ring-yellow-500/50'
                    : 'border-zinc-800 hover:scale-105 hover:border-zinc-700'
                }`}
              >
                <NextImage
                  src={foto}
                  alt={`${productName} - Foto ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 20vw, (max-width: 1024px) 15vw, 120px"
                  className="object-cover"
                  loading="eager"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal with Pinch Zoom */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          {/* Close Button */}
          <button
            onClick={closeFullscreen}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Zoom Controls (Desktop) */}
          <div className="absolute bottom-4 right-4 z-10 hidden gap-2 md:flex">
            <button
              onClick={() => handleMouseZoom(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleMouseZoom(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
          </div>

          {/* Zoomable Image */}
          <div
            className="relative h-full w-full touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleTap}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              <NextImage
                src={images[selectedIndex]}
                alt={productName}
                width={1200}
                height={1200}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Instructions */}
            {!isZoomed && (
              <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-center text-sm text-white backdrop-blur-sm">
                <p className="md:hidden">Belisque para dar zoom</p>
                <p className="hidden md:block">Use os botões ou duplo clique para dar zoom</p>
              </div>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto px-4">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleImageChange(index)}
                  className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                    selectedIndex === index ? 'w-8 bg-yellow-500' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Foto ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// Memoize para evitar re-renders desnecessários do componente pesado
export const ImageGalleryWithZoom = memo(ImageGalleryWithZoomComponent)
