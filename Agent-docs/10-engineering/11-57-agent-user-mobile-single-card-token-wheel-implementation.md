# 11-57 Agent User Mobile Single Card & Token Wheel Implementation

Version: v1.8.24

## Implementation Summary

### Home Mobile Carousel

Mobile CSS now overrides carousel distance states:

- `data-distance=0` remains visible and interactive.
- `data-distance=±1/±2` are hidden and non-interactive.
- This prevents side cards from showing on mobile while keeping desktop carousel behavior.

### Card Shadow

Mobile card shadows are softer than desktop shadows:

- Lower alpha.
- Shorter blur radius.
- Less vertical offset.

### Flip Stability

Mobile flip stability is reinforced with:

- `preserve-3d` on card and card inner.
- `backface-visibility: hidden` on both faces.
- Explicit `rotateY` and `translateZ` on front/back faces.
- Pointer events disabled during active flip.

### Wallet Digit Wheel

`RollingTokens` now renders each digit as a column containing 0-9. Each column moves using:

```css
transform: translate3d(0, calc(-<digit> * var(--slot-digit-height)), 0);
```

This creates the desired iPhone-style per-digit scrolling effect rather than a whole-number fade or jump.

### Package Lock Policy

Generated `package-lock.json` files are omitted from this package to avoid environment-specific registry URLs. Developers should run `npm install` locally to generate clean lock files.
