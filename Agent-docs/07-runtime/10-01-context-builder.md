# Context Builder v1.5.5

## 1. 职责

Context Builder 负责为每次对话构建大模型需要的最小上下文。

V1 不做复杂技能注入，只做：

```text
读取 Agent Manifest
读取 config.prompt
读取 Model Profile ID
读取 Voice Profile ID
读取 Session Summary
读取最近消息
读取当前输入
```

## 2. 输入

```text
runtimeEventId
userId
agentSessionId
currentInput
mode: TEXT | VOICE
```

## 3. 输出

```ts
export type RuntimeContext = {
  configPrompt: string;
  modelProfileId: string;
  voiceProfileId?: string;
  sessionSummary?: string;
  recentMessages: Array<{
    role: 'USER' | 'ASSISTANT';
    content: string;
  }>;
  currentInput: string;
  mode: 'TEXT' | 'VOICE';
};
```

## 4. 构建顺序

```text
1. 根据 agentSessionId 读取 Agent Session
2. 读取 Agent 当前 publishedVersion.manifest
3. 解析 manifest.config.prompt
4. 解析 manifest.model.profileId
5. 解析 manifest.voice.profileId
6. 读取 session.summary
7. 读取最近 N 条消息
8. 返回 RuntimeContext
```

## 5. V1 校验

Context Builder 必须校验：

```text
config.prompt 不为空
model.profileId 存在
语音模式下 voice.profileId 存在
Agent Session 属于当前用户
Agent 已发布
```
