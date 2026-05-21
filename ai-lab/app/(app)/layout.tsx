import { Sidebar } from '@/components/layout/sidebar'
import { CreditsBadge } from '@/components/ui/credits-badge'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-brand-border bg-white px-6 flex items-center justify-between flex-shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <CreditsBadge credits={0} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
