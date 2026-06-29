# Runtime Context Modules v1.5.3

## 1. 新增模块边界

v1.6 前，Runtime Module 需要补齐以下服务骨架：

```text
runtime/context/runtime-context.builder.ts
runtime/prompt/prompt-assembler.service.ts
runtime/memory/session-summary.service.ts
runtime/skills/skill-injection.service.ts
runtime/policy/behavior-policy-runtime.service.ts
```

## 2. 目录建议

```text
src/modules/runtime/
├── context/
│   ├── runtime-context.builder.ts
│   └── runtime-context.types.ts
├── prompt/
│   └── prompt-assembler.service.ts
├── memory/
│   └── session-summary.service.ts
├── skills/
│   └── skill-injection.service.ts
├── policy/
│   └── behavior-policy-runtime.service.ts
├── chat-engine/
├── intent-engine/
├── dispatcher/
└── runtime.service.ts
```

## 3. 依赖规则

```text
RuntimeService
  → RuntimeContextBuilder
  → PromptAssembler
  → ChatEngine / RobotEngine / SystemEngine
```

禁止：

```text
Controller 直接组装 Prompt
ChatEngine 直接读 Prisma
LLM Adapter 直接读取 Agent Manifest
PromptAssembler 直接解密 API Key
```

## 4. RuntimeContextBuilder 依赖

允许依赖：

```text
AgentSessionRepository
AgentRepository
ModelProfileRepository
VoiceProfileRepository
SkillProfileRepository
MessageRepository
```

## 5. PromptAssembler 依赖

允许依赖：

```text
SkillInjectionService
BehaviorPolicyRuntimeService
TokenBudgetEstimator（V1 可 Mock）
```

## 6. SessionSummaryService

职责：

```text
判断是否需要更新 summary
生成 summary prompt
调用 LLM 进行摘要
写回 agent_sessions.summary
失败时降级
```

V1 可以先 Mock：

```text
如果 message_count < 20，不更新
如果需要更新，返回固定摘要或调用 mock-llm
```

## 7. SkillInjectionService

职责：

```text
解析 PERSONA / CAPABILITY / TOOL / BEHAVIOR_POLICY
编译 profile skill summary
输出 availableTools
执行 tool permission check
```

## 8. BehaviorPolicyRuntimeService

职责：

```text
编译 behavior summary
检查 robot action 是否允许
判断是否需要确认
处理 STOP 最高优先级
```

## 9. v1.6 Mock 验收标准

v1.6 只要做到：

```text
POST /runtime/events
↓
创建 RuntimeEvent mock
↓
IntentEngine 输出 mock intent
↓
RuntimeContextBuilder 输出 mock context
↓
PromptAssembler 输出 mock messages
↓
ChatEngine 调用 MockLLM
↓
保存 Message / ActionRecord mock
```

即可进入 Dashboard / Device / Studio 联调。
