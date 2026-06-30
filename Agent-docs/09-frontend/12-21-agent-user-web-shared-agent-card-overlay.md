# 12-21 Agent User Web Shared Agent Card Overlay

版本：v1.8.12  
范围：Agent-user web 对话页 Agent 信息弹层与首页卡片组件复用。

## 目标

对话页顶部 Agent 信息区域点击后，不再展示单独设计的 Profile 弹层，而是直接复用首页 Agent 卡片。这样用户在首页看到的 Agent 形象、媒体展示、翻转交互和声音按钮预留，在对话页中保持一致。

## 交互规则

- 顶部 Agent 头像 / 名字仍可点击。
- 顶部 Agent 信息区域取消 Hover 上浮、背景变化和阴影变化。
- 点击后弹出首页同款 Agent 卡片。
- 弹出卡片隐藏 `start` 按钮。
- 弹出卡片支持：
  - 正反面翻转。
  - 本地照片 / 视频预览。
  - 左上角媒体点切换。
  - 卡片内左右滑动切换媒体。
  - 声音按钮预留。
- 点击卡片外空白区域关闭弹层。
- 弹层背景不做虚化处理，不使用 `backdrop-filter`。

## 组件策略

新增共享组件：

```text
Agent-user web/src/components/AgentFlipCard.tsx
Agent-user web/src/components/AgentFlipCard.css
```

首页使用：

```tsx
<AgentFlipCard showStartButton />
```

对话页使用：

```tsx
<AgentFlipCard mode="standalone" showStartButton={false} />
```

## 当前限制

- 媒体上传仍为浏览器本地预览，不上传至 UTM Ubuntu。
- 声音按钮仅为试听音频入口预留，当前不播放真实音频。
- 弹层卡片状态独立于首页卡片状态。
