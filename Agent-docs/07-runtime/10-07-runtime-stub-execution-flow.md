# Runtime Stub Execution Flow v1.6

## 1. 目标

v1.6 Runtime Stub 的目标是让完整链路先跑起来：

```text
Request
↓
Runtime Event
↓
Billing Guard
↓
Context Builder
↓
Prompt Assembler
↓
Mock LLM / DeepSeek Adapter Placeholder
↓
Usage Meter
↓
Optional Mock TTS / ElevenLabs Adapter Placeholder
↓
Message / Audio / Usage Response
```

## 2. 文字聊天链路

```text
POST /chat
↓
检查用户余额 >= TEXT_CHAT_MIN_BALANCE_AGENT_TOKENS
↓
读取 Agent Manifest
↓
读取 Model Profile
↓
读取 Agent Session Summary
↓
读取 Recent Messages
↓
组装 Prompt
↓
调用 LLM Port
↓
MockLLMAdapter 返回内容和 usage
↓
UsageMeter 计算 Agent Tokens
↓
保存 user message / assistant message
↓
写 usage_records
↓
写 agent_token_transactions(DEBIT)
↓
返回文字回复
```

v1.6 可以先不真正落库，但 Response 结构必须与真实落库版本一致。

## 3. 语音聊天链路

```text
POST /voice
↓
检查用户余额 >= VOICE_CHAT_MIN_BALANCE_AGENT_TOKENS
↓
STT Port 转文字
↓
复用文字聊天链路生成 assistant text
↓
根据 assistant text 字符数预估 ElevenLabs 成本
↓
二次检查余额
↓
余额足够：调用 TTS Port
↓
余额不足：只返回文字，不生成语音
↓
TempAudioService 保存短期音频
↓
返回 tempUrl + storagePolicy
```

## 4. 余额不足降级

V1 保守策略：

```text
文字余额不足：拒绝对话
语音余额不足但文字可用：允许文字回复，禁止 TTS
```

返回：

```json
{
  "assistantMessage": {
    "content": "文字回复内容"
  },
  "audio": null,
  "billingNotice": {
    "code": "INSUFFICIENT_BALANCE_FOR_TTS",
    "message": "余额不足，已返回文字回复，未生成语音。"
  }
}
```

## 5. Adapter 切换

Runtime 永远只依赖 Port：

```text
LLM_PORT
TTS_PORT
STT_PORT
```

默认：

```text
mock → MockLLMAdapter / MockTTSAdapter / MockSTTAdapter
```

真实：

```text
deepseek → DeepSeekLLMAdapter
elevenlabs → ElevenLabsTTSAdapter
```

## 6. V1 不做的事情

```text
不做 Tool Calling
不做 Robot 实际动作
不做流式语音对话
不长期保存服务端音频
不做复杂预估扣费
不接真实支付
```
