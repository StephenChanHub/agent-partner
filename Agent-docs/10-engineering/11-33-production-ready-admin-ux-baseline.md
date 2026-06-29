# 11-33 Production-Ready Admin UX Baseline

Version: v1.7.4

## 1. Scope

This document defines the engineering baseline for a production-ready admin UX while still running in sandbox mode.

## 2. Frontend architecture updates

New files:

```text
Agent-Studio Web/src/config/runtime.ts
Agent-Studio Web/src/components/EnvironmentBanner.tsx
Agent-Studio Web/src/components/DataToolbar.tsx
Agent-Studio Web/src/components/ProductionReadinessPanel.tsx
Agent-Studio Web/src/components/ErrorBoundary.tsx
Agent-Studio Web/src/pages/system/SystemReadinessPage.tsx
```

Updated files:

```text
Agent-Studio Web/src/api/http.ts
Agent-Studio Web/src/layout/StudioLayout.tsx
Agent-Studio Web/src/router/AppRouter.tsx
Agent-Studio Web/src/pages/DashboardPage.tsx
Agent-Studio Web/src/pages/users/UsersPage.tsx
Agent-Studio Web/src/pages/agents/AgentsPage.tsx
Agent-Studio Web/src/pages/model-profiles/ModelProfilesPage.tsx
Agent-Studio Web/src/pages/voice-profiles/VoiceProfilesPage.tsx
Agent-Studio Web/src/styles/global.css
```

## 3. Environment configuration

`.env.local.example` now includes:

```env
VITE_APP_NAME=Jarvis Studio
VITE_APP_ENV=sandbox
VITE_API_BASE_URL=http://192.168.64.2:3000/api
VITE_API_TIMEOUT_MS=15000
VITE_ENABLE_PROD_GUARDS=true
VITE_ENABLE_AUDIT_PLACEHOLDERS=true
VITE_SUPPORT_EMAIL=admin@jarvis.local
```

Production launch should replace environment values, not page code.

## 4. HTTP client contract

`api/http.ts` is the only low-level HTTP entry.

Responsibilities:

- API base URL.
- Timeout.
- JWT Authorization header.
- Request ID.
- Client app and environment headers.
- Unified envelope unwrap.
- 401 session cleanup.
- Friendly error fallback.

## 5. Destructive operation policy

All delete operations continue to use `confirmDangerTwice`.

Future production behavior should add audit event persistence behind this same confirmation flow.

Do not add inline direct-delete buttons that bypass this utility.

## 6. Sandbox to production migration

The frontend should not care whether the backend is mock or production, as long as response contracts remain stable.

Future implementation replacements:

| Area | Current | Future |
| --- | --- | --- |
| LLM | Mock adapter | DeepSeek adapter |
| TTS | Mock adapter | ElevenLabs adapter |
| Payment | Mock payment | WeChat / Alipay |
| File upload | Browser-only preview | Object storage / local storage adapter |
| Audit | UI placeholders | audit_events persistence |
| Auth | Single admin | Multi-admin RBAC |

## 7. Acceptance

v1.7.4 is accepted when:

1. Admin login still works.
2. Environment banner displays Core readiness.
3. Users, Agents, Model Profiles and Voice Profiles support search/filter/refresh.
4. System Readiness page is accessible.
5. Existing delete double-confirm flows remain functional.
6. No production secrets are hard-coded in frontend code.
