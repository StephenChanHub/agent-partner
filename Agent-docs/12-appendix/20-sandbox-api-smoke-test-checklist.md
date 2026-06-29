# Sandbox API Smoke Test Checklist v1.6.1

## 1. 基础服务

- [ ] `npm install` 成功
- [ ] `npm run start:sandbox` 成功
- [ ] `GET /api/health` 返回 OK
- [ ] `GET /api/system/status` 返回 `mode=sandbox`

## 2. Auth

- [ ] `POST /api/auth/login` 管理员登录成功
- [ ] 返回 `accessToken`
- [ ] `GET /api/me` 返回 `role=ADMIN`

## 3. Agent

- [ ] `GET /api/agents` 返回 published agents
- [ ] `GET /api/studio/agents` 返回 admin agents
- [ ] `POST /api/studio/agents` 创建 mock agent
- [ ] `PATCH /api/studio/agents/{id}` 更新 mock agent
- [ ] `POST /api/studio/agents/{id}/publish` 返回 success

## 4. Model Library

- [ ] `GET /api/studio/model-profiles`
- [ ] `POST /api/studio/model-profiles`
- [ ] `POST /api/studio/model-profiles/{id}/test`

## 5. Voice Library

- [ ] `GET /api/studio/voice-profiles`
- [ ] `POST /api/studio/voice-profiles`
- [ ] `POST /api/studio/voice-profiles/{id}/test`
- [ ] 测试接口返回 mock audio url

## 6. User / Billing

- [ ] `GET /api/studio/users`
- [ ] `POST /api/studio/users/{id}/tokens/adjust`
- [ ] `GET /api/studio/users/{id}/transactions`
- [ ] `GET /api/studio/users/{id}/recharge-orders`

## 7. Runtime

- [ ] `POST /api/chat`
- [ ] `POST /api/voice`
- [ ] `GET /api/runtime/audio/temp/{audioId}`

## 8. 错误格式

- [ ] 无效请求返回统一错误结构
- [ ] 余额不足返回 `INSUFFICIENT_BALANCE`
- [ ] 无权限返回 `FORBIDDEN`
- [ ] 未登录返回 `UNAUTHORIZED`

## 9. CORS

- [ ] `http://localhost:5174` 可以访问 API
- [ ] `http://localhost:5173` 可以访问 API

## 10. 通过标准

全部通过后，进入：

```text
v1.7 Jarvis Studio Web
```
