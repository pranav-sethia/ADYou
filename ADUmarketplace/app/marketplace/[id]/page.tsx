import { MOCK_LISTINGS } from '@/lib/mock/listings'
import { ListingDetail } from '@/components/marketplace/ListingDetail'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
    return MOCK_LISTINGS.map((listing) => ({
        id: listing.id,
    }))
}

export default function ListingPage({ params }: { params: { id: string } }) {
    const listing = MOCK_LISTINGS.find((l) => l.id === params.id)

    if (!listing) {
        notFound()
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1">
                <ListingDetail listing={listing} />
            </main>
            <Footer />
        </div>
    )
}
