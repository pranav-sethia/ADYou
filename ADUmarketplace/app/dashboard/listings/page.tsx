"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useListings } from '@/lib/hooks/useListings'
import { MOCK_LISTINGS } from '@/lib/mock/listings'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { ListingTable } from '@/components/dashboard/ListingTable'
import { Button } from '@/components/ui/button'
import { PlusCircle, Home, Eye, MessageSquare, FileText, Globe, PenLine, Archive, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ListingStatus } from '@/lib/types/listing'

const FILTER_TABS: { label: string; value: ListingStatus | 'all'; icon: React.ElementType; color: string }[] = [
    { label: 'All Projects', value: 'all', icon: LayoutGrid, color: 'text-slate-600' },
    { label: 'Reports', value: 'report', icon: FileText, color: 'text-blue-600' },
    { label: 'Published', value: 'published', icon: Globe, color: 'text-emerald-600' },
    { label: 'Drafts', value: 'draft', icon: PenLine, color: 'text-amber-600' },
    { label: 'Archived', value: 'archived', icon: Archive, color: 'text-slate-400' },
]

export default function SellerListingsPage() {
    const { isSeller, user } = useAuth()
    const { getListingsBySeller } = useListings()
    const [, forceUpdate] = useState(0)
    const [activeFilter, setActiveFilter] = useState<ListingStatus | 'all'>('all')

    if (!user) {
        return notFound()
    }

    const allListings = getListingsBySeller(user.id)
    const filteredListings = activeFilter === 'all'
        ? allListings
        : allListings.filter(l => l.status === activeFilter)

    const totalViews = allListings.reduce((sum, l) => sum + l.viewCount, 0)
    const totalSaves = allListings.reduce((sum, l) => sum + l.saveCount, 0)

    const handleDelete = (id: string) => {
        const idx = MOCK_LISTINGS.findIndex(l => l.id === id)
        if (idx !== -1) {
            MOCK_LISTINGS.splice(idx, 1)
            sessionStorage.removeItem(`report-${id}`)
            forceUpdate(n => n + 1)
        }
    }

    // Count per status for badges
    const counts: Record<string, number> = { all: allListings.length }
    for (const l of allListings) {
        counts[l.status] = (counts[l.status] || 0) + 1
    }

    const stats = [
        { label: 'Total Listings', value: allListings.length, icon: Home },
        { label: 'Total Views', value: totalViews, icon: Eye, trend: '+12%', trendUp: true },
        { label: 'Saves / Inquiries', value: totalSaves, icon: MessageSquare }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Projects</h1>
                    <p className="text-slate-500 mt-1">Manage your ADU portfolio and view performance.</p>
                </div>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm" size="lg">
                    <Link href="/dashboard/listings/new">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Create Listing
                    </Link>
                </Button>
            </div>

            <StatsBar stats={stats} />

            <div className="flex gap-6">
                {/* Sidebar Filters */}
                <aside className="w-52 shrink-0">
                    <nav className="space-y-1 sticky top-24">
                        {FILTER_TABS.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeFilter === tab.value
                            const count = counts[tab.value] || 0
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveFilter(tab.value)}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                                        {tab.label}
                                    </span>
                                    <span className={`text-xs font-bold min-w-[20px] text-center px-1.5 py-0.5 rounded-full ${isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </nav>
                </aside>

                {/* Table */}
                <div className="flex-1 min-w-0">
                    <ListingTable listings={filteredListings} onDelete={handleDelete} />
                </div>
            </div>
        </div>
    )
}
