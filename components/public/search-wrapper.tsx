'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

export function SearchWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  return <>{children}</>
}

export function SearchSuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Loading search...</div>}>{children}</Suspense>
}
