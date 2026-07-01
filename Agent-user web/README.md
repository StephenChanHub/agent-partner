# Agent-user web v1.8.32

React + Vite + TypeScript user client for the Jarvis Agent Platform.

## Current focus

V1.8.32 rebuilds the mobile Home Agent card interaction layer instead of continuing to patch the old carousel:

- `AgentFlipCard` remains frozen and unchanged;
- the Home page now owns a separate Motion interaction layer;
- one stable `agent-motion-fan-deck` contains all Agent cards;
- each Agent card is wrapped by its own Motion slot;
- the Motion slot controls x / y / rotate / scale / opacity / blur / z-index;
- the active card is centered and fully interactive;
- side cards are tilted, scaled, blurred, and visually behind the active card;
- farther cards remain mounted but are pushed further back;
- the mobile card container height is 124% of card height;
- mobile status dots remain below the deck and horizontal;
- mobile `Tokens` under `DID Agent Partner` and 20px Select title spacing are preserved.

## Run locally

```bash
rm -rf node_modules package-lock.json
npm config set registry https://registry.npmjs.org/
npm install
npm run dev
```

## Run for phone LAN testing

```bash
npm run dev:host
```

Open `http://<Mac-LAN-IP>:5174` on the phone.

## Notes

`package-lock.json` is intentionally not committed in this package so local installs do not inherit any internal registry URL from the build environment.
