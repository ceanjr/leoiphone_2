import { Sidebar } from '@/components/admin/sidebar'
import { AdminMobileNav } from '@/components/admin/mobile-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black lg:flex-row lg:overflow-hidden">
      <AdminMobileNav />
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  )
}
