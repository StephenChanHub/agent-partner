# Usage & Billing API v1.5.8

## 1. API 目标

Usage API 服务两个端：

```text
Dashboard：普通用户查看自己的 Agent Tokens 余额和用量
Studio：管理员查看所有用户的余额和用量
```

V1 不提供真实支付 API，只提供查询、充值套餐展示和管理员调整余额能力。

---

## 2. 用户端 API

### GET /me/usage

用户查看自己的 Agent Tokens 余额与累计消耗。

Response:

```json
{
  "balanceAgentTokens": 5000,
  "usedAgentTokens": 2400,
  "billingMode": "ENFORCE",
  "minimumTextBalance": 100,
  "minimumVoiceBalance": 1000,
  "canUseTextChat": true,
  "canUseVoiceChat": true
}
```

---

### GET /billing/pricing

获取当前平台计费规则。

Response:

```json
{
  "currencyName": "Agent Tokens",
  "agentTokensPerRmb": 1000,
  "billingMultiplier": 1.5,
  "minimumTextBalance": 100,
  "minimumVoiceBalance": 1000,
  "voiceReplyMaxChars": 200,
  "rates": {
    "deepseek": {
      "inputCacheHitPerMillionTokensAgentTokens": 30,
      "inputCacheMissPerMillionTokensAgentTokens": 1500,
      "outputPerMillionTokensAgentTokens": 3000
    },
    "elevenlabs": {
      "ttsPerCharacterAgentTokens": 0.525,
      "ttsPer100CharactersAgentTokens": 52.5
    }
  }
}
```

---

### GET /billing/packages

充值页展示用。V1 可以先不接真实支付。

Response:

```json
{
  "packages": [
    { "rmb": 5, "agentTokens": 5000 },
    { "rmb": 10, "agentTokens": 10000 },
    { "rmb": 30, "agentTokens": 30000 },
    { "rmb": 50, "agentTokens": 50000 },
    { "rmb": 100, "agentTokens": 100000 }
  ]
}
```

---

### GET /me/usage-records

用户查看自己的用量明细。

Query:

```text
page
pageSize
type
from
to
```

Response:

```json
{
  "items": [
    {
      "id": "usage_xxx",
      "type": "LLM_USAGE",
      "agentId": "agent_xxx",
      "agentSessionId": "session_xxx",
      "inputTokens": 1000,
      "outputTokens": 200,
      "totalTokens": 1200,
      "rawCostCny": 0.0014,
      "billingMultiplier": 1.5,
      "costTokens": 3,
      "createdAt": "2026-06-27T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

---

## 3. 管理员 API

### GET /studio/users

管理员用户列表需要展示余额和最后上线时间。

Response:

```json
{
  "items": [
    {
      "id": "user_xxx",
      "email": "user@example.com",
      "nickname": "Stephen",
      "role": "USER",
      "balanceAgentTokens": 100000,
      "usedAgentTokens": 2400,
      "lastSeenAt": "2026-06-27T10:00:00Z",
      "createdAt": "2026-06-01T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

---

### GET /studio/users/:id/usage

查看某个用户的余额与用量汇总。

Response:

```json
{
  "userId": "user_xxx",
  "balanceAgentTokens": 100000,
  "usedAgentTokens": 2400,
  "llmTokens": 2000,
  "ttsCharacters": 1800,
  "sttSeconds": 42
}
```

---

### GET /studio/users/:id/usage-records

查看某个用户的用量明细。

---

### POST /studio/users/:id/balance/adjust

管理员手动调整用户 Agent Tokens 余额。

Request:

```json
{
  "deltaAgentTokens": 100000,
  "reason": "Initial test balance"
}
```

Response:

```json
{
  "userId": "user_xxx",
  "balanceAgentTokens": 200000
}
```

V1 不单独建 balance_transactions 表，调整动作通过 `usage_records` 记录。

---

## 4. Runtime 的计费行为

Runtime Chat API 不需要让前端传 usage。

用量只能由服务端采集：

```text
LLM Adapter 返回 token usage
STT Adapter 返回 audio seconds
TTS Adapter 返回 character count
Usage Meter 汇总
Pricing Service 换算 Agent Tokens
Usage Service 写入 usage_records
```

---

## 5. 余额不足错误 / 降级

文字余额不足：

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "余额不足，请充值后继续文字对话。"
  }
}
```

语音余额不足但文字已生成：

```json
{
  "message": {
    "id": "msg_assistant_xxx",
    "content": "今天天气晴。"
  },
  "audio": null,
  "billing": {
    "status": "TEXT_ONLY_DUE_TO_INSUFFICIENT_VOICE_BALANCE",
    "reason": "余额不足，未生成语音。"
  }
}
```

---

## 6. 安全规则

```text
普通用户只能看自己的 usage
管理员可以看所有用户 usage
前端不能伪造 inputTokens / outputTokens
日志中不能打印外部 API Key
Usage Record 一旦写入，不建议修改
历史 pricing_snapshot 必须保留，方便解释历史扣费
```
