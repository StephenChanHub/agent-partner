# Session Summary Memory v1.5.3

## 1. 定位

`Session Summary` 是 V1 的轻量记忆方案。

它不是完整 Memory System，也不是向量数据库。它只是 Agent Session 的滚动摘要，用于解决长期会话过长导致的上下文丢失问题。

## 2. 为什么 V1 选择 Summary

V1 目标是简单、稳定、可开发：

```text
最近消息负责短期上下文
Session Summary 负责长期连续性
Compiled Agent Prompt 负责 Agent 稳定身份
```

这三者组合，已经可以支撑 Jarvis V1。

## 3. 数据库字段

在 `agent_sessions` 增加：

```text
summary LONGTEXT NULL
summary_updated_at DATETIME NULL
message_count INT DEFAULT 0
```

暂不新增：

```text
session_memories
memory_items
embeddings
```

## 4. Summary 内容

Session Summary 应该记录：

```text
用户当前长期目标
已完成的重要阶段
关键项目决策
未解决的问题
用户偏好
当前任务状态
```

不应该记录：

```text
完整聊天逐字稿
无意义寒暄
临时错误信息
敏感密钥
无关短期上下文
```

## 5. 更新时机

V1 推荐策略：

```text
每 20 条消息尝试更新一次
或 Recent Messages 估算超过 8000 tokens 时更新
或用户明确说“总结一下目前进展”时更新
或 Agent Session 阶段切换时更新
```

## 6. 更新流程

```text
新增用户消息
↓
新增助手消息
↓
message_count + 2
↓
判断是否达到 summary 更新阈值
↓
读取旧 summary + 最近一段 messages
↓
调用 LLM 生成新 summary
↓
写回 agent_sessions.summary
```

## 7. Summary Prompt 模板

```text
请基于旧摘要和最近对话，更新这个长期会话摘要。
要求：
1. 保留长期目标、关键决策、当前阶段、未解决问题。
2. 删除无关寒暄和重复内容。
3. 不要记录 API Key、Token、密码等敏感信息。
4. 输出结构化中文摘要，控制在 800~1500 字。
```

## 8. Summary 示例

```text
用户正在设计 Jarvis Platform，一个包含 Dashboard、Device、Studio 和 Core Runtime 的 AI Agent 平台。
当前已完成 v1.5.2：大模型库、音色库、Skill/Profile Library。
核心决策：Agent = Model Profile + Voice Profile + Skill/Profile Library + Prompt/Rules。
当前问题：长期会话如何稳定携带 Profile、Skill、Behavior，避免 Agent 跑偏和失忆。
下一步计划：完成 v1.5.3 Runtime Context & Memory Strategy，然后进入 v1.6 Mock API + Runtime Stub。
```

## 9. 失败降级

如果 Summary 更新失败：

```text
不阻塞主聊天
记录 summary_update_failed
继续使用旧 summary
下一次达到阈值时重试
```

## 10. 未来 V2 扩展

V2 可以增加：

```text
memory_items
embedding_vectors
semantic recall
user preference memory
cross-session memory
cross-agent memory policy
```

但 V1 不做。
