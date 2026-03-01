"use client"

import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardIndex() {
    const { isLoggedIn, isSeller } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoggedIn) {
            router.replace('/onboarding')
        } else if (isSeller) {
            router.replace('/dashboard/listings')
        } else {
            router.replace('/dashboard/saved')
        }
    }, [isLoggedIn, isSeller, router])

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse flex items-center gap-2 text-slate-500">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                Loading dashboard...
            </div>
        </div>
    )
}
