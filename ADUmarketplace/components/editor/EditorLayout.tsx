"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas } from './canvas/Canvas'
import { AgentPanel } from './agent/AgentPanel'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, Share, Eye } from 'lucide-react'

interface EditorLayoutProps {
    listingId: string
    address: string
}

export function EditorLayout({ listingId, address }: EditorLayoutProps) {
    const router = useRouter()
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // These would come from a real data store, simulated for now
    const [highlightedBlocks, setHighlightedBlocks] = useState<string[]>([])

    const handleAgentSuggestion = (blockIds: string[]) => {
        setHasChanges(true)
        setHighlightedBlocks(blockIds)
        // Clear highlights after a few seconds
        setTimeout(() => {
            setHighlightedBlocks([])
        }, 3000)
    }

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            setHasChanges(false)
        }, 800)
    }

    return (
        <div className="flex flex-col h-screen bg-surface-50">
            {/* Editor Toolbar */}
            <header className="h-16 bg-surface-0 border-b border-surface-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard/listings')}
                        className="text-surface-500 hover:text-surface-900 rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="h-6 w-px bg-surface-200" />
                    <div>
                        <h1 className="font-bold text-surface-900 text-sm">{address}</h1>
                        <p className="text-xs font-medium text-surface-500">Draft Listing</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="hidden sm:flex border-surface-200 text-surface-700 font-semibold gap-2">
                        <Eye className="w-4 h-4" /> Preview
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={`gap-2 font-semibold shadow-sm transition-all duration-300 ${hasChanges
                                ? 'bg-brand-600 hover:bg-brand-700 text-white border border-brand-700 shadow-[0_2px_8px_rgba(34,197,94,0.25)]'
                                : 'bg-surface-100 text-surface-400 cursor-not-allowed border border-surface-200'
                            }`}
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : hasChanges ? (
                            <Share className="w-4 h-4" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        {isSaving ? 'Saving...' : hasChanges ? 'Publish Changes' : 'Published'}
                    </Button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">

                {/* Canvas Area (2/3 width) */}
                <main className="flex-1 overflow-y-auto bg-surface-50 custom-scrollbar">
                    <div className="max-w-3xl mx-auto py-8 px-4 lg:px-8">
                        <Canvas listingId={listingId} highlightedBlocks={highlightedBlocks} />
                    </div>
                </main>

                {/* AI Agent Panel (1/3 width) */}
                <aside className="w-full max-w-[400px] flex-shrink-0 hidden md:flex flex-col border-l border-surface-200 bg-surface-0 shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.02)] z-10">
                    <AgentPanel onSuggestChanges={handleAgentSuggestion} />
                </aside>
            </div>
        </div>
    )
}
