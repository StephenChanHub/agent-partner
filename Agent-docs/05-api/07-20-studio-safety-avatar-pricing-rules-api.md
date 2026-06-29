# v1.7.3 Studio Safety, Avatar Policy & Pricing Rules API

## 删除 API

v1.7.3 为 Studio 补齐删除接口。

```http
DELETE /studio/agents/{id}
DELETE /studio/model-profiles/{id}
DELETE /studio/voice-profiles/{id}
```

返回：

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "agent_001"
  }
}
```

前端必须在调用删除前执行两次确认。

## Pricing Rules API

```http
GET    /studio/billing/pricing-rules
POST   /studio/billing/pricing-rules
PATCH  /studio/billing/pricing-rules/{id}
DELETE /studio/billing/pricing-rules/{id}
```

Pricing Rule 对象：

```json
{
  "id": "pricing_rule_billing_multiplier",
  "key": "billingMultiplier",
  "label": "计费倍率",
  "group": "CORE",
  "valueType": "NUMBER",
  "value": 1.5,
  "unit": "x",
  "description": "用户最终收费 = 原始成本 × 计费倍率。",
  "editable": true,
  "status": "ACTIVE",
  "sortOrder": 20,
  "createdAt": "2026-06-01T10:00:00.000Z",
  "updatedAt": "2026-06-29T10:00:00.000Z"
}
```

## 充值套餐删除

充值套餐已在 v1.7.1 支持删除。本版强化前端删除确认：

```http
DELETE /studio/billing/packages/{id}
```

## 头像字段策略

Agent Manifest 继续保留：

```json
{
  "identity": {
    "avatarUrl": ""
  }
}
```

但 Studio Web 不开放头像 URL 输入或文件上传；头像 UI 统一由前端使用首字符生成。
