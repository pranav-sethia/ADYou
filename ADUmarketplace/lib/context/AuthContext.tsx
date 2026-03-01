"use client"

import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react'

export interface ApiUser {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string
}

interface AuthContextType {
    user: ApiUser | null
    isLoggedIn: boolean
    isBuyer: boolean
    isSeller: boolean
    isLoading: boolean
    login: (token: string, userData: ApiUser) => void
    logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<ApiUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Hydrate session on mount
        const token = localStorage.getItem('token')
        if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error("Invalid token")
                    return res.json()
                })
                .then(data => {
                    setUser(data)
                })
                .catch(() => {
                    localStorage.removeItem('token')
                    setUser(null)
                })
                .finally(() => setIsLoading(false))
        } else {
            setIsLoading(false)
        }
    }, [])

    const login = (token: string, userData: ApiUser) => {
        localStorage.setItem('token', token)
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    const isLoggedIn = user !== null
    const isBuyer = user?.role === 'buyer'
    const isSeller = user?.role === 'seller'

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn,
            isBuyer,
            isSeller,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}
