export const MOCK_FEASIBILITY_REPORT = {
    address: '',
    city: '',
    confidenceTier: 'GREEN',
    eligible: true,
    lotSqft: 7200,
    buildableSqft: 2100,
    recommendedAduSqft: 800,
    maxAllowedSqft: 1200,
    setbacks: '5ft rear, 4ft sides',
    zoningDesignation: 'R-1 Single Family Residential',
    permitRecords: [],
    unpermittedStructureFlag: false,
    floodZone: 'Zone X (minimal flood hazard)',
    fireHazardZone: 'None',
    garageConversionPossible: true,
    juniorAduPossible: true,
    estimatedPermitTimelineDays: '30–60',
    rentalEstimate: {
        monthlyLow: 2200,
        monthlyHigh: 2800,
        annualLow: 26400,
        annualHigh: 33600,
        unitType: '1-bedroom ADU',
        dataSource: 'Irvine market comparables Q2 2024'
    },
    estimatedRentalIncome: 2500,
    estimatedCosts: {
        designPermits: 18000,
        cityFees: 6500,
        construction: 165000,
        total: 189500
    },
    warnings: [],
    nextSteps: [
        'Contact Irvine Planning Department to confirm your specific zoning designation',
        'Hire a licensed surveyor to confirm exact property boundaries and setbacks',
        'Request a free ADU pre-application meeting with the city',
        'Get 2–3 contractor bids — typical Irvine ADU costs $180K–$240K'
    ],
    satelliteUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=640',
    overlayUrl: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?w=640',
    dataSourcesUsed: ['Orange County Assessor', 'City of Irvine GIS', 'Irvine Permit Portal']
}
