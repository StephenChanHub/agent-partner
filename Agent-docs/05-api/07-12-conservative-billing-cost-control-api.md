# Conservative Billing & Cost Control API v1.0

## 1. API 目标

V1 需要让客户端知道：

```text
当前用户还剩多少 Agent Tokens
当前平台计费规则是什么
语音模式是否可用
每轮对话消耗了多少 Agent Tokens
余额不足时为什么没有生成语音
```

---

## 2. 公开给登录用户的接口

### GET /me/usage

返回当前用户余额和基础用量。

响应示例：

```json
{
  "balanceAgentTokens": 5000,
  "usedAgentTokens": 1280,
  "billingMode": "ENFORCE",
  "minimumTextBalance": 100,
  "minimumVoiceBalance": 1000,
  "canUseTextChat": true,
  "canUseVoiceChat": true
}
```

---

### GET /billing/pricing

返回当前平台计费说明。

响应示例：

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
  },
  "examples": [
    {
      "name": "简单语音对话",
      "description": "输入 1000 tokens，输出 200 tokens，语音 100 字符",
      "estimatedAgentTokens": 55
    }
  ]
}
```

---

### GET /billing/packages

V1 充值页展示用。V1 可以只做展示，不接真实支付。

响应示例：

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

## 3. Runtime Chat 返回用量

文字聊天响应中应包含 usage。

```json
{
  "message": {
    "id": "msg_assistant_123",
    "role": "assistant",
    "content": "今天适合继续推进 v1.6。"
  },
  "usage": {
    "llm": {
      "inputTokens": 1000,
      "outputTokens": 200,
      "cacheHitInputTokens": 0,
      "cacheMissInputTokens": 1000
    },
    "agentTokens": {
      "llmCharged": 3,
      "ttsCharged": 0,
      "totalCharged": 3,
      "balanceAfter": 4997
    }
  }
}
```

---

## 4. Voice Chat 余额不足降级

语音聊天如果 TTS 余额不足，返回文字但不返回音频。

```json
{
  "message": {
    "id": "msg_assistant_123",
    "role": "assistant",
    "content": "今天天气晴。"
  },
  "audio": null,
  "billing": {
    "status": "TEXT_ONLY_DUE_TO_INSUFFICIENT_VOICE_BALANCE",
    "reason": "余额不足，未生成语音。",
    "requiredAgentTokensForVoice": 53,
    "balanceAfterText": 30
  }
}
```

---

## 5. Studio 用户余额调整

### POST /studio/users/:id/balance/adjust

V1 仅允许管理员手动调整测试余额。

请求：

```json
{
  "deltaAgentTokens": 5000,
  "reason": "初始测试额度"
}
```

响应：

```json
{
  "userId": "user_xxx",
  "balanceAgentTokens": 5000,
  "usedAgentTokens": 0
}
```

---

## 6. V1 不提供的 API

```text
真实支付创建订单 API
退款 API
发票 API
优惠券 API
套餐购买 API
余额冻结 / 解冻 API
```

这些进入 V2。
