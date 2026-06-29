# 11-03. Runtime Module Skeleton

> Version: v1.4  
> Purpose: 定义 Jarvis Runtime 的 NestJS 模块骨架、执行链路和引擎边界。

## 1. Runtime 的定位

Runtime 不是 Chat Service。

Runtime 是 Jarvis Core 的任务调度中心：

```text
Runtime Event
↓
Runtime Context
↓
Intent Engine
↓
Task Dispatcher
├── Chat Engine
├── Robot Engine
├── System Engine
├── Skill Engine
└── Voice Engine
```

Runtime 接收的是 Event，而不是“聊天消息”。

---

## 2. Runtime 目录结构

```text
runtime/
├── runtime.module.ts
├── runtime.controller.ts
├── runtime.service.ts
├── dto/
│   ├── create-runtime-event.dto.ts
│   ├── chat-request.dto.ts
│   └── voice-request.dto.ts
├── types/
│   ├── runtime-context.types.ts
│   ├── runtime-event.types.ts
│   ├── intent.types.ts
│   └── action.types.ts
├── event/
│   ├── runtime-event.factory.ts
│   └── runtime-event-recorder.service.ts
├── context/
│   └── runtime-context.builder.ts
├── intent-engine/
│   ├── intent-engine.service.ts
│   ├── rule-intent-classifier.service.ts
│   └── llm-intent-classifier.service.ts
├── dispatcher/
│   ├── task-dispatcher.service.ts
│   └── action-router.service.ts
├── chat-engine/
│   ├── chat-engine.service.ts
│   ├── prompt-builder.service.ts
│   └── stream-response.service.ts
├── robot-engine/
│   ├── robot-engine.service.ts
│   └── robot-action-mapper.service.ts
├── system-engine/
│   └── system-engine.service.ts
├── skill-engine/
│   └── skill-engine.service.ts
└── voice-engine/
    └── voice-engine.service.ts
```

---

## 3. Runtime Controller

### HTTP Event 入口

```ts
@Controller('runtime')
export class RuntimeController {
  constructor(private readonly runtime: RuntimeService) {}

  @Post('events')
  handleEvent(@Body() dto: CreateRuntimeEventDto) {
    return this.runtime.handleEvent(dto);
  }

  @Post('chat')
  chat(@Body() dto: ChatRequestDto) {
    return this.runtime.handleChat(dto);
  }

  @Post('voice')
  voice(@Body() dto: VoiceRequestDto) {
    return this.runtime.handleVoice(dto);
  }
}
```

Controller 不应该判断：

```text
这是聊天还是移动
是否调用 Gemini
是否下发电机命令
```

这些全部属于 Runtime Service 与 Intent Engine。

---

## 4. Runtime Service 主流程

```ts
@Injectable()
export class RuntimeService {
  async handleEvent(input: CreateRuntimeEventDto): Promise<RuntimeResult> {
    const event = await this.eventFactory.create(input);
    await this.eventRecorder.recordReceived(event);

    const context = await this.contextBuilder.build(event);
    const intent = await this.intentEngine.analyze(context);
    const actions = await this.dispatcher.dispatch(context, intent);

    return this.buildResult(event, intent, actions);
  }
}
```

主流程必须保持简单，复杂逻辑下沉到引擎。

---

## 5. Runtime Context Builder

### 输入

```text
Runtime Event
```

### 输出

```ts
export interface RuntimeContext {
  event: RuntimeEvent;
  user: RuntimeUserContext;
  device?: RuntimeDeviceContext;
  agentSession?: RuntimeAgentSessionContext;
  agent?: RuntimeAgentContext;
  recentMessages: RuntimeMessage[];
  capabilities: RuntimeCapability[];
}
```

### Builder 负责加载

```text
User
Current Agent Session
Agent Manifest Snapshot
Recent Messages
Device Capabilities
Permission Context
```

Builder 不调用 LLM，不下发机器人动作。

---

## 6. Intent Engine

### 入口

```ts
analyze(context: RuntimeContext): Promise<IntentResult>
```

### 输出

```ts
export interface IntentResult {
  type: IntentType;
  confidence: number;
  slots: Record<string, unknown>;
  source: 'RULE' | 'LLM' | 'SYSTEM';
}
```

### V1/V2 Intent

```text
CHAT
AGENT_SWITCH
SYSTEM_QUERY
DEVICE_QUERY
ROBOT_MOVE
ROBOT_TURN
ROBOT_STOP
ROBOT_FOLLOW
UNKNOWN
```

### Hybrid Intent

优先使用本地规则识别低延迟命令：

```text
停止
向前
后退
左转
右转
过来
跟着我
电量多少
```

复杂问题再走 LLM classifier。

---

## 7. Task Dispatcher

Dispatcher 根据 Intent 生成 Action：

```text
CHAT → CHAT_COMPLETION Action
ROBOT_MOVE → ROBOT_COMMAND Action
SYSTEM_QUERY → SYSTEM_QUERY Action
AGENT_SWITCH → SESSION_SWITCH Action
```

```ts
export class TaskDispatcherService {
  async dispatch(context: RuntimeContext, intent: IntentResult): Promise<ActionResult[]> {
    switch (intent.type) {
      case 'CHAT':
        return this.chatEngine.run(context, intent);
      case 'ROBOT_MOVE':
      case 'ROBOT_TURN':
      case 'ROBOT_STOP':
        return this.robotEngine.run(context, intent);
      case 'SYSTEM_QUERY':
        return this.systemEngine.run(context, intent);
      default:
        return this.chatEngine.run(context, intent);
    }
  }
}
```

---

## 8. Chat Engine

职责：

```text
构建 Prompt
加载 Agent Manifest
加载最近消息
调用 LLMPort
处理 Streaming
保存 Assistant Message
```

不负责：

```text
设备连接
Robot Command
权限策略
数据库底层查询
```

---

## 9. Robot Engine

职责：

```text
把 Intent 转为 Robot Command Envelope
调用 Robot Safety
调用 RobotCommandPort
创建 / 更新 Action Record
```

示例 Command：

```json
{
  "type": "MOVE",
  "direction": "FORWARD",
  "distanceCm": 50,
  "speed": "LOW",
  "requiresAck": true
}
```

v1.4 不连接真实硬件。

---

## 10. System Engine

职责：

```text
查询电量
查询网络
查询设备在线状态
查询 Core 健康状态
```

System Engine 优先走内部状态，不走 LLM。

---

## 11. Voice Engine

职责：

```text
STT
TTS
Voice Cache
Emotion / Speaking State
```

v1.4 只定义接口，v1.5 再接 ElevenLabs / STT Adapter。

---

## 12. Runtime Module 验收标准

```text
runtime.module.ts 存在
runtime.controller.ts 存在
runtime.service.ts 存在
RuntimeContext 类型存在
RuntimeEvent 类型存在
IntentResult 类型存在
ActionResult 类型存在
Intent Engine 骨架存在
Task Dispatcher 骨架存在
Chat / Robot / System / Skill / Voice Engine 骨架存在
```

不要求真实 LLM / TTS / 电机执行。
