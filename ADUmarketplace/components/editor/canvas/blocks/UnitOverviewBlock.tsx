import { UnitOverviewBlock as UnitOverviewBlockType } from '@/lib/types/block'

interface Props {
    block: UnitOverviewBlockType
}

export function UnitOverviewBlock({ block }: Props) {
    return (
        <div className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-300 hover:shadow-sm">
            <div className="h-48 md:h-64 bg-slate-100 relative">
                {block.content.heroImageUrl ? (
                    <img src={block.content.heroImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No image
                    </div>
                )}
            </div>
            <div className="p-6 md:p-8 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                    {block.content.headline}
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                    {block.content.body}
                </p>
            </div>
        </div>
    )
}
