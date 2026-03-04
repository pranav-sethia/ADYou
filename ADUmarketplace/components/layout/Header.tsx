"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Home, Key, LogOut } from 'lucide-react'
import { AuthModal } from '@/components/auth/AuthModal'

const LogoMark = () => (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform scale-110">
        <defs>
            <linearGradient id="foldLeft" x1="0%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#86D684" />
                <stop offset="100%" stopColor="#55A65E" />
            </linearGradient>
            <linearGradient id="foldRight" x1="50%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#71C170" />
                <stop offset="100%" stopColor="#437755" />
            </linearGradient>
            <linearGradient id="foldCenter" x1="20%" y1="100%" x2="80%" y2="0%">
                <stop offset="0%" stopColor="#6BC46D" />
                <stop offset="100%" stopColor="#8EE08D" />
            </linearGradient>
        </defs>

        {/* Left side ribbon */}
        <path d="M 16 85 V 42 L 50 12 L 62 20 L 46 32 L 32 45 V 85 Z" fill="url(#foldLeft)" />

        {/* Right side ribbon with sweeping bottom curve */}
        <path d="M 62 20 L 88 38 V 75 C 88 78, 80 88, 55 85 V 72 C 70 73, 74 65, 74 55 V 47 L 46 32 Z" fill="url(#foldRight)" />

        {/* Center ADU geometric 'L' shape block */}
        <path d="M 40 85 V 55 H 60 V 68 H 50 V 85 Z" fill="url(#foldCenter)" />
    </svg>
)

import { useState } from 'react'

export function Header() {
    const { user, isLoggedIn, logout } = useAuth()
    const pathname = usePathname()
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin')

    const openAuthModal = (tab: 'signin' | 'signup') => {
        setAuthModalTab(tab)
        setIsAuthModalOpen(true)
    }

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
                            <div className="flex items-center justify-center group-hover:bg-brand-50 transition-colors p-1 rounded-lg">
                                <LogoMark />
                            </div>
                            <span className="font-extrabold text-2xl tracking-tighter text-surface-900 group-hover:text-brand-600 transition-colors font-[family-name:var(--font-outfit)] leading-none mt-1">
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
                                <Button variant="ghost" className="hidden md:flex text-surface-600 hover:text-surface-900 font-semibold rounded-lg px-4" onClick={() => openAuthModal('signin')}>
                                    Sign In
                                </Button>
                                <Button className="bg-brand-600 hover:bg-brand-700 text-surface-0 font-semibold rounded-lg shadow-sm border border-brand-700/50" onClick={() => openAuthModal('signup')}>
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

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultTab={authModalTab} />
        </>
    )
}
