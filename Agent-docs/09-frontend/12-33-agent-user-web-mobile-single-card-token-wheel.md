# 12-33 Agent User Web Mobile Single Card & Token Wheel

Version: v1.8.24

## Purpose

This update fixes two mobile UX issues:

1. The Home carousel should show exactly one Agent card on mobile.
2. The Wallet balance must animate as independent digit wheels, similar to the iPhone clock time picker.

## Mobile Home Card Rules

- Desktop can still show adjacent card context.
- Mobile must show one card only.
- Side cards are hidden with opacity/visibility/pointer-events rules.
- Swipe remains active on the card area.
- Card shadow is softened on mobile to reduce visual heaviness.

## Wallet Token Wheel Rules

- Balance is rendered without comma separators in the main wheel.
- Each digit owns a vertical wheel from 0 to 9.
- Balance changes update each digit column independently.
- The track moves with `translate3d` and CSS transition.
- `aria-label` still exposes the formatted balance for accessibility.

## Current Scope

- Local mock wallet only.
- No real payment.
- No real Core wallet API integration yet.
