# 07-22 Agent User Web Home API Readiness

Version: v1.8

The v1.8 user web home page does not call any API yet.

Future API integration target:

```http
GET /agents
```

Expected future display fields:

```json
{
  "id": "agent_001",
  "slug": "nexus",
  "name": "Nexus",
  "description": "A calm AI partner for daily planning.",
  "avatarUrl": null,
  "status": "PUBLISHED"
}
```

Rules:

- Only published agents should be visible to users.
- `avatarUrl` is reserved.
- If `avatarUrl` is empty or disabled by policy, render blue initial avatar.
- `start` will later navigate to a permanent Agent Session.
