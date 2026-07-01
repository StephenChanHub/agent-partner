# 12-36 Agent User Web Mobile Native Card Stack Flicker Fix

## Version

v1.8.28

## Goal

Improve the mobile Home Agent card stack after v1.8.27. The previous implementation rebuilt the visible three-card stack on every switch, which could cause flicker or transient overlap on mobile devices. This version keeps all Agent cards mounted inside one deck container and lets the browser animate each card's transform natively.

## Changes

### 1. Smaller mobile title

The mobile `Select your partner` heading is reduced so the stacked card area has more visual breathing room.

### 2. Native mounted card deck

The mobile home page now renders every Agent card as a stable individual component inside one `agent-card-deck`.

Instead of replacing the visible card list on every switch, each card receives a loop-aware stack distance:

- `0` — active card
- `-1` — previous candidate card
- `1` — next candidate card
- `99` — hidden off-stack card

This preserves component identity, local card state boundaries, and browser-native transform transitions.

### 3. Flicker reduction

The active, previous, and next cards transition between stack slots with CSS transform, opacity, and filter changes. No card is remounted during normal switching, reducing flicker and overlap during fast vertical swipes.

### 4. Layered card stack retained

The mobile visual model is preserved:

- active card sits on top
- previous card protrudes from the top by 20% of card height
- next card protrudes from the bottom by 20% of card height
- candidate cards are blurred, lower z-index, and have softer shadows
- status dots remain vertical on the right
- card switching loops from last to first and first to last

### 5. Flip-state cleanup

Inactive Agent cards reset their flipped state when leaving the active slot. This avoids stale back-side states when a card returns to the active position later.

## Updated files

- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/src/components/AgentFlipCard.tsx`
- `Agent-user web/src/components/AgentFlipCard.css`
- `Agent-user web/package.json`
- `Agent-user web/README.md`
- `README.md`

## Notes

The user web remains a local sandbox. Auth, profile, wallet, chat, and media uploads still use local mock flows.
