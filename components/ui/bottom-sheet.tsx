'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
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
      // Fecha o sheet usando o botão de fechar
      const closeButton = contentRef.current?.querySelector('[data-close-button]') as HTMLButtonElement
      closeButton?.click()
    }

    // Reset
    setDragStart(null)
    setDragOffset(0)
    setIsDragging(false)
  }

  return (
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          // Base styles
          'fixed z-50 flex w-full flex-col gap-4 bg-zinc-950 shadow-lg focus:outline-none',
          // Desktop: dialog centralizado
          'sm:left-[50%] sm:top-[50%] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:border-zinc-800 sm:p-6',
          // Desktop animations
          'sm:data-[state=open]:animate-in sm:data-[state=closed]:animate-out',
          'sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
          'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
          'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
          // Mobile: bottom sheet
          'max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[90vh] max-sm:rounded-t-2xl max-sm:border-t max-sm:border-zinc-800 max-sm:shadow-[0_-4px_60px_rgba(0,0,0,0.8)]',
          // Mobile animations
          'max-sm:data-[state=open]:animate-in max-sm:data-[state=closed]:animate-out',
          'max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom',
          'max-sm:duration-300',
          // Drag transition
          isDragging ? '' : 'transition-transform duration-200 ease-out',
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
              <div className="flex items-center justify-center py-3 sm:hidden">
                <div className="h-1.5 w-12 rounded-full bg-zinc-700 animate-pulse" />
              </div>
            )}
            <DialogPrimitive.Close
              data-close-button
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/80 text-zinc-100 shadow-lg backdrop-blur-sm transition-all hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95 disabled:pointer-events-none sm:hidden"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </>
        )}

        {/* Desktop: Botão fechar */}
        {!isMobile && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-zinc-950 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-zinc-800">
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
