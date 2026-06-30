# 11-46 Agent User Web Media Slide & Solid Overlay Implementation

版本：v1.8.13

## 修改范围

本版本主要修改：

```text
Agent-user web/src/components/AgentFlipCard.tsx
Agent-user web/src/components/AgentFlipCard.css
Agent-user web/src/pages/ChatPage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/README.md
README.md
```

## AgentFlipCard 组件变化

### 之前

正面媒体区域只渲染当前媒体：

```text
currentMedia → img / video
```

这会导致点击点位或滑动切换时像“替换内容”，缺少连续性。

### 现在

正面媒体区域渲染完整 track：

```text
media-slider-track
  translateX by currentIndex
```

每个媒体为一个固定宽度 slide：

```css
.media-slide {
  flex: 0 0 100%;
}
```

slide 之间使用：

```css
gap: 5px;
```

## 视频引用管理

组件内部使用：

```ts
const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
```

当 `currentMedia` 变化时：

```text
当前视频：currentTime = 0，然后尝试播放
非当前视频：pause
播放结束：暂停在尾帧附近
```

## 对话页不透明卡片

对话页调用共享 Agent 卡片时增加：

```tsx
className="chat-shared-profile-card agent-card--solid"
```

对应 CSS：

```css
.agent-card--solid .agent-card-face,
.agent-card--solid .agent-card-face--front,
.agent-card--solid .agent-card-face--back {
  background: #ffffff;
  backdrop-filter: none;
}
```

这样不会破坏首页玻璃卡片样式，同时让对话页卡片独立变为不透明。

## 用户头像上浮

主界面 Header 头像增加：

```css
.header-user-avatar:hover {
  transform: translateY(-6px);
}
```

并增强底部阴影，以形成轻微悬浮状态。

## 验收点

```text
1. 首页用户头像 hover 后上浮并显示更深底部阴影。
2. Agent 卡片正面上传 2 个以上媒体后，点选媒体点应横向平移切换。
3. 卡片内左右滑动应横向平移切换媒体。
4. 对话页点击顶部 Agent 信息后，弹出 Agent 卡片应为完全不透明。
5. 对话页弹层背景不应 blur。
6. npm run build 应通过。
```
