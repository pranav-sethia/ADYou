import { PermitStatusBlock as PermitStatusBlockType } from '@/lib/types/block'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

interface Props {
    block: PermitStatusBlockType
}

export function PermitStatusBlock({ block }: Props) {
    const isVerified = block.content.status === 'verified'
    const isPending = block.content.status === 'pending'

    return (
        <div className={`rounded-xl border p-6 transition-all hover:shadow-sm ${isVerified ? 'bg-green-50/50 border-green-200' :
                isPending ? 'bg-blue-50/50 border-blue-200' :
                    'bg-amber-50/50 border-amber-200'
            }`}>
            <div className="flex items-start gap-4">
                <div className={`mt-1 bg-white rounded-full p-1 shadow-sm ${isVerified ? 'text-green-600' :
                        isPending ? 'text-blue-600' :
                            'text-amber-600'
                    }`}>
                    {isVerified ? <CheckCircle2 className="w-6 h-6" /> :
                        isPending ? <Clock className="w-6 h-6" /> :
                            <AlertTriangle className="w-6 h-6" />}
                </div>

                <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-1 ${isVerified ? 'text-green-900' :
                            isPending ? 'text-blue-900' :
                                'text-amber-900'
                        }`}>
                        {isVerified ? 'City Verified Permit' :
                            isPending ? 'Permit Pending' :
                                'Permit Unverified'}
                    </h3>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 text-sm">
                        {block.content.issuingCity && (
                            <div>
                                <span className="text-slate-500 block text-xs uppercase tracking-wider font-medium mb-0.5">Jurisdiction</span>
                                <span className="text-slate-900 font-medium">City of {block.content.issuingCity}</span>
                            </div>
                        )}
                        {block.content.permitNumber && (
                            <div>
                                <span className="text-slate-500 block text-xs uppercase tracking-wider font-medium mb-0.5">Permit Number</span>
                                <span className="text-slate-900 font-medium font-mono">{block.content.permitNumber}</span>
                            </div>
                        )}
                        {block.content.issueDate && (
                            <div className="col-span-2 mt-2">
                                <span className="text-slate-500 block text-xs uppercase tracking-wider font-medium mb-0.5">Issued On</span>
                                <span className="text-slate-900">{block.content.issueDate}</span>
                            </div>
                        )}
                    </div>

                    {block.content.notes && (
                        <p className="mt-4 text-sm text-slate-600 leading-relaxed bg-white/60 p-3 rounded-lg border border-white/40">
                            {block.content.notes}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
