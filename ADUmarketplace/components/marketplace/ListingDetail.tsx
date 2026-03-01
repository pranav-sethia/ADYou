import { Listing } from '@/lib/types/listing'
import Image from 'next/image'
import { formatCurrency, formatSqft, formatDateString } from '@/lib/utils/formatting'
import { AduTypeBadge } from './AduTypeBadge'
import { PermitBadge } from './PermitBadge'
import { SaveButton } from './SaveButton'
import { Button } from '@/components/ui/button'
import { MapPin, Key, Wifi, Droplet, Car, Trash2, Home } from 'lucide-react'

interface ListingDetailProps {
    listing: Listing
}

export function ListingDetail({ listing }: ListingDetailProps) {
    return (
        <div className="bg-white min-h-screen">
            {/* Image Gallery */}
            <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-100">
                <Image
                    src={listing.heroImage}
                    alt={listing.seoTitle}
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Sticky Stats Bar */}
            <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-sm py-4">
                <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 md:gap-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                            {formatCurrency(listing.monthlyRent)}<span className="text-base font-normal text-slate-500">/mo</span>
                        </h2>
                        <div className="hidden sm:flex items-center gap-4 text-slate-700 font-medium border-l border-slate-200 pl-4 md:pl-8">
                            <span>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}</span>
                            <span>{listing.bathrooms} bath</span>
                            <span>{formatSqft(listing.sqft)}</span>
                        </div>
                        <div className="flex gap-2">
                            <AduTypeBadge type={listing.aduType} />
                            <PermitBadge status={listing.permitStatus} showIcon />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <SaveButton listingId={listing.id} className="bg-white hidden sm:flex" />
                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">Contact Landlord</Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Main Content (Left 65%) */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h1 className="text-3xl font-bold text-slate-900 mb-4">{listing.seoTitle}</h1>
                            <div className="flex items-center gap-2 text-slate-600 mb-6">
                                <MapPin className="h-5 w-5 text-slate-400" />
                                <span>{listing.address}, {listing.city}, {listing.state} {listing.zipCode}</span>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-700">
                                <p className="text-lg leading-relaxed">{listing.description}</p>
                            </div>
                        </section>

                        <hr className="border-slate-200" />

                        <section>
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Amenities & Features</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                {listing.privateEntrance && (
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <Key className="h-5 w-5 text-emerald-600" />
                                        <span>Private Entrance</span>
                                    </div>
                                )}
                                {listing.inUnitLaundry && (
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <Home className="h-5 w-5 text-emerald-600" />
                                        <span>In-Unit Laundry</span>
                                    </div>
                                )}
                                {listing.parkingIncluded && (
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <Car className="h-5 w-5 text-emerald-600" />
                                        <span>Parking Included</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        <hr className="border-slate-200" />

                        <section>
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Utilities Included</h3>
                            {listing.utilitiesIncluded.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {listing.utilitiesIncluded.includes('water') && (
                                        <Badge variant="secondary" className="px-4 py-2 bg-blue-50 text-blue-700"><Droplet className="mr-2 h-4 w-4" /> Water</Badge>
                                    )}
                                    {listing.utilitiesIncluded.includes('trash') && (
                                        <Badge variant="secondary" className="px-4 py-2 bg-slate-100 text-slate-700"><Trash2 className="mr-2 h-4 w-4" /> Trash</Badge>
                                    )}
                                    {listing.utilitiesIncluded.includes('internet') && (
                                        <Badge variant="secondary" className="px-4 py-2 bg-indigo-50 text-indigo-700"><Wifi className="mr-2 h-4 w-4" /> Internet</Badge>
                                    )}
                                    {/* Additional utilities can be rendered similarly */}
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">Tenant is responsible for all utilities.</p>
                            )}
                        </section>
                    </div>

                    {/* Right Sidebar (35%) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-40 space-y-6">
                            <div className="bg-white border text-center border-slate-200 rounded-xl p-6 shadow-sm">
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Available On</p>
                                <p className="text-2xl font-bold text-slate-900">{formatDateString(listing.availableDate)}</p>
                                <p className="text-sm text-slate-500 mt-4">Listed by {listing.sellerName}</p>
                                <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white" size="lg">Request Tour</Button>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
                                <h4 className="font-semibold text-emerald-900 mb-2">Own a property nearby?</h4>
                                <p className="text-emerald-700 text-sm mb-4">See if your backyard qualifies for an ADU and how much it could earn.</p>
                                <Button variant="outline" className="w-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100" asChild>
                                    <a href="/feasibility">Check ADU Feasibility &rarr;</a>
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

import { Badge } from '@/components/ui/badge'
