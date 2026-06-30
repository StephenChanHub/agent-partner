# 11-47 Agent User Web Chat Simulation Implementation

## Version

v1.8.14

## Changed Files

```text
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/src/pages/ChatPage.tsx
Agent-user web/src/pages/ChatPage.css
Agent-user web/src/components/AgentFlipCard.tsx
Agent-user web/src/components/AgentFlipCard.css
Agent-user web/package.json
Agent-user web/package-lock.json
Agent-user web/README.md
README.md
```

## Implementation Notes

### Home Header

`HomePage.tsx` 将头部布局从：

```text
DID Agent Partner | User Avatar
```

调整为：

```text
User Avatar + Nickname | DID Agent Partner
```

并新增固定在右下角的 Tokens 展示。

### Chat Simulation

`ChatPage.tsx` 从静态消息数组升级为本地 state：

```text
messages
input draft
profile overlay state
```

发送逻辑：

```text
sendMessage()
- trim draft
- append user message
- append agent thinking message
- 1100ms 后替换为 sandbox reply
- 2200ms 后标记为 ready
```

### Scroll Management

使用 `messagesRef` 指向消息区域，在 `messages` 变化后：

```text
scrollTo({ top: scrollHeight, behavior: 'smooth' })
```

### DOM Loading Animation

每条 `.message-row` 使用 `messageDomEnter` 动画，模拟真实消息加载缓冲。

### Agent Card Button Visibility

在 `AgentFlipCard.css` 中补充覆盖规则，确保 `i` / `🎵` 按钮默认可见，解决白色图标在浅色背景下不可见的问题。

## Production Reserved Path

正式接入后，`sendMessage()` 可以替换为：

```text
POST /chat
POST /voice
GET /me/usage
```

前端 DOM 结构不需要推翻。
