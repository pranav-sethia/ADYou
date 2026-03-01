"use client"

import { useAuth } from '@/lib/hooks/useAuth'
import { useListings } from '@/lib/hooks/useListings'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { ListingTable } from '@/components/dashboard/ListingTable'
import { Button } from '@/components/ui/button'
import { PlusCircle, Home, Eye, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default function SellerListingsPage() {
    const { isSeller, user } = useAuth()
    const { getListingsBySeller } = useListings()

    if (!user) {
        return notFound()
    }

    const myListings = getListingsBySeller(user.id)
    const totalViews = myListings.reduce((sum, l) => sum + l.viewCount, 0)
    const totalSaves = myListings.reduce((sum, l) => sum + l.saveCount, 0)

    const stats = [
        { label: 'Total Listings', value: myListings.length, icon: Home },
        { label: 'Total Views', value: totalViews, icon: Eye, trend: '+12%', trendUp: true },
        { label: 'Saves / Inquiries', value: totalSaves, icon: MessageSquare }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Listings</h1>
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

            <ListingTable listings={myListings} />
        </div>
    )
}
