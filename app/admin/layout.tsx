import { Sidebar } from '@/components/admin/sidebar'
import { AdminMobileNav } from '@/components/admin/mobile-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black lg:flex-row">
      <AdminMobileNav />
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
