# 12-38 Agent User Web Mobile Horizontal Fan Carousel

## Version

V1.8.30

## Goal

This update replaces the experimental vertical mobile card switching with a mobile horizontal fan-style carousel that stays visually aligned with the desktop carousel direction while keeping a mobile-specific layered presentation.

## User-facing changes

- Mobile Agent cards are displayed horizontally.
- The selected Agent card is centered and shown normally.
- The previous and next candidate cards are partially visible on the left and right.
- Candidate cards are tilted, scaled down, lightly blurred, and placed behind the selected card to create a fan-shaped hierarchy.
- Status dots are moved back below the card and arranged horizontally.
- Swipe left/right switches cards in a loop.
- Every card remains mounted as an individual `AgentFlipCard` inside one `agent-card-deck` container.
- Existing mobile header behavior is preserved:
  - `Tokens` remains below `DID Agent Partner`.
  - `Select your partner` keeps 20px vertical spacing.

## Interaction policy

Mobile switching now follows the desktop mental model again:

- swipe left: next Agent;
- swipe right: previous Agent;
- tap a side candidate card: select that Agent;
- side cards do not expose internal controls while inactive;
- the active card remains the only card with enabled inner controls.

## Implementation notes

The Home page keeps all cards mounted and uses the `data-distance` attribute to express each card's current slot:

- `0`: active center card;
- `-1`: previous candidate card;
- `1`: next candidate card;
- `99`: hidden off-stack card.

The mobile fan layout is applied through `.agent-carousel--mobile-fan`, which overrides mobile transforms, filter, opacity, and pointer-event behavior without remounting cards.

## Files

- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/package.json`

## Notes

This version intentionally avoids package-lock generation so local installs use the user's own public npm registry configuration.
