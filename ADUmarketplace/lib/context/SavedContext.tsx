"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SavedContextType {
    savedListings: string[]
    isSaved: (id: string) => boolean
    toggleSaved: (id: string) => void
}

const SavedContext = createContext<SavedContextType>({
    savedListings: [],
    isSaved: () => false,
    toggleSaved: () => { }
})

const DEFAULT_SAVED_IDS = ['5', '8', '11']

export function SavedProvider({ children }: { children: React.ReactNode }) {
    const [savedListings, setSavedListings] = useState<string[]>([])

    // Only run on client after mount to avoid hydration mismatch
    useEffect(() => {
        const saved = localStorage.getItem('adubase-saved')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSavedListings(parsed)
                    return
                }
            } catch (e) {
                // ignore parsing errors
            }
        }
        // If nothing saved yet, default to 3 pre-saved listings
        setSavedListings(DEFAULT_SAVED_IDS)
        localStorage.setItem('adubase-saved', JSON.stringify(DEFAULT_SAVED_IDS))
    }, [])

    const isSaved = (id: string) => savedListings.includes(id)

    const toggleSaved = (id: string) => {
        setSavedListings(prev => {
            const newSaved = prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]

            // Save to localStorage
            localStorage.setItem('adubase-saved', JSON.stringify(newSaved))
            return newSaved
        })
    }

    return (
        <SavedContext.Provider value={{ savedListings, isSaved, toggleSaved }}>
            {children}
        </SavedContext.Provider>
    )
}

export const useSaved = () => useContext(SavedContext)
