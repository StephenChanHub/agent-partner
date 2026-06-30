# Agent Platform v1.8.21 - User Web Chat Glass, Profile Password & Sound Icon Polish

This package keeps the project root structure:

- `Agent-docs/` — project documentation
- `Agent-backend/` — Core backend sandbox
- `Agent-Studio Web/` — admin web sandbox
- `Agent-user web/` — user web sandbox

## V1.8.21 highlights

- Chat page top and bottom glass containers exchange transparency / blur intensity.
- Profile Personal section adds a sandbox password change block with production auth API reserved.
- Agent card voice preview button no longer uses the `🎵` character; it now renders a custom SVG icon made from three arcs.
- Agent card `START` text is uppercase.
- Agent card `START` buttons keep a stronger hover-lift interaction.

## Run user web

```bash
cd "Agent-user web"
rm -rf node_modules package-lock.json
npm install
npm run dev
```

Open `http://127.0.0.1:5174`.

## Sandbox note

All user-facing auth, profile, wallet, and chat actions remain local mock flows. The UI structure keeps the production API replacement path intact: profile password changes can later connect to Core auth endpoints without rewriting the page layout.
