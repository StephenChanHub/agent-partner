# v1.8.21 Agent User Web Chat Glass, Profile Password & Sound Polish

## Scope

This version polishes three user-web areas:

1. Chat page floating glass balance.
2. Profile Personal section password-change reserve.
3. Agent card voice-preview icon and START interaction.

## Chat glass swap

The chat header now uses the stronger glass blur previously used by the composer. The bottom input shell now uses the lighter header glass. This keeps the top navigation more visually anchored while making the input area less visually heavy.

## Profile password reserve

The Personal information card now includes a `Change password` block. In sandbox mode it only clears local input and shows saved feedback. Production integration should wire this block to the Core auth password endpoint later.

## Agent sound icon

The previous emoji-style voice button is replaced with an inline SVG made of three circular arc strokes. This keeps the card UI consistent across platforms and avoids emoji rendering differences.

## START button

Card start buttons now display uppercase `START` and retain hover-lift behavior.
