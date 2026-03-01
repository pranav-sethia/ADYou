"use client"

import { useEffect, useRef } from 'react'
import { Sparkles, User } from 'lucide-react'

export interface Message {
    id: string
    role: 'user' | 'agent'
    content: string
}

interface AgentChatProps {
    messages: Message[]
    isTyping?: boolean
}

export function AgentChat({ messages, isTyping }: AgentChatProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-surface-0">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-surface-400 space-y-4">
                    <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center rotate-3 shadow-sm border border-surface-200">
                        <Sparkles className="w-8 h-8 text-brand-500" />
                    </div>
                    <div className="text-center max-w-[200px]">
                        <p className="font-semibold text-surface-900 mb-1">AI Assistant</p>
                        <p className="text-sm">I can rewrite copy, analyze ROI, or optimize your listing for search.</p>
                    </div>
                </div>
            )}

            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {msg.role === 'agent' && (
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 border border-brand-200 shadow-sm mt-1">
                            <Sparkles className="w-4 h-4 text-brand-600" />
                        </div>
                    )}

                    <div
                        className={`px-4 py-3 max-w-[85%] text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-brand-600 text-white rounded-2xl rounded-tr-sm'
                                : 'bg-surface-100 text-surface-900 rounded-2xl rounded-tl-sm border border-surface-200'
                            }`}
                    >
                        {msg.content}
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 border border-brand-200 shadow-sm mt-1">
                        <Sparkles className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="px-4 py-3 bg-surface-100 rounded-2xl rounded-tl-sm border border-surface-200 flex items-center gap-1.5 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce"></div>
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    )
}
