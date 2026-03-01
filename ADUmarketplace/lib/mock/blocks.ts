import { Block } from '../types/block'

// We map listing IDs to a predefined set of blocks to populate the editor
export const MOCK_BLOCKS: Record<string, Block[]> = {
    '1': [
        {
            id: '1-overview',
            type: 'unit_overview',
            isHidden: false,
            content: {
                headline: 'Modern 1BR Detached ADU in Woodbridge',
                body: 'Thoughtfully designed detached ADU in the quiet Woodbridge neighborhood. Features high ceilings, stainless steel appliances, and a private fenced outdoor area.',
                heroImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
            }
        },
        {
            id: '1-rental',
            type: 'rental_income',
            isHidden: false,
            content: {
                estimatedRent: 2600,
                roiPercentage: 11.5,
                paybackPeriodYears: 8.5,
                notes: 'Based on recent 1BR comps in Woodbridge.'
            }
        },
        {
            id: '1-room-1',
            type: 'room_section',
            isHidden: false,
            content: {
                roomType: 'kitchen',
                title: 'Gourmet Kitchen',
                description: 'Includes full-size refrigerator, dishwasher, and island seating.',
                imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
            }
        },
        {
            id: '1-permit',
            type: 'permit_status',
            isHidden: false,
            content: {
                status: 'verified',
                permitNumber: 'ADU-2022-0847',
                issuingCity: 'Irvine',
                issueDate: '2022-10-15',
                notes: 'Final inspection passed.'
            }
        },
        {
            id: '1-contact',
            type: 'contact_cta',
            isHidden: false,
            content: {
                title: 'Interested in this property?',
                buttonText: 'Contact Landlord',
                messagePrompt: 'Hi Sarah, I am interested in your ADU in Woodbridge...'
            }
        }
    ],
    '4': [
        {
            id: '4-overview',
            type: 'unit_overview',
            isHidden: false,
            content: {
                headline: 'Spacious 2BR Detached ADU in Turtle Rock',
                body: 'Premium ADU located in the highly desirable Turtle Rock community. Features a wrap-around deck, modern finishes, and smart home lighting.',
                heroImageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
            }
        },
        {
            id: '4-permit',
            type: 'permit_status',
            isHidden: false,
            content: {
                status: 'verified',
                permitNumber: 'ADU-2023-0932',
                issuingCity: 'Irvine',
                notes: 'Permits cleared early 2023.'
            }
        }
    ],
    '7': [
        {
            id: '7-overview',
            type: 'unit_overview',
            isHidden: false,
            content: {
                headline: 'Brand New Garage Conversion near UCI',
                body: 'Newly converted garage, perfect for a student or young professional. Features central AC and dedicated walkway.',
                heroImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
            }
        },
        {
            id: '7-rental',
            type: 'rental_income',
            isHidden: false,
            content: {
                estimatedRent: 2100,
                notes: 'Targeting student demographic.'
            }
        }
    ],
    '10': [
        {
            id: '10-overview',
            type: 'unit_overview',
            isHidden: false,
            content: {
                headline: 'Family-Friendly 2BR Detached ADU in Irvine',
                body: 'Large ADU with a grassy yard section perfect for a small dog. Includes tandem parking spot in driveway and dedicated washer/dryer.',
                heroImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
            }
        }
    ]
}
