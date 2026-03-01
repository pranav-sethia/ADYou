"use client"

import { useState } from 'react'
import { Send } from 'lucide-react'

interface AgentInputProps {
    onSend: (message: string) => void
    disabled?: boolean
}

export function AgentInput({ onSend, disabled }: AgentInputProps) {
    const [value, setValue] = useState('')

    const handleSend = () => {
        if (!value.trim() || disabled) return
        onSend(value)
        setValue('')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="p-4 bg-white border-t border-slate-200">
            <div className="relative flex items-center shadow-sm border border-slate-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask the AI agent to edit your listing..."
                    disabled={disabled}
                    className="w-full resize-none bg-transparent py-3 pl-4 pr-12 text-sm max-h-32 min-h-[44px] focus:outline-none disabled:opacity-50"
                    rows={Math.min(4, value.split('\n').length || 1)}
                />
                <button
                    onClick={handleSend}
                    disabled={!value.trim() || disabled}
                    className="absolute right-2 bottom-2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-slate-400">
                Shift + Enter for new line
            </div>
        </div>
    )
}
