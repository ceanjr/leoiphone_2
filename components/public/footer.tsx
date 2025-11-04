import { Phone } from 'lucide-react'
import { WhatsAppContactButton } from '@/components/shared/whatsapp-contact-button'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="container mx-auto px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {/* Contato */}
          <WhatsAppContactButton
            variant="ghost"
            className="flex items-center gap-2 text-zinc-400 hover:text-white min-h-[44px]"
            label="Entre em contato pelo WhatsApp"
          >
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>Entre em contato pelo WhatsApp</span>
            </span>
          </WhatsAppContactButton>

          {/* Copyright */}
          <p className="text-sm text-zinc-500">
            {currentYear} LéoiPhone. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
