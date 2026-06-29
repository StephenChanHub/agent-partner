# 07-21 Studio Professional Interaction API Contract

Version: v1.7.4

## 1. Request headers

Jarvis Studio now sends these headers on every API request:

```http
Authorization: Bearer <access_token>
X-Request-ID: <uuid>
X-Client-App: Jarvis Studio
X-Client-Env: sandbox
```

The backend may ignore them in sandbox, but production observability should use them.

## 2. Readiness endpoints

Jarvis Studio uses:

```http
GET /api/ready
GET /api/health
```

The UI treats these endpoints as operational status checks.

## 3. List API expectations

List endpoints should support these query parameters where applicable:

```text
keyword
status
page
pageSize
```

Current sandbox can return fixed mock data, but response shape must remain:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 0
    }
  }
}
```

## 4. Future audit API reservation

The frontend is now structured for audit events, but audit persistence is not implemented in v1.7.4.

Future API:

```http
GET /api/studio/audit-events
```

Recommended event fields:

```json
{
  "id": "audit_001",
  "actorEmail": "admin@jarvis.local",
  "action": "DELETE_AGENT",
  "resourceType": "AGENT",
  "resourceId": "agent_001",
  "severity": "DANGER",
  "createdAt": "2026-06-29T00:00:00.000Z"
}
```

## 5. Compatibility rule

Production backend must preserve the current envelope, pagination, status and error structures so Jarvis Studio pages do not need to be rewritten.
