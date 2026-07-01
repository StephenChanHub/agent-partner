# 11-62 Agent User Mobile Horizontal Fan Implementation

## Version

V1.8.30

## Scope

The implementation modifies only the user web Home page carousel presentation and touch direction. It does not change the Agent card's data model, media upload sandbox, chat route, wallet route, or auth/profile flows.

## Key engineering decisions

### 1. Keep cards mounted

The deck still renders the full `homeAgents` list into one `agent-card-deck` container. This avoids flicker caused by unmounting/remounting cards during fast touch interactions.

### 2. Use slot-based transforms

`getLoopDistance()` maps cards into the active slot, previous slot, next slot, or hidden slot.

The mobile fan CSS then applies different transforms:

- active card: centered, normal scale, no blur;
- previous card: left side, tilted, slightly blurred, reduced scale, lower z-depth;
- next card: right side, tilted, slightly blurred, reduced scale, lower z-depth;
- hidden cards: invisible and non-interactive.

### 3. Switch mobile gestures back to horizontal

Mobile now uses the same left/right direction as desktop:

- left swipe selects the next Agent;
- right swipe selects the previous Agent.

The gesture threshold still guards against accidental small drags.

### 4. Candidate card tap selection

Candidate cards can receive the outer pointer target so the Home page can detect their `data-card-index`. Their internal content remains non-interactive until the card becomes active.

### 5. Status dots below the card

The dots are no longer fixed to the right side on mobile. A sibling selector resets the dot group to normal flow under the carousel.

## Files changed

- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/package.json`
- `README.md`
- `Agent-user web/README.md`

## Local validation checklist

- `package.json` is valid JSON.
- No `node_modules` directory is included.
- No `dist` directory is included.
- No `package-lock.json` is included.
- No internal npm registry URL should be present in the package.
