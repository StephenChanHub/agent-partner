# 11-06. Backend Dependency Rules

> Version: v1.4  
> Purpose: 防止 Jarvis Core 在开发过程中模块耦合、Runtime 失控、Infrastructure 泄漏。

## 1. 总原则

后端依赖方向必须保持单向：

```text
API Controller
↓
Application Service
↓
Domain / Runtime Engine
↓
Infrastructure Port
↓
Adapter Implementation
```

不能反向依赖。

---

## 2. 分层说明

### API Layer

```text
Controller
DTO
Guard
Interceptor
```

只负责输入输出。

### Application Layer

```text
Auth Service
Users Service
Agents Service
Sessions Service
Devices Service
Studio Service
```

负责业务用例。

### Runtime Layer

```text
Runtime Service
Intent Engine
Task Dispatcher
Chat Engine
Robot Engine
System Engine
Skill Engine
Voice Engine
```

负责事件调度和任务执行。

### Infrastructure Layer

```text
Prisma
Redis
Gemini
ElevenLabs
WebSocket
Robot Transport
Logger
Config
```

负责外部依赖。

---

## 3. 允许依赖矩阵

| From | To | 是否允许 |
|---|---|---|
| Controller | Service | ✅ |
| Controller | Repository | ❌ |
| Controller | Prisma | ❌ |
| Service | Repository | ✅ |
| Service | Other Domain Service | ✅，谨慎 |
| Runtime | Agent / Session / Message Service | ✅ |
| Runtime | PrismaService | ❌ |
| Runtime | LLMPort / TTSPort | ✅ |
| Runtime | Gemini SDK | ❌ |
| Infrastructure Adapter | Port Interface | ✅ |
| Infrastructure Adapter | Domain Service | ❌ |

---

## 4. Infrastructure Port 规范

Port 是 Runtime / Application 依赖的抽象接口。

示例：

```ts
export interface LLMPort {
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
  stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk>;
}
```

Adapter 是具体实现：

```text
GeminiAdapter implements LLMPort
OpenAIAdapter implements LLMPort
MockLLMAdapter implements LLMPort
```

Runtime 只能依赖 `LLMPort`。

---

## 5. Runtime 依赖规则

Runtime 可以调用：

```text
AgentsService
AgentSessionsService
MessagesService
DevicesService
RobotService
SystemService
LLMPort
TTSPort
STTPort
CachePort
LoggerPort
```

Runtime 不可以调用：

```text
PrismaService
Gemini SDK
ElevenLabs SDK
Motor Driver
HTTP Client 直接请求第三方
```

---

## 6. Robot 依赖规则

Robot Module 可以：

```text
校验动作
生成 Robot Command Envelope
调用 RobotCommandPort
更新 ActionRecord
```

Robot Module 不可以：

```text
直接控制 GPIO
直接控制电机驱动
直接访问摄像头
直接访问 SLAM
```

这些都属于 Device Client 或未来 Robot Transport Adapter。

---

## 7. Common 禁止膨胀

`common/` 只能放：

```text
decorators
filters
guards
interceptors
pipes
errors
types
utils
```

禁止放：

```text
业务规则
Agent 逻辑
Runtime 逻辑
Device 逻辑
Robot 逻辑
```

---

## 8. 循环依赖处理

出现循环依赖时，优先检查：

```text
是否 Service 职责过大
是否需要抽出 Port
是否需要事件通知
是否 Repository 被跨模块滥用
```

不要第一时间使用 `forwardRef()`。

`forwardRef()` 只作为最后手段。

---

## 9. v1.4 验收标准

```text
所有模块依赖方向明确
Runtime 不直接依赖 Infrastructure Adapter
Controller 不直接访问 Prisma
Robot 不直接访问硬件
Common 不包含业务逻辑
```
