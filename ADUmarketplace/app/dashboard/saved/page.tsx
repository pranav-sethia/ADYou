"use client"

import { useAuth } from '@/lib/hooks/useAuth'
import { useSaved } from '@/lib/context/SavedContext'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { SavedListingsGrid } from '@/components/dashboard/SavedListingsGrid'
import { Heart, Search, BellRing } from 'lucide-react'
import { notFound } from 'next/navigation'
import { MOCK_LISTINGS } from '@/lib/mock/listings'

export default function BuyerSavedPage() {
    const { isBuyer } = useAuth()
    const { savedListings } = useSaved()

    if (!isBuyer) {
        return notFound()
    }

    // Map saved IDs to actual full listing objects
    const savedListingsData = savedListings
        .map(id => MOCK_LISTINGS.find(l => l.id === id))
        .filter(l => l !== undefined)

    const stats = [
        { label: 'Saved ADUs', value: savedListings.length, icon: Heart },
        { label: 'New Matches', value: '12', icon: Search, trend: 'This week' },
        { label: 'Price Alerts', value: '3', icon: BellRing }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Saved ADUs</h1>
                <p className="text-slate-500 mt-1">Keep track of your favorite properties and price changes.</p>
            </div>

            <StatsBar stats={stats} />

            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <SavedListingsGrid listings={savedListingsData as any} />
            </div>
        </div>
    )
}
