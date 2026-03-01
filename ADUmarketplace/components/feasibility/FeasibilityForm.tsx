"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CITIES } from '@/lib/utils/constants'
import { SearchBox } from '@mapbox/search-js-react'
import { Search, MapPin, CheckCircle2, FileText } from 'lucide-react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

interface FeasibilityFormProps {
    onSubmit: (address: string, city: string) => void
    isLoading: boolean
}

export function FeasibilityForm({ onSubmit, isLoading }: FeasibilityFormProps) {
    const [address, setAddress] = useState('')
    const [city, setCity] = useState(CITIES[0])

    const [placeName, setPlaceName] = useState('')

    const handleRetrieve = (res: any) => {
        const feature = res?.features?.[0]
        if (!feature) return

        const [lng, lat] = feature.geometry.coordinates
        const name = feature.properties?.full_address || feature.properties?.name || "Selected Address"

        setAddress(`${lat},${lng}`)
        setPlaceName(name)
        // Auto submit when they select
        onSubmit(`${lat},${lng}`, name)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!address.trim() || !placeName) return
        onSubmit(address, placeName)
    }

    return (
        <div className="w-full max-w-3xl mx-auto drop-shadow-sm">
            <form onSubmit={handleSubmit} className="bg-white p-2 rounded-2xl flex flex-col md:flex-row gap-2 border border-slate-200 shadow-xl overflow-visible focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                <div
                    className="flex-1 relative flex items-center w-full min-w-[300px]"
                    style={{
                        // @ts-expect-error - Injecting variables for Shadow DOM penetration
                        '--mapbox-search-box-text-color': '#0f172a',
                        '--mapbox-search-box-input-text-color': '#0f172a',
                        '--mapbox-search-box-suggestion-text-color': '#0f172a',
                    }}
                >
                    <SearchBox
                        accessToken={MAPBOX_TOKEN}
                        onRetrieve={handleRetrieve}
                        placeholder="Search for your property address…"
                        options={{
                            country: "US",
                            types: "address",
                        }}
                        theme={{
                            variables: {
                                fontFamily: "inherit",
                                borderRadius: "12px",
                                boxShadow: "none",
                                border: "none",
                                colorBackground: "transparent",
                                colorBackgroundActive: "transparent",
                                colorBackgroundHover: "#f8fafc",
                                colorText: "#0f172a",
                                colorSecondary: "#64748b",
                                colorPrimary: "#10b981",
                            },
                        }}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading || !address.trim()}
                    className="h-14 font-semibold text-lg px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shrink-0 shadow-lg group"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-white animate-spin" />
                            Checking...
                        </div>
                    ) : (
                        <>
                            Check My Property <Search className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-sm px-4">
                <div className="flex flex-col items-center text-slate-600">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">Lot Analysis</h4>
                    <p>We check lot size and setbacks</p>
                </div>
                <div className="flex flex-col items-center text-slate-600">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">Zoning Rules</h4>
                    <p>Local ADU ordinances checked</p>
                </div>
                <div className="flex flex-col items-center text-slate-600">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">Instant Results</h4>
                    <p>Get eligibility in 60 seconds</p>
                </div>
            </div>
        </div>
    )
}
