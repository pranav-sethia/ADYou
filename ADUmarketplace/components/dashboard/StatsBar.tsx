import { LucideIcon } from 'lucide-react'

interface Stat {
    label: string
    value: string | number
    icon: LucideIcon
    trend?: string
    trendUp?: boolean
}

interface StatsBarProps {
    stats: Stat[]
}

export function StatsBar({ stats }: StatsBarProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <div key={i} className="bg-surface-0 p-5 rounded-2xl border border-surface-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider">{stat.label}</h3>
                        <div className="w-10 h-10 rounded-xl bg-surface-50 flex items-center justify-center border border-surface-100">
                            <stat.icon className="w-5 h-5 text-surface-500" />
                        </div>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-surface-900 tracking-tight">{stat.value}</span>
                        {stat.trend && (
                            <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${stat.trendUp
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}>
                                {stat.trendUp ? '↑' : '↓'} {stat.trend}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
