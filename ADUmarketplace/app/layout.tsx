import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/context/AuthContext'
import { SavedProvider } from '@/lib/context/SavedContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'ADYou | The ADU Marketplace',
    description: 'Find, List, and Finance Accessory Dwelling Units.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen bg-slate-50 flex flex-col`}>
                <AuthProvider>
                    <SavedProvider>
                        {children}
                    </SavedProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
