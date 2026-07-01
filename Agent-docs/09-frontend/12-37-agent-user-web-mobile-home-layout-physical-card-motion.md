# 12-37 Agent User Web Mobile Home Layout & Physical Card Motion

## Scope

V1.8.29 continues the mobile Home optimization from V1.8.28. It focuses on layout rhythm and more natural card motion.

## Mobile header

The mobile header now groups the product name and balance together:

- `DID Agent Partner` remains in the top-right area.
- `Tokens` is moved directly below the product name.
- The token badge is no longer fixed at the bottom on mobile.
- Desktop keeps the existing floating token behavior.

## Select title rhythm

The `Select your partner` block now has a fixed 20px vertical rhythm on mobile:

- 20px above the title block.
- 20px below the title block.
- The title remains smaller than earlier mobile versions to preserve space for the card deck.

## Card deck structure

The mobile Agent list remains a mounted native deck:

- one deck container owns all cards;
- every `AgentFlipCard` stays mounted with a stable key;
- switching only changes stack distance and animation classes;
- this avoids remount flicker and unstable card overlap.

## Physical vertical motion

Card switching now uses a physical motion model:

- upward swipe switches to the next Agent;
- the incoming next card is prepared outside the lower viewport first;
- after the active index changes, it moves upward into the center;
- downward swipe switches to the previous Agent;
- the leaving card moves completely downward outside the viewport;
- easing is tuned with a stronger inertia-like cubic-bezier curve.

## Candidate cards

The previous and next cards remain visible behind the active card:

- candidate card protrusion is 20% of card height;
- candidates are lower z-index layers;
- candidates have lighter opacity, softer shadow, and light blur;
- candidates are not interactive while inactive.

## Compatibility

The zoom lock, flip-card behavior, and right-side vertical status dots from earlier versions are preserved.
