import { Listing } from '@/lib/types/listing'
import { formatCurrency, formatDateString } from '@/lib/utils/formatting'
import { Eye, Edit, Trash2, ExternalLink, MoreVertical, LayoutDashboard, Copy, PlayCircle, Heart, Home, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

interface ListingTableProps {
    listings: Listing[]
    onDelete?: (id: string) => void
}

export function ListingTable({ listings, onDelete }: ListingTableProps) {
    if (listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-50 rounded-2xl border border-surface-200 border-dashed">
                <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                    <LayoutDashboard className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">No listings yet</h3>
                <p className="text-surface-500 mb-6 max-w-sm">
                    You haven&apos;t created any ADU listings. Start by creating your first listing using our AI builder.
                </p>
                <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm">
                    <Link href="/dashboard/listings/new">Create Listing</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-surface-0 rounded-2xl border border-surface-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-surface-50 border-b border-surface-200 text-xs uppercase font-bold text-surface-500 tracking-wider">
                        <tr>
                            <th scope="col" className="px-6 py-4">Property</th>
                            <th scope="col" className="px-6 py-4">Status</th>
                            <th scope="col" className="px-6 py-4 text-right">Rent</th>
                            <th scope="col" className="px-6 py-4 text-right">Performance</th>
                            <th scope="col" className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {listings.map((listing) => (
                            <tr key={listing.id} className="hover:bg-surface-50/50 transition-colors group">
                                {/* Property Column */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-12 rounded-lg bg-surface-100 overflow-hidden relative shadow-sm border border-surface-200 shrink-0">
                                            {listing.heroImage ? (
                                                <Image src={listing.heroImage} alt={listing.address} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-surface-300">
                                                    <Home className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-surface-900 line-clamp-1">{listing.address}</div>
                                            <div className="text-xs font-medium text-surface-500 mt-0.5">
                                                {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`} • {listing.bathrooms} bath
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Status Column */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${listing.status === 'published'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : listing.status === 'report'
                                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                                            : listing.status === 'draft'
                                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                : 'bg-surface-100 text-surface-600 border-surface-200'
                                        }`}>
                                        {listing.status}
                                    </span>
                                    {listing.updatedAt && (
                                        <div className="text-[11px] font-medium text-surface-400 mt-1.5 ml-1">
                                            Updated {formatDateString(listing.updatedAt)}
                                        </div>
                                    )}
                                </td>

                                {/* Rent Column */}
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="font-bold text-surface-900">
                                        {listing.status === 'report' ? '—' : formatCurrency(listing.monthlyRent)}
                                    </div>
                                </td>

                                {/* Performance Column */}
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5 text-surface-900 font-semibold">
                                            <Eye className="w-3.5 h-3.5 text-surface-400" />
                                            {listing.viewCount}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-surface-500 text-xs font-medium">
                                            <Heart className="w-3 h-3" />
                                            {listing.saveCount} saves
                                        </div>
                                    </div>
                                </td>

                                {/* Actions Column */}
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {listing.status === 'report' ? (
                                            <Button variant="outline" size="sm" asChild className="h-8 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium">
                                                <Link href={`/report/${listing.id}`}>
                                                    <FileText className="w-3.5 h-3.5" />
                                                    View Report
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" asChild className="h-8 gap-1 border-surface-200 text-surface-700 hover:bg-surface-100 font-medium">
                                                <Link href={`/editor/${listing.id}`}>
                                                    <Edit className="w-3.5 h-3.5" />
                                                    Edit
                                                </Link>
                                            </Button>
                                        )}
                                        <div className="relative group/menu inline-block">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-surface-400 hover:text-surface-900">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                            {/* Native CSS Dropdown for simplicity in this demo */}
                                            <div className="absolute right-0 mt-1 w-48 bg-surface-0 rounded-xl shadow-lg border border-surface-200 hidden group-hover/menu:block py-1 z-10">
                                                {listing.status === 'published' && (
                                                    <Link href={`/marketplace/${listing.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 font-medium">
                                                        <ExternalLink className="w-4 h-4 text-surface-400" /> View live
                                                    </Link>
                                                )}
                                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 font-medium">
                                                    <Copy className="w-4 h-4 text-surface-400" /> Duplicate
                                                </button>
                                                {listing.status === 'archived' && (
                                                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 font-medium">
                                                        <PlayCircle className="w-4 h-4 text-surface-400" /> Republish
                                                    </button>
                                                )}
                                                <div className="h-px bg-surface-200 my-1 mx-2" />
                                                <button
                                                    onClick={() => {
                                                        if (onDelete && confirm('Are you sure you want to delete this listing?')) {
                                                            onDelete(listing.id)
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4 text-rose-500" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
