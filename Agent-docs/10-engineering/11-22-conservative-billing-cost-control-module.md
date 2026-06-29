# Conservative Billing & Cost Control Module v1.0

## 1. 模块定位

该模块负责把真实 API 用量换算成 Agent Tokens，并在 Runtime 中执行保守成本控制。

它不负责：

```text
真实支付
订单
退款
发票
复杂套餐
```

---

## 2. 核心服务

```text
PricingService
BillingGuardService
UsageMeterService
UsageRepository
```

职责：

```text
PricingService      读取当前价格配置，计算成本
BillingGuardService 检查最低余额与语音二次余额
UsageMeterService   从 LLM / STT / TTS usage 生成 usage_records
UsageRepository     写入明细并更新用户余额
```

---

## 3. 配置项

```env
AGENT_TOKENS_PER_RMB=1000
BILLING_MULTIPLIER=1.5
TEXT_CHAT_MIN_BALANCE_AGENT_TOKENS=100
VOICE_CHAT_MIN_BALANCE_AGENT_TOKENS=1000
VOICE_REPLY_MAX_CHARS=200

DEEPSEEK_INPUT_CACHE_HIT_RMB_PER_MILLION=0.02
DEEPSEEK_INPUT_CACHE_MISS_RMB_PER_MILLION=1
DEEPSEEK_OUTPUT_RMB_PER_MILLION=2

ELEVENLABS_TTS_RMB_PER_100K_CHARS=35
```

---

## 4. Runtime 集成点

文字聊天：

```text
BillingGuard.assertCanStartTextChat
↓
LLM Router
↓
UsageMeter.fromDeepSeekUsage
↓
UsageRepository.charge
```

语音聊天：

```text
BillingGuard.assertCanStartVoiceChat
↓
STT
↓
LLM Router
↓
扣 LLM 消耗
↓
根据 assistant 文本字符数计算 TTS 预估扣费
↓
BillingGuard.assertCanGenerateVoice
↓
余额足够：ElevenLabs + 扣 TTS
余额不足：跳过 TTS，只返回文字
```

---

## 5. 失败处理

```text
DeepSeek 失败：不扣 LLM 用量
ElevenLabs 失败：不扣 TTS 用量
生成文字成功但语音余额不足：扣 LLM，不扣 TTS
语音生成成功但客户端未下载：仍扣 TTS，因为成本已经发生
```

---

## 6. V1 计费模式

```text
TRACK_ONLY  只记录 usage，不拦截，不扣余额
ENFORCE     检查余额，扣 Agent Tokens
```

开发阶段：

```env
BILLING_MODE=TRACK_ONLY
```

准备测试商业化：

```env
BILLING_MODE=ENFORCE
```

---

## 7. 不做精确预估

V1 只做：

```text
最低余额门槛
实际 usage 扣费
语音二次检查
余额不足降级文字
```

不做：

```text
预扣
冻结
解冻
退款
精确对话前估价
```
