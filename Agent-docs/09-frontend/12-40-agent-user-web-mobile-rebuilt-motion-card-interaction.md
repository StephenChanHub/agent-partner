# 12-40 Agent User Web Mobile Rebuilt Motion Card Interaction

Version: v1.8.32
Scope: `Agent-user web` mobile Home Agent carousel

## Goal

Rebuild the mobile Agent card interaction layer instead of continuing to patch the previous carousel implementation.

The `AgentFlipCard` component is frozen and must not be changed for this iteration. The update only changes how Home page hosts, positions, and animates multiple card instances.

## Design decision

The mobile Home page now uses a dedicated Motion fan deck:

- `agent-motion-fan-deck`: one stable Motion parent deck.
- `agent-motion-card-slot`: one Motion-controlled slot per Agent.
- `AgentFlipCard`: unchanged child card component inside each slot.

This separates concerns:

- Card component: media, flip, start, voice, profile display.
- Deck interaction: drag, spring, fan layout, z-index, opacity, blur, scale, rotation.

## Layout algorithm

Each card receives a circular offset from the active card:

```text
-2  -1   0   1   2
        active
```

The offset drives Motion properties:

- `x`: fan spread on the horizontal axis.
- `y`: slight downward arc offset for side cards.
- `rotate`: poker-hand style rotation.
- `scale`: center card remains full-size, side cards shrink.
- `opacity`: side cards fade back.
- `filter`: side cards blur lightly.
- `zIndex`: center card is highest.

The fan curve is calculated with a trigonometric arc instead of hard-coded per-slot CSS transforms.

## Mobile container sizing

The mobile carousel container is now `124%` of card height:

```css
--mobile-deck-height: calc(var(--mobile-card-height) * 1.24);
```

This satisfies the requirement that the container must be at least `20%` taller than the card and gives Motion spring transitions enough space.

## Interaction behavior

- Drag left: switch to next Agent.
- Drag right: switch to previous Agent.
- Drag decision uses both distance and velocity.
- Motion handles drag and spring return.
- Side-card tap selects that card.
- Side cards do not expose inner controls.
- Active card keeps all inner controls usable.
- Status dots remain below the card deck and horizontally arranged.

## Files changed

```text
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/package.json
Agent-user web/README.md
README.md
```

## Preserved behavior

- Desktop carousel remains unchanged.
- Mobile zoom lock remains unchanged.
- Mobile header remains unchanged: Tokens under `DID Agent Partner`.
- `Select your partner` mobile spacing remains `20px`.
- Agent card internals remain unchanged.
