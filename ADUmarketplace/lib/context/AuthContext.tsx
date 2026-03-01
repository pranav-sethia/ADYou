"use client"

import React, { createContext, useState, ReactNode } from 'react'
import { AuthState, MockUser, MOCK_BUYER, MOCK_SELLER } from '../types/user'

interface AuthContextType {
    authState: AuthState
    setAuthState: (state: AuthState) => void
    user: MockUser | null
    isLoggedIn: boolean
    isBuyer: boolean
    isSeller: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>('logged_out')

    const user = authState === 'buyer' ? MOCK_BUYER : authState === 'seller' ? MOCK_SELLER : null
    const isLoggedIn = authState !== 'logged_out'
    const isBuyer = authState === 'buyer'
    const isSeller = authState === 'seller'

    return (
        <AuthContext.Provider value={{ authState, setAuthState, user, isLoggedIn, isBuyer, isSeller }}>
            {children}
        </AuthContext.Provider>
    )
}
