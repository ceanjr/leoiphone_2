import { Phone } from 'lucide-react'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 min-h-[120px]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {/* Contato */}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-zinc-400 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4" />
            <span>Entre em contato pelo WhatsApp</span>
          </a>

          {/* Copyright */}
          <p className="text-sm text-zinc-500">
            {currentYear} LéoiPhone. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
