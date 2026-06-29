# Runtime Context & Encapsulation v1.5.5

## 1. 核心目标

Runtime Context 的目标是让 Agent 在长会话中不跑偏、不失忆，同时不把完整历史和复杂配置全部塞进大模型。

v1.5.5 简化后，V1 每次大模型调用使用：

```text
Agent Config Prompt
+ Session Summary
+ Recent Messages
+ Current Input
```

## 2. V1 Context 来源

```text
Agent Version Manifest
├── config.prompt
├── model.profileId
└── voice.profileId

Agent Session
├── summary
└── recent messages

Current Event
└── user input
```

## 3. 不再注入复杂 Skill/Profile

V1 不注入：

```text
Persona Profile JSON
Capability Profile JSON
Tool Skill JSON
Behavior Policy JSON
```

因为这些内容已经被管理员写入 `config.prompt`。

## 4. Context Builder 输出

```ts
export type RuntimeContext = {
  agent: {
    id: string;
    slug: string;
    configPrompt: string;
    modelProfileId: string;
    voiceProfileId?: string;
  };
  session: {
    id: string;
    summary?: string;
    recentMessages: Array<{ role: string; content: string }>;
  };
  input: {
    text: string;
    mode: 'TEXT' | 'VOICE';
  };
};
```

## 5. Prompt Assembler 输出

```text
[System]
{agent.configPrompt}

[Session Summary]
{agentSession.summary}

[Recent Conversation]
{recentMessages}

[User]
{currentInput}
```

## 6. V1 语音流程

```text
User Voice
↓
STT
↓
Runtime Context Builder
↓
Prompt Assembler
↓
LLM
↓
Save Messages
↓
TTS with Voice Profile
↓
Return audio
```

## 7. V2 扩展

V2 再加入：

```text
Skill Injection
Tool Schema
Behavior Policy Runtime
Robot Permission Runtime
```
