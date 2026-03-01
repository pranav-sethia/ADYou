export type BlockType =
    | 'unit_overview'
    | 'room_section'
    | 'rental_income'
    | 'permit_status'
    | 'contact_cta'

export interface BaseBlock {
    id: string
    type: BlockType
    isHidden: boolean
}

export interface UnitOverviewBlock extends BaseBlock {
    type: 'unit_overview'
    content: {
        headline: string
        body: string
        heroImageUrl?: string
    }
}

export interface RoomSectionBlock extends BaseBlock {
    type: 'room_section'
    content: {
        roomType: 'kitchen' | 'bedroom' | 'bathroom' | 'living_room' | 'exterior'
        title: string
        description: string
        imageUrl?: string
    }
}

export interface RentalIncomeBlock extends BaseBlock {
    type: 'rental_income'
    content: {
        estimatedRent: number
        roiPercentage?: number
        paybackPeriodYears?: number
        notes: string
    }
}

export interface PermitStatusBlock extends BaseBlock {
    type: 'permit_status'
    content: {
        status: 'verified' | 'unverified' | 'pending'
        permitNumber: string
        issuingCity: string
        issueDate?: string
        notes?: string
    }
}

export interface ContactCtaBlock extends BaseBlock {
    type: 'contact_cta'
    content: {
        title: string
        buttonText: string
        messagePrompt: string
    }
}

export type Block =
    | UnitOverviewBlock
    | RoomSectionBlock
    | RentalIncomeBlock
    | PermitStatusBlock
    | ContactCtaBlock
