import { Phone } from 'lucide-react'
import { WhatsAppContactButton } from '@/components/shared/whatsapp-contact-button'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="container mx-auto px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {/* Copyright */}
          <p className="text-sm text-zinc-500">
            © {currentYear} Léo iPhone. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
