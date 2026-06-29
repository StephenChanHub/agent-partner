# Prompt Assembler v1.5.3

## 1. 定位

`Prompt Assembler` 负责把 `AgentRuntimeContext` 编译成一次 LLM 调用所需的 messages。

它的职责是：

```text
稳定身份
控制上下文长度
注入行为边界
注入必要能力
保留最近对话
明确当前任务
```

## 2. Prompt 分层

推荐结构：

```text
[System]
Compiled Agent Prompt

[Developer]
Behavior Policy Summary
Tool Usage Rules
Safety Rules

[Memory]
Session Summary
Open Decisions
User Preferences（V1 可为空）

[Recent Conversation]
最近 N 条消息

[Current Task]
用户当前输入
```

## 3. Compiled Agent Prompt

Compiled Agent Prompt 来自：

```text
Agent Basic Info
Persona Profile
Capability Profile
Behavior Policy
Agent Dedicated Prompt / Rules
```

示例：

```text
你是 Coding Mentor，一名资深前端架构导师。
你的表达方式简洁、直接、工程化。
你的核心能力是 React、NestJS、Prisma、API Design、Debug。
你应该先给结论，再说明原因，再给可执行步骤。
不要编造不存在的 API；不确定时明确说明。
```

## 4. Skill 注入

### Profile Skill

人格、职业、性格、能力水平进入 `compiledAgentPrompt`。

### Tool Skill

工具能力进入 tool list 或 developer rules。

```text
可用工具：search.web、github.readRepo、robot.move
```

V1 如果还没有 function calling，可以先用自然语言声明工具边界；v1.6 Mock 阶段可先返回 mock tool metadata。

## 5. Behavior 注入

Behavior Policy 必须每次参与 Prompt Assembler，但必须压缩。

示例：

```text
行为边界：
- 不确定的信息必须说明不确定。
- 涉及设备移动时，如果距离、方向或安全状态不明确，必须先询问。
- STOP 指令最高优先级，不需要二次确认。
```

## 6. Token Budget

V1 建议默认预算：

```text
Compiled Agent Prompt：1000~2000 tokens
Behavior Policy：500~1000 tokens
Session Summary：1000~2000 tokens
Recent Messages：4000~8000 tokens
Current Input：保留完整
```

如果超长，裁剪顺序：

```text
1. 先减少 Recent Messages
2. 再压缩 Session Summary
3. 不裁剪 Behavior Safety Rules
4. 不裁剪核心 Agent Identity
```

## 7. 输出格式

```ts
interface AssembledPrompt {
  messages: Array<{
    role: 'system' | 'developer' | 'user' | 'assistant' | 'tool';
    content: string;
  }>;
  metadata: {
    estimatedTokens: number;
    includedRecentMessageCount: number;
    usedSessionSummary: boolean;
    compiledPromptHash: string;
  };
}
```

## 8. 禁止事项

```text
禁止把 API Key 放进 Prompt
禁止把完整 Profile JSON 放进 Prompt
禁止把被禁用的 Skill 注入 Prompt
禁止把所有历史消息无限拼接
禁止让 Tool Skill 越权执行 Agent 没有授权的能力
```
