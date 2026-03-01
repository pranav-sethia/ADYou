"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const FeasibilityForm = dynamic(
    () => import('@/components/feasibility/FeasibilityForm').then(mod => mod.FeasibilityForm),
    { ssr: false }
)
import { FeasibilityReport } from '@/components/feasibility/FeasibilityReport'
import { MOCK_FEASIBILITY_REPORT } from '@/lib/mock/feasibility'

export default function FeasibilityPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [report, setReport] = useState<any>(null)

    const handleCheck = (coords: string, name: string) => {
        setIsLoading(true)

        const [lat, lng] = coords.split(',')
        router.push(`/map?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}`)
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <main className="flex-1">
                {/* Header Section */}
                <section className={`pt-20 md:pt-32 pb-16 px-4 transition-all duration-700 ${report ? 'bg-slate-900 text-white' : 'bg-emerald-900 text-white'}`}>
                    <div className="container mx-auto text-center max-w-4xl relative z-10">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Check Your ADU Potential
                        </h1>
                        <p className={`text-xl md:text-2xl mb-12 max-w-2xl mx-auto ${report ? 'text-slate-400' : 'text-emerald-100'}`}>
                            Type your address to instantly see if you can build an ADU, what it might cost, and your projected rental income.
                        </p>

                        <div className="relative -mb-28 z-20">
                            <FeasibilityForm onSubmit={handleCheck} isLoading={isLoading} />
                        </div>
                    </div>

                    {/* Decorative background shapes */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/10 blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-emerald-700/20 blur-[100px] rounded-full" />
                    </div>
                </section>

                {/* Results Section */}
                <section className={`pt-40 pb-24 px-4 min-h-[500px] ${!report && !isLoading ? 'bg-white' : 'bg-slate-50'}`}>
                    <div className="container mx-auto">
                        {isLoading && (
                            <div className="text-center py-20 animate-pulse">
                                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                                <h3 className="text-xl font-semibold text-slate-700 mb-2">Analyzing parcel data...</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Checking zoning regulations, lot size requirements, and running rental comparables.</p>
                            </div>
                        )}

                        {!isLoading && report && (
                            <FeasibilityReport report={report} />
                        )}

                        {!isLoading && !report && (
                            <div className="text-center py-20 max-w-2xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-8">
                                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Why check feasibility?</h3>
                                        <ul className="space-y-4 text-slate-600">
                                            <li className="flex gap-3">
                                                <span className="text-emerald-500 shrink-0">✓</span>
                                                <span>Discover if your specific lot meets tricky local setbacks and size requirements.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="text-emerald-500 shrink-0">✓</span>
                                                <span>Get realistic construction cost estimates for your area.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="text-emerald-500 shrink-0">✓</span>
                                                <span>See data-backed rental projections based on active listings nearby.</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-square md:aspect-auto">
                                        <img
                                            src="https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800"
                                            alt="House blueprint and model"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                            <span className="text-white font-medium text-lg leading-snug">Turn your backyard into an income-generating asset.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
