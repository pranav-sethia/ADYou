"use client"

import { Block as BlockType } from '@/lib/types/block'
import { UnitOverviewBlock } from './blocks/UnitOverviewBlock'
import { RentalIncomeBlock } from './blocks/RentalIncomeBlock'
import { RoomSectionBlock } from './blocks/RoomSectionBlock'
import { PermitStatusBlock } from './blocks/PermitStatusBlock'
import { ContactCtaBlock } from './blocks/ContactCtaBlock'
import { Copy, ArrowUp, ArrowDown, Trash2, EyeOff, MoreVertical } from 'lucide-react'
import { useState } from 'react'

interface BlockWrapperProps {
    block: BlockType
    isActive: boolean
    onClick: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onDuplicate: () => void
    onDelete: () => void
    isFirst: boolean
    isLast: boolean
}

export function Block({
    block, isActive, onClick, onMoveUp, onMoveDown, onDuplicate, onDelete, isFirst, isLast
}: BlockWrapperProps) {
    const [showMenu, setShowMenu] = useState(false)

    if (block.isHidden) {
        return (
            <div className="p-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <EyeOff className="w-4 h-4" />
                    Hidden Block: <span className="font-mono">{block.type}</span>
                </div>
                <button className="text-emerald-600 text-sm font-medium hover:underline">Restore</button>
            </div>
        )
    }

    return (
        <div
            className={`relative group cursor-pointer rounded-xl transition-all duration-200 ${isActive
                    ? 'ring-2 ring-emerald-500 ring-offset-2'
                    : 'hover:ring-1 hover:ring-slate-300 hover:ring-offset-2'
                }`}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
        >
            {/* Block content */}
            <div className={isActive ? 'opacity-100' : 'opacity-90 group-hover:opacity-100 transition-opacity'}>
                {block.type === 'unit_overview' && <UnitOverviewBlock block={block} />}
                {block.type === 'rental_income' && <RentalIncomeBlock block={block} />}
                {block.type === 'room_section' && <RoomSectionBlock block={block} />}
                {block.type === 'permit_status' && <PermitStatusBlock block={block} />}
                {block.type === 'contact_cta' && <ContactCtaBlock block={block} />}
            </div>

            {/* Hover Toolbar */}
            <div className={`absolute -right-3 top-4 flex flex-col gap-1 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-10 transition-all duration-200 ${isActive || showMenu ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2'
                }`}>
                <button
                    disabled={isFirst}
                    onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Up"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                <button
                    disabled={isLast}
                    onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Down"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
                <div className="h-px bg-slate-200 mx-1 my-0.5" />
                <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Duplicate"
                >
                    <Copy className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Active Edit Affordance Overlay */}
            {isActive && (
                <div className="absolute inset-x-0 -bottom-8 flex justify-center z-20">
                    <span className="bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow border border-emerald-500">
                        Tell the AI Agent how to change this block &uarr;
                    </span>
                </div>
            )}
        </div>
    )
}
