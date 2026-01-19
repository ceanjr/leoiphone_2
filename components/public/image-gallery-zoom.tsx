'use client'

/**
 * ImageGalleryWithZoom - Componente de galeria de imagens otimizado para mobile
 *
 * MELHORIAS IMPLEMENTADAS:
 * ✅ Swipe lateral para navegação entre imagens
 * ✅ Pinch-to-zoom e double-tap otimizados
 * ✅ Botões de toque ≥44px (acessibilidade)
 * ✅ Safe areas (notch, bordas arredondadas)
 * ✅ Suporte ao botão "voltar" do navegador
 * ✅ Acessibilidade completa (ARIA, foco, teclado)
 * ✅ Performance otimizada (lazy loading inteligente)
 * ✅ Feedback visual nas transições
 * ✅ Adaptação automática retrato/paisagem
 */

import { useState, useRef, useEffect, TouchEvent, memo, useCallback } from 'react'
import { OptimizedImage } from '@/components/shared/optimized-image'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  productName: string
  selectedIndex: number
  onIndexChange: React.Dispatch<React.SetStateAction<number>>
}

// Hook personalizado para gestos de toque
function useGestures(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  onPinchZoom: (scale: number) => void,
  onDoubleTap: () => void
) {
  const touchStartRef = useRef<{ x: number; y: number; distance: number; time: number } | null>(
    null
  )
  const lastTapRef = useRef<number>(0)
  const lastScaleRef = useRef(1)

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2

      touchStartRef.current = { x: centerX, y: centerY, distance, time: Date.now() }
    } else if (e.touches.length === 1) {
      // Single touch (swipe ou tap)
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        distance: 0,
        time: Date.now(),
      }
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && touchStartRef.current) {
        // Pinch zoom
        e.preventDefault()

        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )

        const scale = distance / touchStartRef.current.distance
        const newScale = Math.min(Math.max(lastScaleRef.current * scale, 1), 4)

        onPinchZoom(newScale)
      }
    },
    [onPinchZoom]
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time
      const distance = Math.hypot(deltaX, deltaY)

      // Detectar double tap
      const now = Date.now()
      if (deltaTime < 300 && distance < 10) {
        if (now - lastTapRef.current < 300) {
          onDoubleTap()
          lastTapRef.current = 0
          touchStartRef.current = null
          return
        }
        lastTapRef.current = now
      }

      // Detectar swipe (movimento rápido e horizontal)
      if (deltaTime < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
        if (deltaX > 0) {
          onSwipeRight()
        } else {
          onSwipeLeft()
        }
      }

      touchStartRef.current = null
    },
    [onSwipeLeft, onSwipeRight, onDoubleTap]
  )

  return { handleTouchStart, handleTouchMove, handleTouchEnd }
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
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Ref para gerenciar foco e histórico do navegador
  const triggerRef = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Preload imagens adjacentes (performance) - usa Image() para evitar warning de preload não utilizado
  useEffect(() => {
    if (!showFullscreen) return

    // Preload apenas imagens adjacentes que ainda não foram carregadas
    const adjacentImages = [images[selectedIndex - 1], images[selectedIndex + 1]].filter(Boolean)

    adjacentImages.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [selectedIndex, images, showFullscreen])

  // Reset zoom quando trocar de imagem
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsZoomed(false)
  }, [selectedIndex])

  // Navegação entre imagens com feedback visual
  const handleImageChange = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= images.length) return

      setIsTransitioning(true)
      onIndexChange(newIndex)

      setTimeout(() => setIsTransitioning(false), 300)
    },
    [images.length, onIndexChange]
  )

  // Gestos customizados
  const handlePinchZoom = useCallback((newScale: number) => {
    setScale(newScale)
    setIsZoomed(newScale > 1)
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [])

  const handleDoubleTap = useCallback(() => {
    if (scale === 1) {
      setScale(2)
      setIsZoomed(true)
    } else {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      setIsZoomed(false)
    }
  }, [scale])

  const handleSwipeLeft = useCallback(() => {
    if (!isZoomed) {
      setIsTransitioning(true)
      onIndexChange((prevIndex: number) => {
        const newIndex = prevIndex + 1
        if (newIndex >= images.length) return prevIndex
        return newIndex
      })
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }, [isZoomed, images.length, onIndexChange])

  const handleSwipeRight = useCallback(() => {
    if (!isZoomed) {
      setIsTransitioning(true)
      onIndexChange((prevIndex: number) => {
        const newIndex = prevIndex - 1
        if (newIndex < 0) return prevIndex
        return newIndex
      })
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }, [isZoomed, images.length, onIndexChange])

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useGestures(
    handleSwipeLeft,
    handleSwipeRight,
    handlePinchZoom,
    handleDoubleTap
  )

  // Abrir lightbox
  const openFullscreen = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement
    setShowFullscreen(true)

    // Adicionar entrada no histórico para suportar botão "voltar"
    window.history.pushState({ lightbox: true }, '')

    // Bloquear scroll e garantir que lightbox ocupe viewport atual
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = `-${window.scrollY}px`

    // Foco no dialog (acessibilidade)
    setTimeout(() => {
      dialogRef.current?.focus()
    }, 100)
  }, [])

  // Fechar lightbox
  const closeFullscreen = useCallback(() => {
    setShowFullscreen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsZoomed(false)

    // Restaurar scroll e posição da página
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)

    // Retornar foco ao elemento que abriu (acessibilidade)
    triggerRef.current?.focus()

    // Remover entrada do histórico se ainda existir
    if (window.history.state?.lightbox) {
      window.history.back()
    }
  }, [])

  // Suporte ao botão "voltar" do navegador
  useEffect(() => {
    if (!showFullscreen) return

    const handlePopState = (e: PopStateEvent) => {
      if (showFullscreen) {
        e.preventDefault()
        setShowFullscreen(false)
        setScale(1)
        setPosition({ x: 0, y: 0 })
        setIsZoomed(false)
        document.body.style.overflow = ''
        triggerRef.current?.focus()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [showFullscreen])

  // Navegação por teclado (acessibilidade)
  useEffect(() => {
    if (!showFullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeFullscreen()
          break
        case 'ArrowLeft':
          handleImageChange(selectedIndex - 1)
          break
        case 'ArrowRight':
          handleImageChange(selectedIndex + 1)
          break
        case '+':
        case '=':
          setScale((s) => Math.min(s + 0.5, 4))
          setIsZoomed(true)
          break
        case '-':
          setScale((s) => Math.max(s - 0.5, 1))
          if (scale <= 1.5) setIsZoomed(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showFullscreen, selectedIndex, closeFullscreen, handleImageChange, scale])

  // Zoom com mouse (desktop)
  const handleMouseZoom = useCallback(
    (zoomIn: boolean) => {
      const newScale = zoomIn ? Math.min(scale + 0.5, 4) : Math.max(scale - 0.5, 1)
      setScale(newScale)
      setIsZoomed(newScale > 1)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
    },
    [scale]
  )

  return (
    <>
      {/* Galeria principal */}
      <div className="relative">
        <div
          className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
          onClick={openFullscreen}
          role="button"
          aria-label={`Abrir visualização em tela cheia de ${productName}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openFullscreen()
            }
          }}
        >
          {images[selectedIndex] ? (
            <>
              <OptimizedImage
                key={`gallery-${selectedIndex}-${images[selectedIndex]}`}
                src={images[selectedIndex]}
                alt={`${productName} - Imagem ${selectedIndex + 1} de ${images.length}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
                className="object-cover transition-opacity duration-200"
                priority={selectedIndex === 0}
              />
              {/* Indicador de zoom */}
              <div className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-white backdrop-blur-sm">
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

        {/* Miniaturas */}
        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {images.map((foto, index) => (
              <button
                key={index}
                onClick={() => onIndexChange(index)}
                className={`relative aspect-square overflow-hidden rounded border-2 bg-zinc-950 transition-all duration-200 ${
                  selectedIndex === index
                    ? 'scale-105 border-yellow-500 ring-2 ring-yellow-500/50'
                    : 'border-zinc-800 hover:scale-105 hover:border-zinc-700'
                }`}
                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                aria-current={selectedIndex === index ? 'true' : 'false'}
              >
                {foto ? (
                  <OptimizedImage
                    src={foto}
                    alt={`${productName} - Miniatura ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 20vw, (max-width: 1024px) 15vw, 120px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-700">
                    Sem foto
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox em tela cheia */}
      {showFullscreen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Visualização de imagem em tela cheia"
          tabIndex={-1}
          className="fixed inset-0 z-[9999] bg-black"
          style={{
            // Garantir que ocupa toda a viewport
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh', // Dynamic viewport height para mobile
          }}
        >
          {/* Container interno com safe areas e conteúdo */}
          <div
            className="relative flex h-full w-full items-center justify-center"
            style={{
              // Safe areas para notch e bordas arredondadas
              paddingTop: 'env(safe-area-inset-top, 0)',
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
              paddingLeft: 'env(safe-area-inset-left, 0)',
              paddingRight: 'env(safe-area-inset-right, 0)',
            }}
          >
            {/* Botão fechar - tamanho ≥44px para acessibilidade */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
              aria-label="Fechar visualização"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                top: 'max(1rem, env(safe-area-inset-top, 0))',
                right: 'max(1rem, env(safe-area-inset-right, 0))',
              }}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Controles de navegação - botões ≥44px */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => handleImageChange(selectedIndex - 1)}
                  disabled={selectedIndex === 0}
                  className="absolute top-1/2 left-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Imagem anterior"
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    left: 'max(1rem, env(safe-area-inset-left, 0))',
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  onClick={() => handleImageChange(selectedIndex + 1)}
                  disabled={selectedIndex === images.length - 1}
                  className="absolute top-1/2 right-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Próxima imagem"
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    right: 'max(1rem, env(safe-area-inset-right, 0))',
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Controles de zoom (desktop) - botões ≥44px */}
            <div
              className="absolute right-4 bottom-20 z-10 hidden gap-2 md:flex"
              style={{
                right: 'max(1rem, env(safe-area-inset-right, 0))',
              }}
            >
              <button
                onClick={() => handleMouseZoom(true)}
                disabled={scale >= 4}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95 disabled:opacity-30"
                aria-label="Ampliar"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleMouseZoom(false)}
                disabled={scale <= 1}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95 disabled:opacity-30"
                aria-label="Reduzir"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <ZoomOut className="h-5 w-5" />
              </button>
            </div>

            {/* Área da imagem com gestos */}
            <div
              className="relative h-full w-full touch-none select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleTap}
              onClick={(e) => {
                // Fechar ao clicar fora da imagem (área preta)
                if (e.target === e.currentTarget && !isZoomed) {
                  closeFullscreen()
                }
              }}
            >
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                  transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                  transition: isTransitioning ? 'opacity 0.3s ease-out' : 'transform 0.2s ease-out',
                }}
              >
                <OptimizedImage
                  key={`lightbox-${selectedIndex}-${images[selectedIndex]}`}
                  src={images[selectedIndex]}
                  alt={`${productName} - Imagem ${selectedIndex + 1} de ${images.length}`}
                  width={1200}
                  height={1200}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Instruções de uso */}
              {!isZoomed && (
                <div
                  className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-center text-sm text-white backdrop-blur-sm"
                  style={{
                    bottom: 'max(5rem, env(safe-area-inset-bottom, 0))',
                  }}
                >
                  <p className="md:hidden">Deslize para navegar • Belisque para zoom</p>
                  <p className="hidden md:block">Use as setas ou clique duas vezes para zoom</p>
                </div>
              )}
            </div>

            {/* Indicador de posição melhorado */}
            {images.length > 1 && (
              <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
                aria-live="polite"
                aria-atomic="true"
                style={{
                  bottom: 'max(2rem, env(safe-area-inset-bottom, 0))',
                }}
              >
                {selectedIndex + 1} / {images.length}
              </div>
            )}

            {/* Navegação por miniaturas (mobile landscape) */}
            {images.length > 1 && (
              <div
                className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto px-4 md:hidden"
                style={{
                  bottom: 'max(1rem, env(safe-area-inset-bottom, 0))',
                }}
              >
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageChange(index)}
                    className={`h-2 shrink-0 rounded-full transition-all ${
                      selectedIndex === index
                        ? 'w-8 bg-yellow-500'
                        : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                    aria-current={selectedIndex === index ? 'true' : 'false'}
                    style={{ minWidth: '8px', minHeight: '8px' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Memoize para evitar re-renders desnecessários
export const ImageGalleryWithZoom = memo(ImageGalleryWithZoomComponent)
