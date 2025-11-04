'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { Cross2Icon } from '@radix-ui/react-icons'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
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
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
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
          element.classList.contains('overflow-x-auto') ||
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

    // Tolerância de 30 pixels antes de começar a arrastar
    const DRAG_THRESHOLD = 30

    // Só permite drag se mover significativamente para baixo
    if (diff > DRAG_THRESHOLD) {
      if (!isDragging) {
        setIsDragging(true)
      }
      setDragOffset(diff - DRAG_THRESHOLD)
    } else if (diff < -20) {
      setDragOffset(0)
      setIsDragging(false)
    }
  }

  const handleTouchEnd = () => {
    if (!isMobile || dragStart === null) return

    const threshold = 250 // pixels para fechar

    if (isDragging && dragOffset > threshold) {
      // Fecha o dialog usando o botão de fechar
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
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-mobile={isMobile ? 'true' : undefined}
        data-desktop={!isMobile ? 'true' : undefined}
        className={cn(
          // Base styles
          'fixed z-50 flex w-full flex-col gap-4 bg-[#000000] text-white shadow-[0_0_20px_rgba(255,255,255,0.03)] focus:outline-none',
          // Desktop: dialog centralizado
          'sm:left-1/2 sm:top-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:border-[#1f1f1f] sm:p-6',
          'sm:max-h-[calc(100vh-2rem)]',
          // Mobile: bottom sheet - FORCE positioning
          'max-sm:!fixed max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto max-sm:!left-0 max-sm:!right-0',
          'max-sm:max-h-[90vh] max-sm:rounded-t-2xl max-sm:border-t max-sm:border-[#1f1f1f] max-sm:shadow-[0_-4px_60px_rgba(0,0,0,0.8)]',
          // PWA: Safe area padding no mobile
          'max-sm:pb-[env(safe-area-inset-bottom)]',
          // Drag transition suave
          isDragging ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          className
        )}
        style={{
          transform: isMobile && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        }}
        {...props}
      >
        {/* Mobile: Handle de arraste */}
        {isMobile && (
          <div className="flex items-center justify-center py-3 sm:hidden animate-handle">
            <div className="h-1.5 w-12 rounded-full bg-[#2a2a2a] transition-all duration-300 hover:bg-[#3a3a3a] active:w-16 active:bg-[#ffcc00]" />
          </div>
        )}

        {children}

        {/* Botão fechar */}
        <DialogPrimitive.Close
          data-close-button
          className="ring-offset-background absolute top-3 right-3 z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] text-white shadow-[0_0_20px_rgba(255,255,255,0.03)] backdrop-blur-sm transition-all duration-200 hover:bg-[#111111] hover:text-white hover:scale-110 focus:ring-2 focus:ring-[#ffcc00] focus:ring-offset-2 focus:ring-offset-black focus:outline-none active:scale-95 disabled:pointer-events-none animate-close-button"
        >
          <Cross2Icon className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg leading-none font-semibold tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
