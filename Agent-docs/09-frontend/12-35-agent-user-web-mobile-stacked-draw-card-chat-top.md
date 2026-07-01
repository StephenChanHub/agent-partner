# 12-35 Agent User Web Mobile Stacked Draw-Card & Chat Top Flush

## Version

v1.8.27

## Scope

This frontend update changes the mobile Agent selection experience and adjusts the chat shell header position.

## Mobile Agent card browsing

The mobile Home page no longer renders a flat single-card TikTok switch. It now renders three layered cards:

- Previous Agent card behind the active card.
- Active Agent card on the top layer.
- Next Agent card behind the active card.

The previous and next cards protrude by approximately 20% of card height. Candidate cards use a lower z-index, reduced opacity, softer shadow, and slight blur so the active card reads as the primary interactive layer.

## Switching behavior

- Swipe up: switch to the next Agent.
- Swipe down: switch to the previous Agent.
- List switching loops circularly.
- The active card enters with a draw-card animation from the direction of travel.
- Candidate cards settle behind the active card after each switch.

## Status indicator

Mobile carousel status dots remain on the right side and are arranged vertically.

## Flip interaction guard

The Agent card face switch is reinforced with both `visibility` and `pointer-events` rules:

- Front state: front face visible and clickable; back face hidden and disabled.
- Back state: back face visible and clickable; front face hidden and disabled.

This prevents the hidden face from stealing desktop or mobile interactions.

## Chat shell

The chat header is now fixed at `top: 0px`, making the top container flush with the page top.
