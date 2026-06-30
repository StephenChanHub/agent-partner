# 11-41 Agent User Web Flip Interaction Implementation

Version: v1.8.8

## Scope

本版本只修改 `Agent-user web` 首页 DOM / CSS / 本地交互，不改变后端 API，不接真实数据。

## Key Files

```text
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/package.json
Agent-user web/README.md
```

## Implementation Notes

### Flip Buffer

`HomePage.tsx` 新增：

- `flipLoadingByAgent`
- `FLIP_BUFFER_MS = 500`
- `FLIP_TRIGGER_DELAY_MS = 80`

点击 `i` 按钮后：

1. 当前 Agent 进入 flip loading 状态。
2. 轻微延迟后切换正反面。
3. 0.5s 后清除 loading 状态。

CSS 中使用 `.flip-buffer-overlay` 和 `.flip-buffer-spinner` 显示缓冲动画。

### Media Swipe

新增独立的 media pointer state，避免卡片内部媒体滑动和外部 Agent carousel 滑动互相干扰。

```text
media area swipe = 切换媒体
carousel swipe   = 切换 Agent
```

### Media Dots

左上角媒体点不再只是状态展示，而是正式支持点击切换。

### Voice Button Placeholder

新增 `.sound-button`，位于 `i` 按钮下方。当前不做真实播放，后续可以接入：

```text
selectedAgent.voice.previewAudioUrl
```

### Start Button

背面 `.liquid-start-button--back` 改为主蓝色背景，用于突出主要行动。

