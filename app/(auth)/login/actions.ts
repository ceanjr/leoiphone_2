'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Validar dados
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedData = loginSchema.safeParse(data)

  if (!validatedData.success) {
    const firstError = validatedData.error.issues[0]?.message
    return {
      error: firstError || 'Dados inválidos',
    }
  }

  // Fazer login
  const { error } = await supabase.auth.signInWithPassword(validatedData.data)

  if (error) {
    return {
      error: 'Email ou senha inválidos',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/admin/dashboard')
}

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      error: 'Erro ao fazer logout',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
