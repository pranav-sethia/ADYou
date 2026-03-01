"use client"

import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Search, DollarSign } from 'lucide-react'

interface QuickActionsProps {
    onActionSelect: (actionId: string, text: string) => void
    disabled?: boolean
}

export function QuickActions({ onActionSelect, disabled }: QuickActionsProps) {
    const actions = [
        { id: 'investor', label: 'Investor Focus', icon: TrendingUp },
        { id: 'roi', label: 'Add ROI Analysis', icon: Sparkles },
        { id: 'seo', label: 'SEO Optimize', icon: Search },
        { id: 'price', label: 'Suggest Price', icon: DollarSign },
    ]

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {actions.map(action => {
                const Icon = action.icon
                return (
                    <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => onActionSelect(action.id, action.label)}
                        className="rounded-full bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 border"
                    >
                        <Icon className="w-3.5 h-3.5 mr-1.5" />
                        {action.label}
                    </Button>
                )
            })}
        </div>
    )
}
