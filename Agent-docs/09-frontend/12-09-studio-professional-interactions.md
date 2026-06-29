# 12-09 Jarvis Studio Professional Interactions

Version: v1.7.4

## 1. Goal

v1.7.4 turns Jarvis Studio from a basic sandbox admin UI into a professional admin console baseline.

The goal is not to connect production data yet. The goal is to make the interaction model production-ready so that later production launch does not require rewriting screens, routes, request flows, error handling, or destructive-operation logic.

## 2. Interaction principles

Jarvis Studio must follow these rules:

1. All list pages support refresh and operational filters.
2. Dangerous operations require warning and second confirmation.
3. API URLs must come from environment variables.
4. Pages must not directly construct low-level request URLs.
5. Sandbox-only implementation must preserve production response shapes.
6. Media upload, avatar upload, payment gateway, provider keys and audit logs are reserved behind stable UI/API boundaries.
7. The admin should always know whether the UI is connected to sandbox or production-like Core.

## 3. Added professional UX components

### EnvironmentBanner

`EnvironmentBanner` appears above every protected page.

It displays:

- Current environment.
- Core API base URL.
- Core readiness state.
- Sandbox / production guarded mode message.

This prevents accidental confusion between local sandbox and future production.

### DataToolbar

`DataToolbar` standardizes list interactions:

- Search input.
- Status filter.
- Refresh button.
- Primary actions.

This pattern is used across Users, Agents, Model Profiles and Voice Profiles.

### ProductionReadinessPanel

`ProductionReadinessPanel` summarizes which parts are ready, sandboxed, reserved, or blocked.

This makes the admin console ready for real launch planning without turning sandbox into production prematurely.

### ErrorBoundary

A top-level ErrorBoundary catches rendering failures and presents a recoverable page instead of a blank screen.

## 4. List page behavior

List pages now support:

- Search.
- Status segmented filter.
- Manual refresh.
- Row selection placeholder.
- Horizontal scroll for operational columns.
- Total count display where supported.

The row selection is intentionally added early. It prepares for future batch operations such as batch disable, batch export, batch audit, and batch migration, without changing table layouts later.

## 5. Request handling baseline

Every frontend request now sends:

- `Authorization: Bearer <token>` when logged in.
- `X-Request-ID` for traceability.
- `X-Client-App` for identifying Jarvis Studio.
- `X-Client-Env` for distinguishing sandbox, staging and production.

This does not require backend production observability yet, but it makes the client ready for it.

## 6. Production launch compatibility

v1.7.4 keeps the following production features reserved:

- Real DeepSeek adapter.
- Real ElevenLabs adapter.
- Real payment gateway.
- Real file upload for avatars, media and voice previews.
- Audit event persistence.
- Multi-admin RBAC.
- Backup, restore and migration operations.

The UI is built so those can be connected without replacing the page architecture.
