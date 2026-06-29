# 07-17 Admin Studio API Readiness

版本：v1.6.2  
状态：已锁定为 Jarvis Studio 管理员网页端开工前 API 基线。

## 1. 目标

v1.6.2 的目标不是接入真实业务，而是让管理员网页端可以稳定对接本地沙盒后端。

本阶段必须满足：

```text
后端可启动
TypeScript 可编译
Mock API 返回稳定结构
管理员登录可用
用户管理可用
Agent 管理可用
Model Profile 可用
Voice Profile 可用
Billing / Recharge / Transaction 可用
Usage Records 可用
```

## 2. API Base URL

本地沙盒默认：

```text
http://localhost:3000/api
```

管理员端默认：

```text
http://localhost:5173
```

后端 CORS 默认允许：

```text
http://localhost:5173
http://localhost:5174
```

## 3. 统一响应格式

成功：

```json
{
  "success": true,
  "data": {},
  "message": "OK",
  "meta": {
    "traceId": "trace_...",
    "mode": "sandbox"
  }
}
```

分页：

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
  },
  "message": "OK",
  "meta": {
    "traceId": "trace_...",
    "mode": "sandbox"
  }
}
```

错误：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## 4. 管理员登录

### POST /auth/login

请求：

```json
{
  "email": "admin@jarvis.local",
  "password": "admin123456"
}
```

返回：

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "admin_mock_001",
      "email": "admin@jarvis.local",
      "role": "ADMIN"
    },
    "accessToken": "mock_access_token_admin",
    "refreshToken": "mock_refresh_token_admin"
  }
}
```

沙盒阶段不做复杂 Guard，前端仍然必须按照正式方式携带：

```text
Authorization: Bearer mock_access_token_admin
```

## 5. 管理员身份

### GET /me

用于 Jarvis Studio 刷新页面后恢复管理员身份。

如果 Header 中包含 `mock_access_token_admin`，返回管理员；否则返回普通 Mock 用户。

## 6. Dashboard

### GET /studio/dashboard

返回：

```json
{
  "users": {
    "total": 2,
    "active": 2
  },
  "agents": {
    "total": 2,
    "published": 1,
    "drafts": 1
  },
  "billing": {
    "todayRechargeRmb": 0,
    "todayUsedAgentTokens": 0,
    "transactionCount": 2
  },
  "runtime": {
    "providerMode": "mock",
    "readyForAdminStudio": true
  }
}
```

## 7. 用户管理

### GET /studio/users

查询参数：

```text
page
pageSize
keyword
```

返回字段：

```text
id
email
nickname
role
status
balanceTokens
usedTokens
createdAt
lastSeenAt
```

### GET /studio/users/{id}

返回用户详情。

### POST /studio/users/{id}/tokens/adjust

管理员手动增加 Agent Tokens。

请求：

```json
{
  "amountAgentTokens": 5000,
  "reason": "线下收款充值"
}
```

规则：

```text
只允许增加
reason 必填
不得直接修改 users.balance_tokens
必须写 agent_token_transactions
```

## 8. Agent 管理

### GET /studio/agents

返回所有 Agent，包括 DRAFT / PUBLISHED / DISABLED。

### POST /studio/agents

创建 Draft Agent。

### GET /studio/agents/{id}

查看 Agent。

### PATCH /studio/agents/{id}

编辑 Agent Manifest。

### POST /studio/agents/{id}/publish

发布 Agent。

### POST /studio/agents/{id}/disable

禁用 Agent。

V1 Agent 仍然保持简化：

```text
identity
social.galleryImages
social.galleryVideos
model.profileId
voice.profileId
config.prompt
```

## 9. Model Profile 管理

### GET /studio/model-profiles

### POST /studio/model-profiles

### GET /studio/model-profiles/{id}

### PATCH /studio/model-profiles/{id}

### POST /studio/model-profiles/{id}/test

### POST /studio/model-profiles/{id}/set-default

真实 DeepSeek API Key 暂时不要求配置。沙盒阶段返回：

```text
apiKeyConfigured: false
apiKeyMasked: ""
```

后续填入 Key 后再切换真实 Adapter。

## 10. Voice Profile 管理

### GET /studio/voice-profiles

### POST /studio/voice-profiles

### GET /studio/voice-profiles/{id}

### PATCH /studio/voice-profiles/{id}

### POST /studio/voice-profiles/{id}/test

### POST /studio/voice-profiles/{id}/set-default

真实 ElevenLabs API Key 暂时不要求配置。沙盒阶段试听接口返回临时 Mock audio URL。

## 11. Billing / Recharge / Transactions

### GET /billing/pricing

返回 Agent Tokens 价格规则。

### GET /billing/packages

返回充值套餐。

### GET /studio/recharge-orders

管理员查看所有充值订单，包括：

```text
PENDING
PAID
EXPIRED
```

### GET /studio/recharge-orders/{id}

查看订单详情。

### GET /studio/token-transactions

查看余额流水。

### GET /studio/users/{id}/recharge-orders

查看指定用户充值订单。

### GET /studio/users/{id}/transactions

查看指定用户余额流水。

## 12. Usage Records

### GET /studio/usage-records

查看全局 Usage Records。

### GET /studio/users/{id}/usage

查看用户消费汇总。

### GET /studio/users/{id}/usage-records

查看用户消费明细。

## 13. 本版不做什么

v1.6.2 不做：

```text
真实 DeepSeek 调用
真实 ElevenLabs 调用
真实微信支付
真实支付宝支付
真实数据库读写
复杂 RBAC
多管理员
生产级 JWT Guard
```

但 API 形状必须稳定，管理员端可以放心开工。
