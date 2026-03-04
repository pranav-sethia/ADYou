"use client"
import { X, Building2 } from "lucide-react"
import { useState, useEffect } from "react"

import { useAuth } from "@/lib/hooks/useAuth"

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: { isOpen: boolean, onClose: () => void, defaultTab?: 'signin' | 'signup' }) {
    const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab)

    useEffect(() => {
        if (isOpen) {
            setTab(defaultTab)
        }
    }, [isOpen, defaultTab])

    const { login } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            let token = ''
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            if (tab === 'signup') {
                const res = await fetch(`${apiUrl}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name, role: 'buyer' })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.detail || 'Registration failed')
                token = data.access_token
            } else {
                const formData = new FormData()
                formData.append('username', email)
                formData.append('password', password)

                const res = await fetch(`${apiUrl}/auth/token`, {
                    method: 'POST',
                    body: formData
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.detail || 'Login failed')
                token = data.access_token
            }

            // Fetch profile
            const meRes = await fetch(`${apiUrl}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const meData = await meRes.json()
            if (!meRes.ok) throw new Error('Failed to fetch user profile')

            login(token, meData)
            onClose()

            // reset form
            setEmail('')
            setPassword('')
            setName('')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[440px] p-8 animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute right-5 top-5 text-slate-400 hover:text-slate-900 rounded-full p-2 hover:bg-slate-100 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5 border border-emerald-200 shadow-sm">
                        <Building2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-500 text-center text-sm font-medium">Sign in to save properties and message landlords directly.</p>
                </div>

                <div className="flex w-full mb-8 border-b border-slate-100">
                    <button
                        onClick={() => setTab('signin')}
                        className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${tab === 'signin' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setTab('signup')}
                        className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${tab === 'signup' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Create Account
                    </button>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}
                    {tab === 'signup' && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                placeholder="Jane Doe"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        disabled={isLoading}
                        className="w-full bg-emerald-600 text-white rounded-xl h-12 font-bold hover:bg-emerald-700 transition-colors mt-4 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Please wait...' : (tab === 'signin' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <p className="mt-8 text-center text-xs text-slate-400 font-medium">
                    By continuing you agree to our <a href="#" className="underline hover:text-slate-600">Terms</a> and <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}
