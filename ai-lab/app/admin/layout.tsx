import type { Metadata } from 'next'

export const metadata: Metadata = { title: '后台管理 · 莱珂珍妮AI实验室' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
