'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const BottomSheet = DialogPrimitive.Root

const BottomSheetTrigger = DialogPrimitive.Trigger

const BottomSheetPortal = DialogPrimitive.Portal

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed z-50 bg-black/95 backdrop-blur-md',
      // PWA: Cobrir toda a tela incluindo safe area
      'top-[calc(0px-env(safe-area-inset-top))] bottom-[calc(0px-env(safe-area-inset-bottom))]',
      'left-[calc(0px-env(safe-area-inset-left))] right-[calc(0px-env(safe-area-inset-right))]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=open]:duration-300 data-[state=closed]:duration-200',
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName

interface BottomSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showHandle?: boolean
}

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BottomSheetContentProps
>(({ className, children, showHandle = true, ...props }, ref) => {
  const [dragStart, setDragStart] = React.useState<number | null>(null)
  const [dragOffset, setDragOffset] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [canDrag, setCanDrag] = React.useState(false)
  const internalRef = React.useRef<HTMLDivElement>(null)
  const contentRef = (ref as React.RefObject<HTMLDivElement>) || internalRef

  // Detectar se está em mobile
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return

    const touch = e.touches[0]
    const target = e.target as HTMLElement

    // Verificar se o toque começou em um elemento com scroll ou dentro dele
    let element: HTMLElement | null = target
    let scrollableElement: HTMLElement | null = null

    // Percorrer toda a árvore DOM até o contentRef
    while (element && element !== contentRef.current) {
      const style = window.getComputedStyle(element)
      const hasOverflow = style.overflowY === 'auto' || style.overflowY === 'scroll' ||
                          style.overflow === 'auto' || style.overflow === 'scroll'
      const canScroll = element.scrollHeight > element.clientHeight

      if (hasOverflow && canScroll) {
        scrollableElement = element
        break
      }

      // Verificar também classes que indicam scroll
      if (element.classList.contains('overflow-y-auto') ||
          element.classList.contains('overflow-auto') ||
          element.classList.contains('scrollbar-thin')) {
        scrollableElement = element
        break
      }

      element = element.parentElement
    }

    // Se encontrou elemento scrollável, NUNCA permitir drag
    if (scrollableElement) {
      setCanDrag(false)
      setDragStart(null)
      setDragOffset(0)
      return
    }

    // Permitir drag apenas no header ou áreas não scrolláveis
    setCanDrag(true)
    setDragStart(touch.clientY)
    setIsDragging(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || dragStart === null || !canDrag) return

    const touch = e.touches[0]
    const diff = touch.clientY - dragStart

    // Tolerância MUITO maior - 30 pixels antes de começar a arrastar
    const DRAG_THRESHOLD = 30

    // Só permite drag se mover significativamente para baixo
    if (diff > DRAG_THRESHOLD) {
      // Começar o drag apenas após ultrapassar a tolerância
      if (!isDragging) {
        setIsDragging(true)
      }
      setDragOffset(diff - DRAG_THRESHOLD)
    } else if (diff < -20) {
      // Se arrastar para cima, resetar
      setDragOffset(0)
      setIsDragging(false)
    }
  }

  const handleTouchEnd = () => {
    if (!isMobile || dragStart === null) return

    const threshold = 250 // pixels para fechar (aumentado para 250)

    if (isDragging && dragOffset > threshold) {
      // Fecha o sheet usando o botão de fechar
      const closeButton = contentRef.current?.querySelector('[data-close-button]') as HTMLButtonElement
      closeButton?.click()
    }

    // Reset
    setDragStart(null)
    setDragOffset(0)
    setIsDragging(false)
    setCanDrag(false)
  }

  return (
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-mobile={isMobile ? 'true' : undefined}
        data-desktop={!isMobile ? 'true' : undefined}
        className={cn(
          // Base styles - Preto absoluto com sombra sutil
          'fixed z-50 flex w-full flex-col gap-4 bg-[#000000] focus:outline-none',
          'shadow-[0_0_20px_rgba(255,255,255,0.03)]',
          // Desktop: dialog centralizado
          'sm:left-[50%] sm:top-[50%] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:border-[#1f1f1f] sm:p-6',
          // Mobile: bottom sheet - fixo na parte inferior, sem gap padrão
          'max-sm:left-0 max-sm:right-0 max-sm:max-h-[90vh] max-sm:rounded-t-2xl max-sm:border-t max-sm:border-[#1f1f1f] max-sm:gap-0',
          // Posicionar de forma que cubra a safe area com background do conteúdo
          'max-sm:bottom-0',
          // PWA: Safe area padding no mobile
          'max-sm:pb-[env(safe-area-inset-bottom)]',
          // Animações
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
          'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
          'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
          // Drag transition suave
          isDragging ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          className
        )}
        style={{
          transform: isMobile && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        }}
        {...props}
      >
        {/* Mobile: Handle de arraste + botão fechar */}
        {isMobile && (
          <>
            {showHandle && (
              <div className="flex items-center justify-center py-3 sm:hidden animate-handle bg-inherit">
                <div className="h-1.5 w-12 rounded-full bg-[#2a2a2a] transition-all duration-300 hover:bg-[#3a3a3a] active:w-16 active:bg-[#ffcc00]" />
              </div>
            )}
            <DialogPrimitive.Close
              data-close-button
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] text-white shadow-[0_0_20px_rgba(255,255,255,0.03)] backdrop-blur-sm transition-all duration-200 hover:bg-[#111111] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] focus:ring-offset-2 focus:ring-offset-black active:scale-95 disabled:pointer-events-none sm:hidden animate-close-button"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </>
        )}

        {/* Desktop: Botão fechar */}
        {!isMobile && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-white opacity-70 ring-offset-black transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#ffcc00] focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-[#0d0d0d]">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}

        {children}
      </DialogPrimitive.Content>
    </BottomSheetPortal>
  )
})
BottomSheetContent.displayName = DialogPrimitive.Content.displayName

const BottomSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 px-6 pb-4 pt-2 text-center sm:text-left', className)} {...props} />
)
BottomSheetHeader.displayName = 'BottomSheetHeader'

const BottomSheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
BottomSheetFooter.displayName = 'BottomSheetFooter'

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
    {...props}
  />
))
BottomSheetTitle.displayName = DialogPrimitive.Title.displayName

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-zinc-400', className)} {...props} />
))
BottomSheetDescription.displayName = DialogPrimitive.Description.displayName

export {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
}
