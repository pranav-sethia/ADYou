export type AuthState = 'logged_out' | 'buyer' | 'seller'

export interface MockUser {
    id: string
    name: string
    email: string
    role: 'buyer' | 'seller'
    avatar: string
}

export const MOCK_BUYER: MockUser = {
    id: 'buyer-1',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    role: 'buyer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
}

export const MOCK_SELLER: MockUser = {
    id: 'mock-seller-1',
    name: 'David Kim',
    email: 'david@example.com',
    role: 'seller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david'
}
