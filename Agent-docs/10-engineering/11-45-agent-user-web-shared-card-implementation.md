# 11-45 Agent User Web Shared Card Implementation

版本：v1.8.12

## 实现摘要

本版本将首页 Agent 卡片抽象成共享组件 `AgentFlipCard`，由首页和对话页共同调用，避免未来两处卡片样式和交互逻辑分叉。

## 关键文件

```text
Agent-user web/src/components/AgentFlipCard.tsx
Agent-user web/src/components/AgentFlipCard.css
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/src/pages/ChatPage.tsx
Agent-user web/src/pages/ChatPage.css
```

## 组件接口

```tsx
<AgentFlipCard
  agent={agent}
  mode="carousel | standalone"
  isActive
  isVisible
  distance={0}
  showStartButton={false}
/>
```

## 工程原则

- 首页和对话页不再维护两套 Agent 卡片 DOM。
- 对话页弹层关闭逻辑由 overlay 负责，卡片内部点击阻止冒泡。
- `showStartButton=false` 只隐藏 start，不删除卡片其他交互。
- 弹层背景透明且不虚化，避免打断对话页面视觉连续性。

## 沙盒说明

当前版本仍为 UI 沙盒。媒体使用 `URL.createObjectURL` 本地预览，不写数据库、不上传文件、不请求后端。
