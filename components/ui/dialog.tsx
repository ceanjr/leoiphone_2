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
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
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
    setDragStart(touch.clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || dragStart === null || !isDragging) return

    const touch = e.touches[0]
    const diff = touch.clientY - dragStart

    // Apenas permite arrastar para baixo
    if (diff > 0) {
      setDragOffset(diff)
    }
  }

  const handleTouchEnd = () => {
    if (!isMobile || dragStart === null) return

    const threshold = 150 // pixels para fechar

    if (dragOffset > threshold) {
      // Fecha o dialog usando o botão de fechar
      const closeButton = contentRef.current?.querySelector('[data-close-button]') as HTMLButtonElement
      closeButton?.click()
    }

    // Reset
    setDragStart(null)
    setDragOffset(0)
    setIsDragging(false)
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
          'fixed z-50 flex w-full flex-col gap-4 bg-zinc-950 text-white shadow-lg focus:outline-none',
          // Desktop: dialog centralizado
          'sm:left-1/2 sm:top-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:border-zinc-800 sm:p-6',
          'sm:max-h-[calc(100vh-2rem)]',
          // Mobile: bottom sheet
          'max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[90vh] max-sm:rounded-t-2xl max-sm:border-t max-sm:border-zinc-800 max-sm:shadow-[0_-4px_60px_rgba(0,0,0,0.8)]',
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
            <div className="h-1.5 w-12 rounded-full bg-zinc-700 transition-all duration-300 hover:bg-zinc-600 active:w-16 active:bg-zinc-500" />
          </div>
        )}

        {children}

        {/* Botão fechar */}
        <DialogPrimitive.Close
          data-close-button
          className="ring-offset-background absolute top-3 right-3 z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/80 text-zinc-100 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-zinc-700 hover:text-white hover:scale-110 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none active:scale-95 disabled:pointer-events-none animate-close-button"
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
