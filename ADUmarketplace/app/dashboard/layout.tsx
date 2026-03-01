import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <div className="flex-1 flex container mx-auto px-4 max-w-7xl">
                <main className="flex-1 py-8 min-w-0">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    )
}
