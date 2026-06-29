# Timeout, Retry and Circuit Breaker Policy v1.5

## 1. 目标

Jarvis Core 会依赖多个外部系统：LLM、TTS、STT、Redis、Device WebSocket、Robot Transport。

这些系统都可能失败，所以必须从 v1.5 开始定义失败策略。

---

## 2. Timeout 默认值

| 能力 | 默认超时 | 说明 |
|---|---:|---|
| LLM generate | 30s | 普通文本回复 |
| LLM stream first token | 10s | 首 token 超时 |
| TTS synthesize | 20s | 语音合成 |
| STT transcribe | 20s | 语音识别 |
| Redis operation | 1s | 缓存读写 |
| Device send event | 3s | WebSocket 发送 |
| Robot MOVE / TURN | 5s | 基础动作 |
| Robot STOP | 1s | 急停 |
| Robot DOCK | 60s | 回充 |

---

## 3. Retry 策略

可以重试：

```text
Redis 短暂失败
LLM 网络超时
TTS 网络超时
WebSocket 暂时发送失败
```

禁止盲目重试：

```text
Robot MOVE
Robot TURN
Robot FOLLOW
任何可能造成重复物理动作的命令
```

机器人动作只能由设备端 ACK 后确认状态，不允许 Core 因网络抖动重复发送危险动作。

---

## 4. Circuit Breaker

以下服务需要熔断策略：

```text
LLM Provider
TTS Provider
STT Provider
Robot Transport
```

触发条件：

```text
连续 5 次失败
或 60 秒内失败率超过 50%
```

熔断后：

```text
LLM → 返回系统繁忙提示
TTS → 返回文本响应，不播放语音
STT → 提示语音识别暂不可用
Robot → 禁止动作，仅允许 STOP
```

---

## 5. 降级策略

```text
Gemini 不可用 → Mock / fallback message
ElevenLabs 不可用 → 文本响应
Redis 不可用 → MemoryCache 临时降级
Device WebSocket 不可用 → Dashboard 显示设备离线
Robot Transport 不可用 → 拒绝动作并记录失败
```

---

## 6. 错误对象

统一错误结构：

```typescript
export interface InfrastructureError {
  code: string;
  message: string;
  provider?: string;
  retryable: boolean;
  traceId?: string;
  cause?: unknown;
}
```

---

## 7. 物理安全优先级

机器人动作遵循：

```text
STOP > Safety Check > Device Local Decision > Core Command > User Intent
```

任何时候，STOP 都高于聊天、语音、表情、播放、移动。
