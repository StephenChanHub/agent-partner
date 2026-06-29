# 11-31 Voice Preview & Agent Voice Selection Implementation

Version: v1.7.2

## Frontend changes

Added:

```text
Agent-Studio Web/src/pages/voice-profiles/VoiceEditPage.tsx
```

Updated:

```text
VoiceProfilesPage.tsx
AgentEditPage.tsx
AppRouter.tsx
api/studio.ts
types/api.ts
styles/global.css
```

## Backend changes

Updated:

```text
mock/mock-data.ts
voice-profiles.controller.ts
voice-profiles.service.ts
create-voice-profile.dto.ts
update-voice-profile.dto.ts
```

## Important sandbox constraint

Local preview audio upload in Studio Web is intentionally browser-only.

Do not add file upload persistence until the storage model is formally designed.

Future real upload must define:

- accepted mime types
- max file size
- storage backend
- file cleanup policy
- access control
- CDN/public URL policy
