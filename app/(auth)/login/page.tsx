'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useFormStatus } from 'react-dom'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="flex w-full cursor-pointer items-center justify-center font-semibold"
      disabled={pending}
      style={{
        backgroundColor: 'var(--brand-yellow)',
        color: 'var(--brand-black)',
      }}
    >
      {pending ? (
        <span className="relative inline-flex items-center">
          <div className="absolute top-1/2 -left-6 -translate-y-1/2">
            <div className="relative h-4 w-4 animate-pulse">
              <Image
                src="/icons/loading.svg"
                alt="Carregando"
                fill
                className="object-contain opacity-40 brightness-150 grayscale"
                sizes="16px"
                style={{ filter: 'invert(0.8)' }}
              />
            </div>
          </div>
          Entrando...
        </span>
      ) : (
        <span className="relative inline-flex items-center">
          <KeyRound className="absolute top-1/2 -left-7 h-4 w-4 -translate-y-1/2" />
          Entrar
        </span>
      )}
    </Button>
  )
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      toast.error('Erro ao fazer login', {
        description: result.error,
        duration: 4000,
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative h-20 w-20">
              <Image
                src="/images/logo.png"
                alt="Léo iPhone"
                fill
                className="object-contain"
                sizes="80px"
                priority
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Léo iPhone</CardTitle>
          <CardDescription className="text-zinc-400">
            Área administrativa do catálogo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-200">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="focus-visible:ring-primary border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-200">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="focus-visible:ring-primary border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <SubmitButton />
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            Acesso restrito à administração
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
