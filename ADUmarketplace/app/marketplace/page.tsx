"use client"
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ListingGrid } from '@/components/marketplace/ListingGrid'
import { FilterPanel } from '@/components/marketplace/FilterPanel'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { useListings } from '@/lib/hooks/useListings'
import { defaultFilters, FilterState } from '@/lib/utils/filters'
import { SlidersHorizontal, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MarketplacePage() {
    const [filters, setFilters] = useState<FilterState>(defaultFilters)
    const [searchQuery, setSearchQuery] = useState('')
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

    const { listings, totalCount } = useListings(filters, searchQuery)

    const handleFilterChange = (partial: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...partial }))
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <div className="flex-1 flex flex-col pt-16">
                {/* Banner */}
                <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex justify-between items-center text-sm">
                    <span className="text-emerald-800 font-medium">🏠 Ready to list your ADU? Check if your property qualifies.</span>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm px-4 py-2 h-auto text-sm transition-colors flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" strokeWidth={2.5} />
                        Create Listing
                    </Button>
                </div>

                <div className="max-w-[1600px] w-full mx-auto flex flex-1 h-[calc(100vh-104px)]">

                    {/* Desktop Filters Sidebar */}
                    <aside className="w-[320px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar hidden lg:block p-6 shrink-0">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                            <button className="text-sm text-slate-400 hover:text-slate-700" onClick={() => setFilters(defaultFilters)}>
                                Clear all
                            </button>
                        </div>
                        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
                    </aside>

                    {/* Mobile Filters Drawer */}
                    {isMobileFiltersOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 bg-white overflow-y-auto p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900">Filters</h2>
                                <Button variant="ghost" onClick={() => setIsMobileFiltersOpen(false)}>Close</Button>
                            </div>
                            <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
                            <div className="mt-8 sticky bottom-4">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" size="lg" onClick={() => setIsMobileFiltersOpen(false)}>
                                    Show {totalCount} Results
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
                        <div className="max-w-xl mb-6 flex items-center gap-2">
                            <SearchBar onSearch={setSearchQuery} />
                            <Button
                                variant="outline"
                                className="lg:hidden shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50"
                                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                            >
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                Filters
                            </Button>
                        </div>

                        <div className="flex justify-between items-end mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">{totalCount} {totalCount === 1 ? 'ADU' : 'ADUs'} available</h1>
                            <select
                                className="bg-transparent border-none text-sm font-medium text-slate-700 cursor-pointer focus:ring-0 outline-none"
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
                            >
                                <option value="newest">Newest First</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="most_viewed">Most Viewed</option>
                            </select>
                        </div>

                        <ListingGrid listings={listings} />
                    </main>

                </div>
            </div>
            {/* Omitted Footer here to keep the height 100vh calculation correct for the app layout, but typically it exists */}
        </div>
    )
}
