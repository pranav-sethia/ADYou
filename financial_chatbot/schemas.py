"""
Pydantic models for the ADU Financial Chatbot API.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """A single message in the conversation."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    """Request payload for the /chatbot/chat endpoint."""
    messages: list[ChatMessage]
    address: Optional[str] = Field(default=None, description="Property address from the map")
    adu_sqft: Optional[float] = Field(default=None, description="ADU square footage pre-set from the map")


class ADUParams(BaseModel):
    """Structured ADU parameters extracted from the conversation."""
    sqft: Optional[float] = None
    construction_type: Optional[str] = None   # "new_build", "garage_conversion", "prefab", "jadu"
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    addons: list[str] = Field(default_factory=list)


class CostItem(BaseModel):
    """A single line item in the cost breakdown."""
    label: str
    low: float
    high: float


class FinancialReport(BaseModel):
    """Complete financial analysis report."""
    params: ADUParams
    total_cost_low: float
    total_cost_high: float
    monthly_rent_low: float
    monthly_rent_high: float
    breakeven_months_low: int
    breakeven_months_high: int
    cost_breakdown: list[CostItem]
    address: Optional[str] = None
    summary_text: str


class ChatResponse(BaseModel):
    """Response payload from /chatbot/chat."""
    reply: str
    report: Optional[FinancialReport] = None
    params_so_far: Optional[ADUParams] = None