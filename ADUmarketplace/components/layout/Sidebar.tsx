"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import {
    Home,
    Heart,
    MessageSquare,
    Settings,
    PlusCircle,
    List,
    Building,
    ShieldCheck,
    CreditCard
} from 'lucide-react'

export function Sidebar() {
    const pathname = usePathname()
    const { authState } = useAuth()

    const isSeller = authState === 'seller'

    const SELLER_LINKS = [
        { href: '/dashboard', label: 'Overview', icon: Home },
        { href: '/dashboard/listings', label: 'My Units', icon: Building },
        { href: '/dashboard/listings/new', label: 'Create Listing', icon: PlusCircle },
        { href: '#', label: 'Messages', icon: MessageSquare },
        { href: '#', label: 'Tenant Screening', icon: ShieldCheck },
        { href: '#', label: 'Payments', icon: CreditCard },
    ]

    const BUYER_LINKS = [
        { href: '/dashboard', label: 'Overview', icon: Home },
        { href: '/dashboard/saved', label: 'Saved ADUs', icon: Heart },
        { href: '#', label: 'Applications', icon: List },
        { href: '#', label: 'Messages', icon: MessageSquare },
    ]

    const links = isSeller ? SELLER_LINKS : BUYER_LINKS

    return (
        <aside className="w-64 bg-surface-50 border-r border-surface-200 min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col h-full sticky top-16">

            <div className="mb-6 px-3">
                <h2 className="text-xs font-bold text-surface-500 uppercase tracking-widest pl-1">
                    {isSeller ? 'Management' : 'Renter Tools'}
                </h2>
            </div>

            <nav className="space-y-1 flex-1">
                {links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 font-medium ${isActive
                                    ? 'bg-surface-200 text-surface-900 font-semibold shadow-sm'
                                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                                }`}
                        >
                            <link.icon className={`w-4 h-4 ${isActive ? 'text-surface-900 group-hover:text-surface-900' : 'text-surface-400 group-hover:text-surface-600'}`} />
                            {link.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="pt-4 mt-8 border-t border-surface-200">
                <Link
                    href="#"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-surface-600 hover:bg-surface-100 hover:text-surface-900 text-sm font-medium transition-all"
                >
                    <Settings className="w-4 h-4 text-surface-400" />
                    Settings
                </Link>
            </div>
        </aside>
    )
}
