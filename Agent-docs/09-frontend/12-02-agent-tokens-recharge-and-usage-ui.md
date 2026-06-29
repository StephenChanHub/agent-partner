# Agent Tokens Recharge & Usage UI v1.0

## 1. 页面目标

V1 的充值页不负责真实支付，只负责让用户理解：

```text
Agent Tokens 是什么
余额还剩多少
文字和语音为什么扣费不同
简单对话大概会消耗多少
```

---

## 2. 展示文案

建议大白话：

```text
Agent Tokens 是 Jarvis 的平台余额。
1 RMB = 1000 Agent Tokens。
文字聊天主要消耗大模型 tokens，费用较低。
语音聊天会额外消耗语音合成字符数，费用较高。
```

---

## 3. 充值包展示

V1 初始展示：

```text
5 RMB = 5000 Agent Tokens
10 RMB = 10000 Agent Tokens
30 RMB = 30000 Agent Tokens
50 RMB = 50000 Agent Tokens
100 RMB = 100000 Agent Tokens
```

V1 可以先不接支付，按钮显示为：

```text
Coming Soon
```

或仅管理员测试环境可手动赠送。

---

## 4. 对话页余额提示

文字模式：

```text
余额低于 100 Agent Tokens 时：
余额不足，请充值后继续文字对话。
```

语音模式：

```text
余额低于 1000 Agent Tokens 时：
余额不足，语音回复暂不可用。你仍可继续使用文字模式。
```

---

## 5. 每轮用量展示

对话完成后，消息旁边可以展示轻量用量：

```text
本轮消耗 55 Agent Tokens
```

点击展开：

```text
大模型：3 Agent Tokens
语音合成：52 Agent Tokens
余额：4945 Agent Tokens
```

---

## 6. 语音余额不足降级

如果 DeepSeek 已返回文字，但余额不足以生成 ElevenLabs 语音：

```text
余额不足，本次只生成文字回复，未生成语音。
[充值]
```

注意：不要丢弃文字回复。

---

## 7. 历史语音不存在时

如果当前浏览器没有 IndexedDB 音频：

```text
语音不在当前设备。
[重新生成语音]
```

重新生成前也要检查余额。


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
