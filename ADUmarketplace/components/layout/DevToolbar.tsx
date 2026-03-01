"use client"

import { useAuth } from '@/lib/hooks/useAuth'

export function DevToolbar() {
    const { authState, setAuthState } = useAuth()

    if (process.env.NODE_ENV !== 'development') {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl p-4 text-slate-200 text-sm flex flex-col gap-3 font-sans opacity-95 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-center gap-6">
                <span className="font-semibold text-xs tracking-wider uppercase text-slate-400">Dev Mode</span>
                <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded text-xs">
                    Role: {authState}
                </span>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setAuthState('logged_out')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${authState === 'logged_out'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                >
                    Logged Out
                </button>
                <button
                    onClick={() => setAuthState('buyer')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${authState === 'buyer'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                >
                    Buyer
                </button>
                <button
                    onClick={() => setAuthState('seller')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${authState === 'seller'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                >
                    Seller
                </button>
            </div>
        </div>
    )
}
