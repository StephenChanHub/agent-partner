# 25 Studio Production Readiness Runbook

Version: v1.7.4

## 1. Local topology

Mac:

```text
Agent-Studio Web
http://localhost:5173
```

UTM Ubuntu:

```text
Agent-backend
http://192.168.64.2:3000/api
```

## 2. Start backend

```bash
cd Agent-backend
cp .env.sandbox.example .env
npm install
npm run start:sandbox
```

## 3. Start Studio Web

```bash
cd "Agent-Studio Web"
cp .env.local.example .env.local
npm install
npm run dev
```

## 4. Smoke test

Open:

```text
http://localhost:5173
```

Login:

```text
admin@jarvis.local
admin123456
```

Check:

1. Environment banner shows Core Ready.
2. Dashboard loads.
3. Users list loads and can be filtered.
4. Agents list loads and can be filtered.
5. Model Profiles list loads and can be filtered.
6. Voice Profiles list loads and can be filtered.
7. Pricing remains editable.
8. System Readiness page opens.

## 5. Production switch policy

Do not change React page code to point at production.

Change only `.env.local` or build-time environment:

```env
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.example.com/api
VITE_ENABLE_PROD_GUARDS=true
```

## 6. Before real launch

The following must be completed before real users are onboarded:

- Real database persistence.
- Real audit event storage.
- Real payment provider callbacks.
- Real object/file storage.
- Real provider key management.
- Backup and restore policy.
- Multi-admin permission model if more than one operator is needed.
