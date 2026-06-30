# 12-18 Agent User Web Practice Flip & Hover Polish

## 目标

v1.8.9 对用户网页端首页 Agent 卡片进行视觉和交互修正：

1. Header 用户头像增大 2 倍。
2. 翻转交互参考上传的 `Practice.vue`，采用稳定的 3D Y 轴翻转。
3. 卡片更高，Hover 阴影更深。

## UI 策略

### 用户头像

- 继续采用统一头像策略：蓝底 `#0D21A5` + 白色首字符。
- Header 用户头像从原小尺寸放大为约 68px。
- 形态为圆角正方形，而不是圆形。

### 卡片高度与阴影

- Agent 卡片继续保持 3:4。
- 最大宽度提升，视觉上更高。
- 卡片自身保留深阴影。
- Hover 时卡片轻微上浮并加深阴影。

### 翻转交互

参考 `Practice.vue` 的核心做法：

- 外层使用 `perspective`。
- 内层使用 `transform-style: preserve-3d`。
- 正反面使用 `backface-visibility: hidden`。
- 翻转时内层执行 `rotateY(180deg)`。
- 正反面可见性通过 `opacity / visibility / z-index` 配合控制。
- 正反面内容在翻转中延迟淡入，降低突兀感。

## 沙盒边界

本版本仍然不接后端，不上传媒体，不播放真实试听音频。
