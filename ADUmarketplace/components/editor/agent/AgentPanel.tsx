"use client"

import { useState } from 'react'
import { QuickActions } from './QuickActions'
import { AgentChat, Message } from './AgentChat'
import { AgentInput } from './AgentInput'
import { MOCK_AGENT_RESPONSES } from '@/lib/mock/agent-responses'
import { BrainCircuit } from 'lucide-react'

interface AgentPanelProps {
    onSuggestChanges: (blockIds: string[]) => void
}

export function AgentPanel({ onSuggestChanges }: AgentPanelProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)

    const handleSend = (text: string, actionId?: string) => {
        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text
        }
        setMessages(prev => [...prev, userMsg])
        setIsTyping(true)

        // Simulate AI thinking and responding
        setTimeout(() => {
            // Find appropriate mock response
            let responseConfig = MOCK_AGENT_RESPONSES.find(r => r.trigger === actionId)

            if (!responseConfig) {
                // Simple keyword matching for typed text
                const lowerText = text.toLowerCase()
                if (lowerText.includes('investor') || lowerText.includes('cap rate') || lowerText.includes('yield')) {
                    responseConfig = MOCK_AGENT_RESPONSES.find(r => r.trigger === 'investor')
                } else if (lowerText.includes('roi') || lowerText.includes('return') || lowerText.includes('payback')) {
                    responseConfig = MOCK_AGENT_RESPONSES.find(r => r.trigger === 'roi')
                } else if (lowerText.includes('seo') || lowerText.includes('search') || lowerText.includes('title')) {
                    responseConfig = MOCK_AGENT_RESPONSES.find(r => r.trigger === 'seo')
                } else if (lowerText.includes('price') || lowerText.includes('rent') || lowerText.includes('comp')) {
                    responseConfig = MOCK_AGENT_RESPONSES.find(r => r.trigger === 'price')
                } else {
                    responseConfig = MOCK_AGENT_RESPONSES.find(r => r.trigger === 'default')
                }
            }

            if (responseConfig) {
                const agentMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'agent',
                    content: responseConfig.response
                }
                setMessages(prev => [...prev, agentMsg])

                // Trigger canvas updates if any blocks were modified
                if (responseConfig.canvasChanges.length > 0) {
                    onSuggestChanges(responseConfig.canvasChanges)
                }
            }

            setIsTyping(false)
        }, 1500) // 1.5s simulated delay
    }

    return (
        <div className="flex flex-col h-full bg-surface-0 border-l border-surface-200 relative shadow-[-4px_0_24px_-4px_rgba(0,0,0,0.02)]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-200 bg-surface-0/95 backdrop-blur-sm z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center border border-brand-200">
                        <BrainCircuit className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-surface-900 leading-tight">Copilot</h2>
                        <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-widest leading-tight mt-0.5">Online</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <AgentChat messages={messages} isTyping={isTyping} />

            {/* Input Area */}
            <div className="p-4 bg-surface-0 border-t border-surface-200">
                {messages.length === 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wide mb-3 px-1">Suggested Actions</p>
                        <QuickActions onActionSelect={handleSend} disabled={isTyping} />
                    </div>
                )}

                <AgentInput onSend={handleSend} disabled={isTyping} />
            </div>
        </div>
    )
}
