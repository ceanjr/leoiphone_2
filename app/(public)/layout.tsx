import { PublicHeader } from '@/components/public/header'
import { PublicFooter } from '@/components/public/footer'
import { PageTracker } from '@/components/tracking/page-tracker'

export const dynamic = 'force-dynamic'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageTracker />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
