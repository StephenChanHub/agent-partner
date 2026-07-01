# Agent Platform v1.8.32 - Rebuilt Mobile Motion Card Interaction

This package keeps the project root structure:

- `Agent-docs/` — project documentation
- `Agent-backend/` — Core backend sandbox
- `Agent-Studio Web/` — admin web sandbox
- `Agent-user web/` — user web sandbox

## V1.8.32 highlights

- Mobile Home Agent card interaction is rebuilt instead of patched on the old carousel logic.
- `AgentFlipCard` itself remains frozen and unchanged; only the outer card interaction layer and animation container are replaced.
- Mobile deck now uses one stable Motion container plus one Motion card slot per Agent card.
- Every Agent card remains mounted as an independent component with a stable key.
- The fan layout is calculated from each card's circular offset around the active card:
  - active card is centered and fully usable;
  - previous / next cards are tilted, scaled, blurred, and layered behind the active card;
  - farther cards are also kept mounted but fade further back.
- Motion handles drag, spring return, and card slot transition.
- The mobile card container height is 124% of the card height, safely above the required 120% minimum.
- Horizontal mobile status dots stay below the card deck.
- Mobile header layout remains preserved: `Tokens` stays below `DID Agent Partner`.
- Mobile `Select your partner` 20px spacing is preserved.
- Mobile zoom lock is preserved.
- `package-lock.json` is intentionally omitted to avoid internal registry URL leakage. Run `npm install` locally to generate a clean lock file.

## Run user web

```bash
cd "Agent-user web"
rm -rf node_modules package-lock.json
npm config set registry https://registry.npmjs.org/
npm install
npm run dev
```

For phone access from the same LAN:

```bash
npm run dev:host
```

Then open the Mac LAN IP with port `5174` on the phone.

## Testing checklist

- Mobile: cards no longer flicker or overlap during switching.
- Mobile: center card can flip and all active card controls remain usable.
- Mobile: left/right drag feels like a spring fan carousel rather than a patched CSS transition.
- Mobile: side cards are visible only as fan candidates and cannot trigger inner card controls.
- Mobile: tapping a side card selects it.
- Mobile: status dots sit below the cards and are horizontal.
- Desktop: existing desktop carousel behavior remains preserved.
- Desktop and Mobile: front `i` flips to the back, back `i` flips to the front.

## Sandbox note

All user-facing auth, profile, wallet, and chat actions remain local mock flows. This version focuses on rebuilding the mobile Home card interaction layer while preserving the frozen Agent card component.
