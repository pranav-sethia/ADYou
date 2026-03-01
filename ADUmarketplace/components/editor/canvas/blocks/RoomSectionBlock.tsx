import { RoomSectionBlock as RoomSectionBlockType } from '@/lib/types/block'

interface Props {
    block: RoomSectionBlockType
}

export function RoomSectionBlock({ block }: Props) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-1 transition-all hover:border-slate-300 hover:shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">
                <div className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        {block.content.roomType.replace('_', ' ')}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{block.content.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                        {block.content.description}
                    </p>
                </div>
                <div className="h-48 md:h-auto min-h-[200px] bg-slate-100 rounded-lg overflow-hidden relative m-1">
                    {block.content.imageUrl ? (
                        <img src={block.content.imageUrl} alt="" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            No image
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
