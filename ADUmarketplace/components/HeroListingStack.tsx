"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

type MockListing = {
    id: string
    image: string
    price: string
    type: string
    beds: number
    baths: number
    sqft: number
    verified: boolean
}

const LISTINGS: MockListing[] = [
    {
        id: "1",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",
        price: "$2,600",
        type: "Detached",
        beds: 1,
        baths: 1,
        sqft: 520,
        verified: true
    },
    {
        id: "2",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
        price: "$3,100",
        type: "Attached",
        beds: 2,
        baths: 1,
        sqft: 750,
        verified: true
    },
    {
        id: "3",
        image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
        price: "$1,950",
        type: "Garage Conv.",
        beds: 0,
        baths: 1,
        sqft: 400,
        verified: false
    }
]

export function HeroListingStack() {
    const [activeIndex, setActiveIndex] = useState(0)

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault()
        setActiveIndex((current) => (current + 1) % LISTINGS.length)
    }

    return (
        <div className="relative h-[450px] w-[380px] hidden lg:block select-none cursor-pointer" onClick={handleNext}>
            {LISTINGS.map((listing, i) => {
                // Calculate position offest based on active index
                const diff = (i - activeIndex + LISTINGS.length) % LISTINGS.length

                // Styling logic based on position in stack
                let zIndex = 20
                let transform = ""
                let opacity = 1

                if (diff === 0) {
                    // Front card
                    zIndex = 30
                    transform = "translateY(0px) scale(1) rotate(0deg)"
                    opacity = 1
                } else if (diff === 1) {
                    // Second card
                    zIndex = 20
                    transform = "translateY(-40px) scale(0.95) rotate(-3deg)"
                    opacity = 0.8
                } else {
                    // Third card
                    zIndex = 10
                    transform = "translateY(-80px) scale(0.90) rotate(4deg)"
                    opacity = 0.6
                }

                return (
                    <div
                        key={listing.id}
                        className="absolute top-0 left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-5 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                        style={{
                            zIndex,
                            transform,
                            opacity,
                            transformOrigin: "bottom center"
                        }}
                    >
                        <div className="aspect-[4/3] bg-emerald-50 rounded-xl mb-4 relative overflow-hidden">
                            <img src={listing.image} alt="ADU Listing" className="w-full h-full object-cover" />
                            {listing.verified && (
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold text-slate-700">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Permit
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="text-2xl font-bold text-slate-900">{listing.price}<span className="text-sm text-slate-500 font-normal">/mo</span></h3>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">{listing.type}</span>
                        </div>
                        <p className="text-slate-500 text-sm mb-4">{listing.beds > 0 ? `${listing.beds} bed` : 'Studio'} • {listing.baths} bath • {listing.sqft} sqft</p>

                        <div className="w-full py-2 bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-colors text-center border border-slate-100">
                            {diff === 0 ? "Click to cycle" : "View"}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
