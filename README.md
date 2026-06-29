# Agent Platform v1.7.2 — Voice Preview & Agent Voice Selection

This package contains the full Jarvis / Agent Platform sandbox project.

## Root structure

```text
Agent-docs/        All project documentation
Agent-backend/     NestJS sandbox backend / Jarvis Core
Agent-Studio Web/  React + Vite admin web console
```

## v1.7.2 focus

- Voice Profile has a formal `previewAudioUrl` field.
- Voice Profile list supports inline audio preview.
- Voice Profile editor is a dedicated page:
  - `/voice-profiles/new`
  - `/voice-profiles/:id/edit`
- Voice editor supports local preview audio selection with browser-only `objectURL`.
- Local preview audio is not uploaded to UTM Ubuntu and is not persisted.
- Agent editor only selects published/active Voice Profiles.
- Agent editor shows selected Voice preview audio from `VoiceProfile.previewAudioUrl`.
- Backend mock API adds Voice publish/disable and preview-audio reserved endpoint.

## Local topology

```text
Mac host:
Agent-Studio Web → http://localhost:5173

UTM Ubuntu:
Agent-backend → http://192.168.64.2:3000/api
```

## Run backend in UTM Ubuntu

```bash
cd Agent-backend
cp .env.sandbox.example .env
npm install
npm run start:sandbox
```

## Run Studio Web on Mac

```bash
cd "Agent-Studio Web"
cp .env.local.example .env.local
npm install
npm run dev
```

Admin sandbox account:

```text
admin@jarvis.local
admin123456
```

v1.7.2 remains sandbox-only: no real DeepSeek, no real ElevenLabs, no real payment, no production server deployment.
