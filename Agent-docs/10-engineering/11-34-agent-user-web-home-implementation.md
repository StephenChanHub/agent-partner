# 11-34 Agent User Web Home Implementation

Version: v1.8

## Project

```text
Agent-user web/
```

Tech stack:

```text
React
Vite
TypeScript
CSS Modules-style page CSS
```

This is intentionally lighter than Admin Studio. The first user-facing page does not need Ant Design or state libraries yet.

## Files

```text
Agent-user web/
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .env.local.example
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── config/agents.ts
    ├── components/InitialAvatar.tsx
    ├── components/InitialAvatar.css
    ├── pages/HomePage.tsx
    ├── pages/HomePage.css
    └── styles/global.css
```

## UI-only implementation

The current page uses static local mock data from `src/config/agents.ts`. This keeps the DOM and UI stable while leaving API wiring for the next version.

The carousel uses native CSS:

```text
overflow-x: auto
scroll-snap-type: x mandatory
scroll-snap-align: center
```

No React state is used for selection in v1.8.

## Reserved production path

The future production path should replace static `homeAgents` with Core API data:

```text
GET /agents
```

The API response may include avatar/image fields later, but the user web must continue to support the fallback initial avatar policy.
