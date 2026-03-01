"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MOCK_LISTINGS } from '@/lib/mock/listings'
import { useAuth } from '@/lib/hooks/useAuth'

function generateId() {
    return Math.random().toString(36).substring(2, 12);
}

export default function NewListingPage() {
    const router = useRouter()
    const { user } = useAuth()

    const [formData, setFormData] = useState({
        address: '',
        city: '',
        zipCode: '',
        description: '',
        monthlyRent: '',
        bedrooms: '1',
        bathrooms: '1',
        sqft: '',
        availableDate: new Date().toISOString().split('T')[0],
        privateEntrance: true,
        inUnitLaundry: true,
        parkingIncluded: true,
    })

    useEffect(() => {
        const draftData = sessionStorage.getItem("draft-listing-data")
        if (draftData) {
            try {
                const parsed = JSON.parse(draftData)
                setFormData(prev => ({
                    ...prev,
                    address: parsed.address || prev.address,
                    city: parsed.city || prev.city,
                    zipCode: parsed.zipCode || prev.zipCode,
                    description: parsed.description || prev.description,
                    monthlyRent: parsed.monthlyRent ? String(parsed.monthlyRent) : prev.monthlyRent,
                    bedrooms: parsed.bedrooms ? String(parsed.bedrooms) : prev.bedrooms,
                    bathrooms: parsed.bathrooms ? String(parsed.bathrooms) : prev.bathrooms,
                    sqft: parsed.sqft ? String(parsed.sqft) : prev.sqft,
                }))
                sessionStorage.removeItem("draft-listing-data")
            } catch (e) {
                console.error("Failed to parse draft listing data from session", e)
            }
        }
    }, [])

    const handleCreate = (status: 'published' | 'draft') => {
        // Basic required field validation check since we bypassed native form submit
        if (!formData.address || !formData.city || !formData.zipCode || !formData.description) {
            alert("Please fill in all required text fields before saving.")
            return
        }

        const newListing = {
            id: generateId(),
            status,
            aduType: 'detached' as const,
            address: formData.address || 'New ADU',
            city: formData.city || 'Irvine',
            state: 'CA',
            zipCode: formData.zipCode || '92612',
            bedrooms: parseInt(formData.bedrooms) || 1,
            bathrooms: parseInt(formData.bathrooms) || 1,
            sqft: parseInt(formData.sqft) || 500,
            monthlyRent: parseInt(formData.monthlyRent) || 2500,
            availableDate: new Date(formData.availableDate).toISOString(),
            privateEntrance: formData.privateEntrance,
            inUnitLaundry: formData.inUnitLaundry,
            parkingIncluded: formData.parkingIncluded,
            utilitiesIncluded: ['water' as const, 'trash' as const],
            permitStatus: 'verified' as const,
            heroImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070',
            images: [],
            sellerId: user?.id || 'current-user',
            sellerName: user?.name || 'You',
            createdAt: new Date().toISOString(),
            viewCount: 0,
            saveCount: 0,
            seoTitle: formData.address || 'Brand New ADU',
            description: formData.description || 'A beautiful, newly built Accessory Dwelling Unit available for rent.',
        }

        MOCK_LISTINGS.unshift(newListing)
        router.push('/dashboard/listings')
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Listing</h1>
                <p className="text-slate-500 mt-2">Fill out the details below to publish your ADU to the marketplace.</p>
            </div>

            <form onSubmit={e => e.preventDefault()} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">

                {/* Location Details */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900">Location</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Street Address</label>
                            <input required type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="123 Main St" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">City</label>
                            <input required type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Irvine" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Zip Code</label>
                            <input required type="text" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="92612" />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Property Details */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900">Property Details</h2>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Description</label>
                        <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Describe your beautiful ADU..." />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Bedrooms</label>
                            <input required type="number" min="0" value={formData.bedrooms} onChange={e => setFormData({ ...formData, bedrooms: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Bathrooms</label>
                            <input required type="number" min="0" step="0.5" value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Sqft</label>
                            <input required type="number" min="0" value={formData.sqft} onChange={e => setFormData({ ...formData, sqft: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Monthly Rent ($)</label>
                            <input required type="number" min="0" value={formData.monthlyRent} onChange={e => setFormData({ ...formData, monthlyRent: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="2500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Available Date</label>
                            <input required type="date" value={formData.availableDate} onChange={e => setFormData({ ...formData, availableDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Amenities */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900">Amenities</h2>
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={formData.privateEntrance} onChange={e => setFormData({ ...formData, privateEntrance: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-slate-700 font-medium">Private Entrance</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={formData.inUnitLaundry} onChange={e => setFormData({ ...formData, inUnitLaundry: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-slate-700 font-medium">In-Unit Laundry</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={formData.parkingIncluded} onChange={e => setFormData({ ...formData, parkingIncluded: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-slate-700 font-medium">Dedicated Parking</span>
                        </label>
                    </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <Button
                        type="button"
                        onClick={() => handleCreate('draft')}
                        size="lg"
                        variant="outline"
                        className="flex-1 shadow-sm text-lg h-14 font-bold text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
                    >
                        Save as Draft
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleCreate('published')}
                        size="lg"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-lg h-14 font-bold"
                    >
                        Publish Listing
                    </Button>
                </div>
            </form>
        </div>
    )
}
