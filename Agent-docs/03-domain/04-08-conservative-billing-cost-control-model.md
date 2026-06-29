# Conservative Billing & Cost Control Model v1.0

## 1. 目标

v1.5.8 的目标不是做完整支付系统，而是在进入 v1.6 Mock API 前，把 V1 的成本边界锁定清楚。

V1 需要回答四个问题：

```text
用户的钱叫什么？
真实 DeepSeek / ElevenLabs 成本如何换算？
平台如何定价？
余额不足时如何保守降级？
```

---

## 2. 平台货币：Agent Tokens

V1 平台货币命名为：

```text
Agent Tokens
```

换算：

```text
1 RMB = 1000 Agent Tokens
1 Agent Token = 0.001 RMB
```

用户看到的是 Agent Tokens，不直接面对 DeepSeek tokens、ElevenLabs characters、STT seconds 等复杂单位。

---

## 3. 初级收费标准

V1 初级收费标准：

```text
平台扣费 = 真实成本 × 1.5
```

配置：

```text
BILLING_MULTIPLIER=1.5
```

为什么使用 1.5 倍：

```text
覆盖 API 失败重试
覆盖服务器与带宽成本
覆盖临时音频中转成本
预留运营与维护空间
保持 V1 定价简单透明
```

---

## 4. DeepSeek 初期模型策略

V1 初期大模型优先使用 DeepSeek API。

低价档成本：

```text
缓存命中输入：0.02 RMB / 1,000,000 tokens
缓存未命中输入：1 RMB / 1,000,000 tokens
输出：2 RMB / 1,000,000 tokens
```

换算为成本价 Agent Tokens：

```text
缓存命中输入：20 Agent Tokens / 1,000,000 tokens
缓存未命中输入：1000 Agent Tokens / 1,000,000 tokens
输出：2000 Agent Tokens / 1,000,000 tokens
```

换算为平台扣费价，即乘以 1.5：

```text
缓存命中输入：30 Agent Tokens / 1,000,000 tokens
缓存未命中输入：1500 Agent Tokens / 1,000,000 tokens
输出：3000 Agent Tokens / 1,000,000 tokens
```

---

## 5. ElevenLabs 语音成本策略

ElevenLabs 成本：

```text
100,000 characters ≈ 35 RMB
```

成本价 Agent Tokens：

```text
35 RMB = 35,000 Agent Tokens
1 character = 0.35 Agent Tokens
```

平台扣费价：

```text
1 character = 0.35 × 1.5 = 0.525 Agent Tokens
```

示例：

```text
100 字语音：约 52.5 Agent Tokens
200 字语音：约 105 Agent Tokens
500 字语音：约 262.5 Agent Tokens
1000 字语音：约 525 Agent Tokens
```

结论：V1 最大成本点不是 DeepSeek，而是 ElevenLabs。

---

## 6. 一轮简单语音对话成本示例

假设：

```text
输入上下文：1000 tokens，缓存未命中
输出回复：200 tokens
语音回复：100 characters
```

DeepSeek 成本价：

```text
输入：1000 × 0.001 = 1 Agent Token
输出：200 × 0.002 = 0.4 Agent Tokens
合计：1.4 Agent Tokens
```

ElevenLabs 成本价：

```text
100 × 0.35 = 35 Agent Tokens
```

总成本价：

```text
36.4 Agent Tokens
```

平台扣费价：

```text
36.4 × 1.5 = 54.6 Agent Tokens
```

向用户展示时可四舍五入：

```text
本轮消耗：55 Agent Tokens
```

---

## 7. 最低余额门槛

V1 不做精确对话前费用预估。

V1 使用最低余额门槛：

```text
文字模式最低余额：100 Agent Tokens
语音模式最低余额：1000 Agent Tokens
```

策略：

```text
余额 < 100：禁止文字对话，提示充值
余额 < 1000：允许文字模式，禁止语音生成
余额 >= 1000：允许语音模式
```

---

## 8. 分阶段扣费

V1 采用保守分阶段扣费。

文字模式：

```text
检查文字最低余额
↓
调用 DeepSeek
↓
拿到真实 usage
↓
计算 Agent Tokens
↓
扣费
↓
写 usage_records
```

语音模式：

```text
检查语音最低余额
↓
STT 转文字
↓
调用 DeepSeek
↓
扣 DeepSeek 消耗
↓
根据 assistant 文本字符数预估 ElevenLabs 消耗
↓
二次检查余额
↓
余额足够：调用 ElevenLabs，扣 TTS 消耗
余额不足：不调用 ElevenLabs，只返回文字
```

---

## 9. 为什么 V1 不做精确预估

对话前无法精确知道：

```text
模型输出多少 tokens
回复文本有多少字符
上下文命中多少缓存
是否需要语音
是否会触发重试
```

所以 V1 不承诺精确预估，只展示：

```text
预计简单语音对话约 50～150 Agent Tokens
实际以生成结果为准
```

---

## 10. 语音长度控制

V1 语音模式必须限制回复长度。

建议：

```text
VOICE_REPLY_MAX_CHARS=200
```

超过限制时：

```text
网页显示完整文字
语音只播放摘要
```

这可以显著降低 ElevenLabs 成本。

---

## 11. 用户可理解的透明说明

充值页应该说明：

```text
Agent Tokens 是 Jarvis 的平台余额。
1 RMB = 1000 Agent Tokens。
文字聊天按大模型 tokens 计费。
语音聊天会额外按语音字符数计费。
100 字语音大约消耗 53 Agent Tokens。
一轮简单语音对话通常消耗 50～150 Agent Tokens。
```

---

## 12. V1 不做什么

```text
不做真实支付网关
不做真实支付订单接入 / 复杂订单系统
不做发票系统
不做多币种
不做复杂套餐优惠
不做预扣 / 退款 / 解冻
不做精确对话前费用承诺
```

这些进入 V2。
