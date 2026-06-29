# Usage & Billing Domain Model v1.5.8

## 1. 这层解决什么问题

Jarvis 未来准备按量收费，所以从 V1 开始就必须知道：

```text
谁用了？
用了哪个 Agent？
用了哪个模型？
消耗了多少 input tokens？
消耗了多少 output tokens？
有没有调用 STT / TTS？
最后应该从用户余额里扣多少 Agent Tokens？
```

V1 不做完整支付系统。V1 只做“用量记录 + Agent Tokens 余额 + 保守成本控制”。

---

## 2. Agent Tokens

V1 平台货币命名为：

```text
Agent Tokens
```

换算规则：

```text
1 RMB = 1000 Agent Tokens
```

用户充值、余额、消耗全部用 Agent Tokens 展示。

---

## 3. 最小商业闭环

```text
User
↓
发起一次文字 / 语音请求
↓
Runtime 调用 LLM / STT / TTS
↓
Usage Meter 采集真实用量
↓
Pricing Service 换算 Agent Tokens
↓
写入 usage_records
↓
更新 users.used_tokens / users.balance_tokens
```

---

## 4. 初级收费标准

V1 初级收费：

```text
平台扣费 = 真实成本 × 1.5
```

也就是：

```text
BILLING_MULTIPLIER=1.5
```

---

## 5. User 的余额字段

用户表保留两个汇总字段：

```text
balance_tokens  当前 Agent Tokens 余额
used_tokens     历史累计消耗的 Agent Tokens
```

管理员页面展示：

```text
邮箱
昵称
最后上线时间
Agent Tokens 余额
累计消耗
状态
```

---

## 6. Usage Record 是计费明细

每一次 Runtime 产生真实资源消耗，都应该生成一条 `usage_records`。

例如：

```text
文字聊天：LLM_USAGE
网页语音输入：STT_USAGE + LLM_USAGE + TTS_USAGE
树莓派语音输入：STT_USAGE + LLM_USAGE + TTS_USAGE
管理员调整余额：MANUAL_ADJUSTMENT
系统赠送：SYSTEM_GRANT
```

---

## 7. 余额不足

V1 支持两种模式：

```text
TRACK_ONLY  只记录，不拦截
ENFORCE     余额不足时拒绝或降级
```

V1 推荐开发阶段：

```text
BILLING_MODE=TRACK_ONLY
```

商业化测试：

```text
BILLING_MODE=ENFORCE
```

---

## 8. 保守降级规则

```text
余额低于 100 Agent Tokens：禁止文字对话
余额低于 1000 Agent Tokens：禁止语音回复，但允许文字模式
DeepSeek 文字回复成功后，先扣 LLM 消耗
生成 ElevenLabs 前再次检查余额
余额不足时，只返回文字，不生成语音
```

---

## 9. V1 不做什么

```text
不接 Stripe / 支付宝 / 微信支付
不建 orders 表
不建 invoices 表
不做套餐系统
不做多币种
不做退款
不做企业账单
不做预扣 / 冻结 / 解冻
```

这些都是 V2 / V3。

---

## 10. 最终一句话

Usage & Billing Foundation 的目标不是马上收钱，而是让每一次 AI 和语音成本都可以被准确追踪，并用 Agent Tokens 让用户清晰理解自己的钱是怎么花的。


---

# v1.5.9 Recharge Orders Note

V1 已新增轻量充值订单和余额流水能力。相关完整说明见：

```text
03-domain/04-09-lightweight-recharge-orders-model.md
05-api/07-13-lightweight-recharge-orders-api.md
06-database/08-11-lightweight-recharge-orders-schema.md
09-frontend/12-03-wallet-recharge-orders-ui.md
10-engineering/11-23-lightweight-recharge-orders-module.md
```

关键规则：订单记录充值行为，流水记录余额变化，Usage 记录消费明细。所有余额变化都必须写 `agent_token_transactions`。
