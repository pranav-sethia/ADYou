// Simulates AI agent responses
export const MOCK_AGENT_RESPONSES = [
    {
        trigger: 'investor',
        response: "Done. I rewrote the unit overview to lead with the financials — the $2,600/mo rent on a ~$195K build cost works out to a 16% gross yield, which is the headline investor number. I also moved the permit verification detail higher since that reduces perceived risk for investors. Want me to add a full cap rate breakdown as a separate section?",
        canvasChanges: ['rental_income', 'unit_overview']
    },
    {
        trigger: 'roi',
        response: "I've added a detailed ROI analysis block to the canvas based on average Irvine detached ADU costs. It projects a 5.2-year payback period assuming 3% annual rent growth and zero vacancy. You can click into the block to adjust the baseline build cost if your numbers differ.",
        canvasChanges: ['rental_income']
    },
    {
        trigger: 'seo',
        response: "I've optimized your headline to 'Brand New Detached ADU with Vaulted Ceilings in Woodbridge'—this captures three high-intent search terms ('new', 'detached', 'Woodbridge'). I also naturally wove 'private entrance' and 'laundry' into the first paragraph of the description since those are top filter criteria.",
        canvasChanges: ['unit_overview']
    },
    {
        trigger: 'price',
        response: "Based on 14 active detached 1-bedroom ADUs in the 92604 zip code, the median rent is $2,550/mo. Because you have in-unit laundry and vaulted ceilings, I recommend pricing at $2,650/mo to leave $50/mo of negotiation room. I've updated the rental income block to reflect this.",
        canvasChanges: ['rental_income']
    },
    {
        trigger: 'default',
        response: "I've made that adjustment to the listing copy. I tightened up the language so the most valuable amenities (private entrance, in-unit laundry) appear in the first 140 characters, which is what shows up in the search preview cards. Let me know if you'd like me to tweak the tone further.",
        canvasChanges: ['unit_overview']
    }
]
