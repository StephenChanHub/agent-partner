# 11-38 Agent User Web React 19 Compatibility

Version: v1.8.4

## Problem

The user web package used React 18 while `liquid-glass-react@1.1.1` declares React 19 or newer as a peer dependency. npm correctly blocked installation.

## Decision

Upgrade only the user web project to React 19.

## Why not use --force?

`--force` or `--legacy-peer-deps` can hide real runtime incompatibilities. The project baseline should install cleanly with plain `npm install`.

## Local recovery command

```bash
cd "Agent-user web"
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Compatibility boundary

The backend and admin studio are separate projects. Their dependency trees remain independent.
