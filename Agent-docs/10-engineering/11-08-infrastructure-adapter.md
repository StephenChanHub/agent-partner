# Jarvis Infrastructure Adapter Specification v1.5

## 1. 文档目的

v1.5 用来定义 Jarvis Core 的基础设施适配层。

从这一阶段开始，Jarvis Core 不再把 Gemini、ElevenLabs、Prisma、Redis、WebSocket、机器人硬件通信看成“可以在业务代码里直接调用的工具”，而是统一看成外部能力。

所有外部能力必须通过 Adapter 进入 Core。

---

## 2. 最高原则

> Runtime 不直接依赖任何第三方服务、数据库客户端或硬件协议。Runtime 只依赖 Port。

```text
Runtime Service
    ↓
LLMPort / TTSPort / STTPort / RobotCommandPort / CachePort
    ↓
GeminiAdapter / ElevenLabsAdapter / RedisAdapter / DeviceGatewayAdapter
```

这样做的价值：

```text
1. Gemini 可以替换成 OpenAI / Claude / DeepSeek
2. ElevenLabs 可以替换成 Azure / OpenAI TTS / 本地 TTS
3. Redis 可以替换成 KeyDB / 内存 Mock
4. 机器人通信可以从 HTTP 替换成 MQTT / WebSocket / Serial
5. 测试时可以使用 Mock Adapter，不依赖真实外部服务
```

---

## 3. 适配层目录

```text
src/
├── infrastructure/
│   ├── database/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── prisma-health.service.ts
│   │
│   ├── cache/
│   │   ├── cache.port.ts
│   │   ├── redis-cache.adapter.ts
│   │   └── memory-cache.adapter.ts
│   │
│   ├── logger/
│   │   ├── app-logger.port.ts
│   │   ├── console-logger.adapter.ts
│   │   └── request-logging.interceptor.ts
│   │
│   ├── llm/
│   │   ├── llm.port.ts
│   │   ├── gemini-llm.adapter.ts
│   │   └── mock-llm.adapter.ts
│   │
│   ├── tts/
│   │   ├── tts.port.ts
│   │   ├── elevenlabs-tts.adapter.ts
│   │   └── mock-tts.adapter.ts
│   │
│   ├── stt/
│   │   ├── stt.port.ts
│   │   └── mock-stt.adapter.ts
│   │
│   ├── device-gateway/
│   │   ├── device-gateway.port.ts
│   │   ├── websocket-device-gateway.adapter.ts
│   │   └── mock-device-gateway.adapter.ts
│   │
│   └── robot-transport/
│       ├── robot-command.port.ts
│       ├── websocket-robot-transport.adapter.ts
│       ├── http-robot-transport.adapter.ts
│       └── mock-robot-transport.adapter.ts
```

---

## 4. Port 与 Adapter 的区别

### Port

Port 是 Core 期望得到的能力定义。

例如：

```typescript
export interface LLMPort {
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
  stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk>;
}
```

### Adapter

Adapter 是对某个具体供应商或协议的实现。

例如：

```typescript
export class GeminiLLMAdapter implements LLMPort {}
export class MockLLMAdapter implements LLMPort {}
```

Runtime 只知道 `LLMPort`，不知道 `GeminiLLMAdapter`。

---

## 5. v1.5 需要落地的 Adapter

| Adapter | 类型 | V1.5 状态 | 说明 |
|---|---|---:|---|
| Config | Core | 必做 | 统一环境变量和配置校验 |
| Logger | Core | 必做 | 统一日志输出和请求追踪 |
| Prisma | Database | 必做 | 数据访问入口 |
| Redis / Memory Cache | Cache | 必做 | 实时状态、设备状态、短期事件缓存 |
| Gemini / Mock LLM | AI | 必做 | Runtime Chat Engine 使用 |
| ElevenLabs / Mock TTS | Voice | 必做 | Voice Engine 使用 |
| Mock STT | Voice | 必做 | v1.6 前先占位 |
| Device Gateway | Device | 必做 | WebSocket 下发事件到设备 |
| Robot Transport | Robot | 必做 | Robot Engine 下发动作用 |

---

## 6. 依赖注入规则

NestJS 中 Adapter 不允许由业务模块直接 `new` 出来。

必须通过 Provider 注入：

```typescript
{
  provide: LLM_PORT,
  useClass: process.env.LLM_PROVIDER === 'gemini'
    ? GeminiLLMAdapter
    : MockLLMAdapter,
}
```

---

## 7. Runtime 调用方式

Runtime 的调用形态应该是：

```typescript
@Injectable()
export class ChatEngineService {
  constructor(
    @Inject(LLM_PORT) private readonly llm: LLMPort,
  ) {}

  async answer(context: RuntimeContext) {
    return this.llm.generate({
      systemPrompt: context.agent.manifest.prompt.system,
      messages: context.recentMessages,
      userMessage: context.input.text,
    });
  }
}
```

禁止出现：

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
```

在 `runtime/` 模块中直接导入第三方 SDK。

---

## 8. Robot Transport 的特殊规则

Robot Transport 不代表“Core 直接控制电机”。

Core 只发送标准动作命令：

```json
{
  "actionType": "ROBOT_MOVE",
  "payload": {
    "direction": "FORWARD",
    "distanceCm": 40,
    "speed": "LOW"
  }
}
```

设备端必须做本地安全检查：

```text
- 电量是否足够
- 当前是否在线
- 前方是否有障碍
- 是否处于急停状态
- 最大速度和最大距离是否超限
```

Core 永远不直接控制 GPIO、电机 PWM、舵机角度。

---

## 9. v1.5 不做什么

```text
不直接接入真实 Gemini 业务逻辑
不直接实现完整 ElevenLabs 音频生成链路
不实现真实树莓派 GPIO 控制
不实现复杂机器人导航
不实现视觉识别
不实现 Planner
```

v1.5 的目标是：**把插口设计好**。

---

## 10. 完成标准

v1.5 完成后，项目应该满足：

```text
1. 所有外部服务都有 Port
2. 每个 Port 至少有 Mock Adapter
3. 真实 Adapter 有清晰骨架
4. Runtime Module 不直接依赖外部 SDK
5. Robot Module 不直接依赖硬件协议
6. Device Gateway 可被 Mock
7. v1.6 Mock API 可以直接基于这些 Adapter 开发
```
