# 11-43 Agent User Web Chat Page Implementation

版本：v1.8.10

## 更新范围

本版本仅修改 `Agent-user web`，不修改后端真实接口。

关键文件：

```text
Agent-user web/src/App.tsx
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/src/pages/ChatPage.tsx
Agent-user web/src/pages/ChatPage.css
Agent-user web/package.json
Agent-user web/package-lock.json
```

## 沙盒路由策略

为了避免在 UI 阶段新增不必要依赖，本版本不引入 React Router，而是实现轻量沙盒路由：

```ts
window.history.pushState({}, '', `/chat/${agentId}`);
window.dispatchEvent(new Event('agent-user-web:navigate'));
```

`App.tsx` 监听：

```ts
window.addEventListener('popstate', syncPath);
window.addEventListener('agent-user-web:navigate', syncPath);
```

这样可以满足首页到对话页的 UI 流程，同时保留后续替换为正式路由库的空间。

## 首页进入对话页

正面和背面的 `start` 都调用同一入口：

```ts
navigateToChat(agent.id);
```

当前不创建 Agent Session，不调用 Core。

## 对话页布局

页面结构：

```text
ChatPage
├── chat-header
│   ├── back button
│   ├── agent avatar + name
│   └── spacer
├── chat-messages
│   └── message-row / message-bubble / message-actions
└── chat-composer
    └── input + voice button
```

## 对话气泡规范

- Agent 气泡靠左。
- User 气泡靠右。
- 气泡尾巴在上方靠近双方位置。
- 气泡外下方显示复制 / 播放。
- thinking 状态显示跳动点。

## 未来正式接入点

后续正式联调时，将沙盒示例消息替换为来自 Core 的消息列表：

```text
messages = GET /agent-sessions/{sessionId}/messages
```

发送文本：

```text
POST /chat
```

语音输入：

```text
POST /voice
```

播放音频：

```text
GET /runtime/audio/temp/{audioId}
```

## 验收标准

- `npm install` 通过。
- `npm run build` 通过。
- 首页 `start` 能进入对话页。
- 对话页返回按钮能回到首页。
- 对话页展示双方示例消息。
- thinking 状态有轻动画。
- 输入区展示文本输入框和语音按钮。
