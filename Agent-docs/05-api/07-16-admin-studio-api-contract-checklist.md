# Admin Studio API Contract Checklist v1.6.1

## 1. 目的

本文件确认管理员网页端开发前必须稳定的 API 契约。

管理员端不是等真实服务接入后再开发，而是先对接 Sandbox Mock API。

## 2. Auth

| 功能 | Method | Path | 用途 |
|---|---:|---|---|
| 管理员登录 | POST | `/auth/login` | 获取 ADMIN JWT |
| 当前用户 | GET | `/me` | 判断 role=ADMIN |
| 登出 | POST | `/auth/logout` | 清理前端 token |

## 3. Studio Dashboard

| 功能 | Method | Path |
|---|---:|---|
| 仪表盘概览 | GET | `/studio/overview` |
| 系统状态 | GET | `/system/status` |
| 计费规则 | GET | `/billing/pricing` |

## 4. Agent 管理

| 功能 | Method | Path |
|---|---:|---|
| 管理员 Agent 列表 | GET | `/studio/agents` |
| Agent 详情 | GET | `/studio/agents/{id}` |
| 创建 Agent | POST | `/studio/agents` |
| 更新 Agent | PATCH | `/studio/agents/{id}` |
| 发布 Agent | POST | `/studio/agents/{id}/publish` |
| 禁用 Agent | POST | `/studio/agents/{id}/disable` |
| 测试文字回复 | POST | `/studio/agents/{id}/test-chat` |
| 测试语音回复 | POST | `/studio/agents/{id}/test-voice` |

### Agent V1 表单字段

```json
{
  "name": "Coding Mentor",
  "slug": "coding-mentor",
  "description": "A senior coding mentor.",
  "avatarUrl": "/uploads/agents/coding/avatar.png",
  "social": {
    "galleryImages": [],
    "galleryVideos": []
  },
  "modelProfileId": "model_profile_mock",
  "voiceProfileId": "voice_profile_mock",
  "configPrompt": "你是 Coding Mentor...",
  "status": "DRAFT"
}
```

## 5. Model Library

| 功能 | Method | Path |
|---|---:|---|
| 模型列表 | GET | `/studio/model-profiles` |
| 创建模型 | POST | `/studio/model-profiles` |
| 更新模型 | PATCH | `/studio/model-profiles/{id}` |
| 测试连接 | POST | `/studio/model-profiles/{id}/test` |
| 设为默认 | POST | `/studio/model-profiles/{id}/set-default` |

V1 Sandbox：测试连接返回 Mock success。

## 6. Voice Library

| 功能 | Method | Path |
|---|---:|---|
| 音色列表 | GET | `/studio/voice-profiles` |
| 创建音色 | POST | `/studio/voice-profiles` |
| 更新音色 | PATCH | `/studio/voice-profiles/{id}` |
| 试听音色 | POST | `/studio/voice-profiles/{id}/test` |
| 设为默认 | POST | `/studio/voice-profiles/{id}/set-default` |

V1 Sandbox：试听返回 temp audio mock URL。

## 7. 用户管理

| 功能 | Method | Path |
|---|---:|---|
| 用户列表 | GET | `/studio/users` |
| 用户详情 | GET | `/studio/users/{id}` |
| 用户 Usage | GET | `/studio/users/{id}/usage` |
| 用户 Usage 明细 | GET | `/studio/users/{id}/usage-records` |
| 用户充值订单 | GET | `/studio/users/{id}/recharge-orders` |
| 用户余额流水 | GET | `/studio/users/{id}/transactions` |
| 管理员手动加 tokens | POST | `/studio/users/{id}/tokens/adjust` |

## 8. Billing / Wallet

| 功能 | Method | Path |
|---|---:|---|
| 计费规则 | GET | `/billing/pricing` |
| 套餐列表 | GET | `/billing/packages` |
| 订单列表 | GET | `/billing/recharge-orders` |
| 订单详情 | GET | `/billing/recharge-orders/{id}` |
| Mock 支付 | POST | `/billing/recharge-orders/{id}/mock-pay` |
| 余额流水 | GET | `/billing/transactions` |

## 9. 统一响应格式

所有接口必须返回：

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

错误返回：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request."
  }
}
```

## 10. 进入管理员端开发的最低条件

```text
Auth / Agent / Model / Voice / User / Billing 六组接口结构稳定。
```
