# LLM, TTS and STT Adapter v1.5

## 1. 目标

AI 与语音能力必须封装在基础设施层，Runtime 不直接依赖具体供应商。

---

## 2. LLM Port

```typescript
export interface LLMPort {
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
  stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk>;
}
```

### 输入

```typescript
export interface LLMGenerateInput {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userMessage: string;
  temperature?: number;
  maxOutputTokens?: number;
  traceId?: string;
}
```

### 输出

```typescript
export interface LLMGenerateResult {
  content: string;
  provider: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}
```

---

## 3. LLM Adapter

v1.5 提供：

```text
MockLLMAdapter       默认开发使用
GeminiLLMAdapter     真实供应商骨架
```

Runtime 调用：

```text
Chat Engine → LLMPort → Adapter
```

---

## 4. TTS Port

```typescript
export interface TTSPort {
  synthesize(input: TTSInput): Promise<TTSResult>;
}
```

```typescript
export interface TTSInput {
  text: string;
  voiceId?: string;
  language?: string;
  format?: 'mp3' | 'wav';
  traceId?: string;
}
```

```typescript
export interface TTSResult {
  audioUrl?: string;
  audioBuffer?: Buffer;
  mimeType: string;
  provider: string;
}
```

---

## 5. STT Port

```typescript
export interface STTPort {
  transcribe(input: STTInput): Promise<STTResult>;
}
```

```typescript
export interface STTInput {
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
  traceId?: string;
}
```

```typescript
export interface STTResult {
  text: string;
  language?: string;
  confidence?: number;
  provider: string;
}
```

---

## 6. Voice Pipeline

```text
POST /runtime/voice
    ↓
Voice Engine
    ↓
STT Adapter
    ↓
Runtime Event
    ↓
Intent Engine
    ↓
Chat / Robot / System Engine
    ↓
TTS Adapter
    ↓
Audio Result
```

---

## 7. Robot Command 与 LLM 的边界

基础移动命令不应该默认走 LLM。

```text
向前
后退
左转
右转
停止
过来
```

先走 Hybrid Intent 规则。

只有复杂任务才进入 LLM / Planner。

---

## 8. v1.5 不做的事

```text
不实现真实音频上传存储
不实现完整 TTS 缓存
不实现真实 STT 供应商接入
不实现多模型路由策略
```

v1.5 先完成 Port 与 Adapter 边界。


# v1.5.1 补充：Profile 驱动的 LLM / TTS Adapter

从 v1.5.1 开始，LLM Adapter 和 TTS Adapter 不再依赖固定环境变量来决定模型和音色。

Runtime 输入：

```text
Agent Manifest
↓
model.profileId / voice.profileId
↓
Profile Resolver
↓
Adapter
```

环境变量仍可用于 Bootstrap 默认 Profile，但不再作为 Agent 运行时的唯一配置来源。

推荐策略：

```text
没有 profileId：使用默认 ACTIVE Profile
profileId 不存在：Runtime 返回配置错误
profileId DISABLED：阻止新发布，已发布 Agent 按策略处理
profileId ARCHIVED：Runtime 拒绝调用
```
