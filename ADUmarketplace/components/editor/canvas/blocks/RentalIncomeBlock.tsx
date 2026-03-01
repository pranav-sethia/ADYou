import { RentalIncomeBlock as RentalIncomeBlockType } from '@/lib/types/block'
import { formatCurrency } from '@/lib/utils/formatting'

interface Props {
    block: RentalIncomeBlockType
}

export function RentalIncomeBlock({ block }: Props) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-md">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </span>
                Rental Income Projection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="text-sm text-slate-500 mb-1">Estimated Monthly Rent</div>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(block.content.estimatedRent)}</div>
                </div>

                {block.content.roiPercentage && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                        <div className="text-sm text-emerald-700 mb-1">Est. Return on Investment</div>
                        <div className="text-2xl font-bold text-emerald-900">{block.content.roiPercentage}% <span className="text-sm font-normal">ROI</span></div>
                    </div>
                )}
            </div>

            {block.content.notes && (
                <p className="text-sm text-slate-500 mt-4 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                    {block.content.notes}
                </p>
            )}
        </div>
    )
}
