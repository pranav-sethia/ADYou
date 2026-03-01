"""
Chat Engine — OpenAI Agents SDK with Gemini via LiteLLM.

Uses the official `openai-agents[litellm]` integration to run a
Gemini model through the OpenAI Agents SDK Runner.

Required env var:
    GEMINI_API_KEY  — Google AI Studio API key (aistudio.google.com)
"""

import json
import os
import logging
from typing import Optional

# OpenAI Agents SDK
from agents import Agent, Runner, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel

from financial_chatbot.schemas import ADUParams, ChatMessage

logger = logging.getLogger(__name__)

# Disable OpenAI-platform tracing (we're using Gemini, not OpenAI)
set_tracing_disabled(True)

# ---------------------------------------------------------------------------
# Gemini model identifier via LiteLLM
# ---------------------------------------------------------------------------
_GEMINI_MODEL = "gemini/gemini-2.5-flash"

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are an expert ADU (Accessory Dwelling Unit) financial advisor helping California homeowners understand the cost to build an ADU on their property.

Your job is to have a warm, helpful conversation to gather the following information. Ask for one or two items at a time — never all at once:

**Required info:**
1. ADU square footage (if not already known)
2. Construction type: choose one:
   - "new_build" — building from scratch
   - "garage_conversion" — converting an existing garage
   - "prefab" — prefabricated / modular unit
   - "jadu" — Junior ADU inside the main home
3. Number of bedrooms (0 for studio, 1, 2, or 3)
4. Number of bathrooms (1, 1.5, 2, etc.)

**Optional add-ons — ask about these after you have the required info:**
solar, ev_charger, premium_finishes, extra_bathroom, laundry_room, hvac, pool, deck, smart_home

---

Once you have ALL four required fields confirmed (sqft, construction_type, bedrooms, bathrooms), respond with a brief friendly summary AND embed this exact JSON block at the END of your message:

```json
{
  "generate_report": true,
  "params": {
    "sqft": <number>,
    "construction_type": "<new_build|garage_conversion|prefab|jadu>",
    "bedrooms": <integer>,
    "bathrooms": <number>,
    "addons": []
  },
  "summary": "<one sentence confirming the setup>"
}
```

Only include add-ons the user explicitly requested. Addon values must be from: solar, ev_charger, premium_finishes, extra_bathroom, laundry_room, hvac, pool, deck, smart_home.

Keep responses concise and friendly. Use dollar amounts and concrete examples where helpful.
IMPORTANT: Do NOT emit the JSON block until you have sqft, construction_type, bedrooms, AND bathrooms confirmed.
"""


def _build_context(address: Optional[str], adu_sqft: Optional[float]) -> str:
    """Prepend known context to the system prompt."""
    extra = ""
    if address:
        extra += f"\n\nThe homeowner's property address is: **{address}** (Irvine / Orange County, CA)."
    if adu_sqft:
        extra += (
            f"\n\nThe homeowner has already selected **{adu_sqft:,.0f} sq ft** on the map. "
            "You already know the sqft — do NOT ask for it. Start by greeting them and asking about the construction type."
        )
    return _SYSTEM_PROMPT + extra


def _extract_params(reply: str) -> Optional[ADUParams]:
    """Pull the generate_report JSON from the model reply."""
    try:
        start = reply.find("```json")
        if start == -1:
            return None
        end = reply.find("```", start + 7)
        if end == -1:
            return None
        raw = reply[start + 7:end].strip()
        data = json.loads(raw)
        if not data.get("generate_report"):
            return None
        p = data.get("params", {})
        return ADUParams(
            sqft=p.get("sqft"),
            construction_type=p.get("construction_type"),
            bedrooms=p.get("bedrooms"),
            bathrooms=p.get("bathrooms"),
            addons=p.get("addons", []),
        )
    except Exception as e:
        logger.warning(f"Could not parse report JSON from model: {e}")
        return None


def _strip_json_block(reply: str) -> str:
    """Remove the ```json ... ``` block from the displayed reply."""
    start = reply.find("```json")
    if start == -1:
        return reply
    end = reply.find("```", start + 7)
    if end == -1:
        return reply
    before = reply[:start].strip()
    after = reply[end + 3:].strip()
    return (before + "\n\n" + after).strip() if after else before


async def chat(
    messages: list[ChatMessage],
    address: Optional[str] = None,
    adu_sqft: Optional[float] = None,
) -> tuple[str, Optional[ADUParams]]:
    """
    Async function — returns (clean_reply, ADUParams | None).
    Must be awaited from an async context (FastAPI router).
    ADUParams is returned only when the model has collected all required info.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable not set. "
            "Get a free key at aistudio.google.com."
        )

    # Build conversation history string for context injection
    history_text = ""
    for msg in messages[:-1]:  # All messages except the latest
        role = "User" if msg.role == "user" else "Assistant"
        history_text += f"{role}: {msg.content}\n\n"

    last_user_msg = messages[-1].content if messages else ""

    instructions = _build_context(address, adu_sqft)
    if history_text:
        instructions += f"\n\n---\n**Conversation so far:**\n{history_text}"

    agent = Agent(
        name="ADU Financial Advisor",
        instructions=instructions,
        model=LitellmModel(model=_GEMINI_MODEL, api_key=api_key),
    )

    try:
        result = await Runner.run(agent, input=last_user_msg)
    except Exception as e:
        logger.error(f"Agents SDK / Gemini error: {e}")
        raise RuntimeError(str(e)) from e

    raw_reply = result.final_output
    params = _extract_params(raw_reply)
    clean_reply = _strip_json_block(raw_reply)
    return clean_reply, params  