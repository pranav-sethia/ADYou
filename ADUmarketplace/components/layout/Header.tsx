"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Home, Key, LogOut } from 'lucide-react'
import { AuthModal } from '@/components/auth/AuthModal'

// Simple SVG Logo Mark
const LogoMark = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-600">
        <path d="M12 3L20 10V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V10L12 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

import { useState } from 'react'

export function Header() {
    const { user, isLoggedIn, logout } = useAuth()
    const pathname = usePathname()
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

    // Clean active state logic
    const isMarketplaceActive = pathname === '/marketplace' || pathname.startsWith('/marketplace/')
    const isFeasibilityActive = pathname === '/feasibility' || pathname === '/onboarding' || pathname === '/map'

    return (
        <>
            <header className="sticky top-0 z-50 w-full h-16 bg-surface-0 border-b border-surface-200 shadow-sm transition-all duration-200">
                <div className="container h-full mx-auto px-4 flex items-center justify-between">

                    {/* Logo and Main Nav */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="flex items-center justify-center p-1.5 bg-brand-50 rounded-lg group-hover:bg-brand-100 transition-colors">
                                <LogoMark />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-surface-900 group-hover:text-brand-600 transition-colors">
                                ADYou
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            <Link
                                href="/marketplace"
                                className={`font-semibold text-sm transition-colors ${isMarketplaceActive ? 'text-brand-600 border-b-2 border-brand-600 pb-[22px] -mb-[24px]' : 'text-surface-600 hover:text-surface-900 border-b-2 border-transparent pb-[22px] -mb-[24px] hover:border-surface-300'}`}
                            >
                                Browse ADUs
                            </Link>
                            <Link
                                href="/map"
                                className={`font-semibold text-sm transition-colors ${isFeasibilityActive ? 'text-brand-600 border-b-2 border-brand-600 pb-[22px] -mb-[24px]' : 'text-surface-600 hover:text-surface-900 border-b-2 border-transparent pb-[22px] -mb-[24px] hover:border-surface-300'}`}
                            >
                                Check My Lot
                            </Link>
                        </nav>
                    </div>

                    {/* Right Nav / Auth Controls */}
                    <div className="flex items-center gap-3">
                        {!isLoggedIn ? (
                            <>
                                <Button variant="ghost" className="hidden md:flex text-surface-600 hover:text-surface-900 font-semibold rounded-lg px-4" onClick={() => setIsAuthModalOpen(true)}>
                                    Sign In
                                </Button>
                                <Button className="bg-brand-600 hover:bg-brand-700 text-surface-0 font-semibold rounded-lg shadow-sm border border-brand-700/50" onClick={() => setIsAuthModalOpen(true)}>
                                    Get Started
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Button asChild variant="ghost" className="text-surface-600 hover:text-surface-900 font-semibold hidden md:flex">
                                    <Link href="/dashboard/saved">Saved Homes</Link>
                                </Button>
                                <Button asChild variant="ghost" className="text-surface-600 hover:text-surface-900 font-semibold hidden md:flex">
                                    <Link href="/dashboard/listings">My Projects</Link>
                                </Button>

                                <div className="h-8 w-px bg-surface-200 hidden md:block"></div>

                                <div
                                    className="flex items-center gap-3 p-1 rounded-full border border-surface-200 bg-surface-50 pr-4 hover:border-surface-300 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer group"
                                    onClick={() => logout()}
                                >
                                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shadow-sm border border-brand-200/50 overflow-hidden">
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Home className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="hidden sm:flex flex-col">
                                        <span className="text-xs font-bold text-surface-900 leading-tight">
                                            {user?.name || 'User'}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-surface-500 tracking-wider leading-tight group-hover:text-red-500 transition-colors">
                                            Logout
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    )
}
