"use client"

import { useMemo } from 'react'
import { MOCK_LISTINGS } from '../mock/listings'
import { FilterState, filterListings, defaultFilters } from '../utils/filters'

export function useListings(filters: FilterState = defaultFilters, searchQuery: string = '') {
    const filteredListings = useMemo(() => {
        return filterListings(MOCK_LISTINGS, filters, searchQuery)
    }, [filters, searchQuery])

    const getListingById = (id: string) => {
        return MOCK_LISTINGS.find(l => l.id === id) || null
    }

    const getListingsBySeller = (sellerId: string) => {
        return MOCK_LISTINGS.filter(l => l.sellerId === sellerId)
    }

    return {
        listings: filteredListings,
        totalCount: filteredListings.length,
        allListings: MOCK_LISTINGS,
        getListingById,
        getListingsBySeller
    }
}
