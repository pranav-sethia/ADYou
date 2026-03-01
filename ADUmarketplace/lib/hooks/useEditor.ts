"use client"

import { useState, useCallback } from 'react'
import { Block } from '../types/block'
import { MOCK_BLOCKS } from '../mock/blocks'

export function useEditor(listingId: string) {
    const [blocks, setBlocks] = useState<Block[]>(MOCK_BLOCKS[listingId] || [])
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

    const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
        setBlocks(prev => prev.map(block =>
            block.id === id ? { ...block, ...updates } as Block : block
        ))
    }, [])

    const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
        setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === id)
            if (idx < 0) return prev
            if (direction === 'up' && idx === 0) return prev
            if (direction === 'down' && idx === prev.length - 1) return prev

            const newBlocks = [...prev]
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1
            const temp = newBlocks[idx]
            newBlocks[idx] = newBlocks[targetIdx]
            newBlocks[targetIdx] = temp
            return newBlocks
        })
    }, [])

    const duplicateBlock = useCallback((id: string) => {
        setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === id)
            if (idx < 0) return prev
            const blockToClone = prev[idx]
            const clonedBlock = { ...blockToClone, id: `${blockToClone.id}-copy-${Date.now()}` }
            const newBlocks = [...prev]
            newBlocks.splice(idx + 1, 0, clonedBlock)
            return newBlocks
        })
    }, [])

    const deleteBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id))
        if (activeBlockId === id) setActiveBlockId(null)
    }, [activeBlockId])

    return {
        blocks,
        setBlocks,
        activeBlockId,
        setActiveBlockId,
        updateBlock,
        moveBlock,
        duplicateBlock,
        deleteBlock
    }
}
