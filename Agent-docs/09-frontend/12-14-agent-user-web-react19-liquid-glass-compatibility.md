# 12-14 Agent User Web React 19 Liquid Glass Compatibility

Version: v1.8.4

## Purpose

`liquid-glass-react@1.1.1` requires `react >=19` as a peer dependency. The user web project previously used React 18, which caused `npm install` to fail with `ERESOLVE unable to resolve dependency tree`.

This version upgrades only `Agent-user web` to React 19 so that the Liquid Glass card implementation can be installed without forcing npm to ignore peer dependency rules.

## Scope

Updated project:

```text
Agent-user web/
```

Not changed:

```text
Agent-backend/
Agent-Studio Web/
Agent-docs/
```

## Policy

Do not run:

```bash
npm install --force
npm install --legacy-peer-deps
```

The normal install path must work:

```bash
cd "Agent-user web"
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Dependency baseline

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "liquid-glass-react": "^1.1.1",
  "@types/react": "^19.0.0",
  "@types/react-dom": "^19.0.0"
}
```

## Rationale

`Agent-user web` is a standalone Vite app. Upgrading it to React 19 does not force the admin studio project to upgrade at the same time. This keeps the fix isolated and avoids unsafe peer dependency overrides.
