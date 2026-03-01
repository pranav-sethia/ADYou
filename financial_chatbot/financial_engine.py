"""
Financial computation logic for ADU builder.
"""

from typing import Optional
from financial_chatbot.schemas import ADUParams, CostItem, FinancialReport

def compute_financial_report(params: ADUParams, address: Optional[str] = None) -> FinancialReport:
    """
    Given parsed parameters from the chat, generate a generic financial report.
    """
    sqft = params.sqft or 500.0
    
    # Base cost calculations
    base_cost_per_sqft = 350.0
    if params.construction_type == "garage_conversion":
        base_cost_per_sqft = 200.0
    elif params.construction_type == "prefab":
        base_cost_per_sqft = 300.0
    elif params.construction_type == "jadu":
        base_cost_per_sqft = 150.0
        
    base_low = sqft * base_cost_per_sqft * 0.9
    base_high = sqft * base_cost_per_sqft * 1.15
    
    # Add-on calculations
    addons_low, addons_high = 0.0, 0.0
    for addon in params.addons:
        if addon == "solar":
            addons_low += 10000; addons_high += 18000
        elif addon == "ev_charger":
            addons_low += 1500; addons_high += 3000
        elif addon == "premium_finishes":
            addons_low += sqft * 50; addons_high += sqft * 100
        elif addon == "extra_bathroom":
            addons_low += 15000; addons_high += 25000
            
    total_low = base_low + addons_low
    total_high = base_high + addons_high
    
    # Hardcoded rental estimate depending on bedrooms
    rent_low = 1500.0 + (params.bedrooms or 1) * 500
    rent_high = 2000.0 + (params.bedrooms or 1) * 700

    breakeven_low = int(total_low / rent_high)
    breakeven_high = int(total_high / rent_low)
    
    cost_breakdown = [
        CostItem(label="Construction & Labor", low=base_low, high=base_high),
        CostItem(label="Permits & Design", low=10000.0, high=25000.0),
    ]
    if addons_low > 0:
        cost_breakdown.append(CostItem(label="Optional Add-ons", low=addons_low, high=addons_high))

    msg = f"Estimated total cost is ${total_low:,.0f} - ${total_high:,.0f} for a {sqft:,.0f} sqft {params.construction_type.replace('_', ' ')}."
    
    return FinancialReport(
        params=params,
        total_cost_low=total_low,
        total_cost_high=total_high,
        monthly_rent_low=rent_low,
        monthly_rent_high=rent_high,
        breakeven_months_low=breakeven_low,
        breakeven_months_high=breakeven_high,
        cost_breakdown=cost_breakdown,
        address=address,
        summary_text=msg
    )
