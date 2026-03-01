"use client"

import { useEditor } from '@/lib/hooks/useEditor'
import { Block } from './Block'

interface CanvasProps {
    listingId: string
    highlightedBlocks?: string[]
}

export function Canvas({ listingId }: CanvasProps) {
    const {
        blocks,
        activeBlockId,
        setActiveBlockId,
        moveBlock,
        duplicateBlock,
        deleteBlock
    } = useEditor(listingId)

    return (
        <div
            className="bg-slate-50 h-full overflow-y-auto"
            onClick={() => setActiveBlockId(null)}
        >
            <div className="max-w-2xl mx-auto py-12 px-4 md:px-8 space-y-8 pb-32">
                {blocks.map((block, index) => (
                    <Block
                        key={block.id}
                        block={block}
                        isActive={activeBlockId === block.id}
                        onClick={() => setActiveBlockId(block.id)}
                        onMoveUp={() => moveBlock(block.id, 'up')}
                        onMoveDown={() => moveBlock(block.id, 'down')}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        isFirst={index === 0}
                        isLast={index === blocks.length - 1}
                    />
                ))}

                {blocks.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-xl bg-white">
                        <h3 className="text-lg font-semibold text-slate-700">Your canvas is empty</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">Ask the AI Agent on the right to start building sections for your listing.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
