export type AduType = 'detached' | 'attached' | 'garage_conversion' | 'junior_adu' | 'above_garage' | 'basement' | 'jadu'

export type PermitStatus = 'verified' | 'unverified' | 'pending'

export type ListingStatus = 'draft' | 'published' | 'archived' | 'report'

export interface Listing {
    id: string
    status: ListingStatus
    aduType: AduType
    address: string
    city: string
    state: string
    zipCode: string
    neighborhood?: string
    lat?: number
    lng?: number
    bedrooms: number
    bathrooms: number
    sqft: number
    monthlyRent: number
    availableDate: string
    privateEntrance: boolean
    inUnitLaundry: boolean
    parkingIncluded: boolean
    petsAllowed?: boolean
    utilitiesIncluded: ('water' | 'trash' | 'electric' | 'electricity' | 'gas' | 'internet')[]
    amenities?: string[]
    permitStatus: PermitStatus
    permitNumber?: string
    heroImage: string
    images: string[]
    sellerId: string
    sellerName: string
    createdAt: string
    updatedAt?: string
    viewCount: number
    saveCount: number
    seoTitle: string
    description: string
}
