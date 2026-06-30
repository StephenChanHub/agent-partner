# 11-42 Agent User Web Practice Flip Implementation

## 修改范围

- `Agent-user web/src/pages/HomePage.tsx`
- `Agent-user web/src/pages/HomePage.css`
- `Agent-user web/package.json`
- `Agent-user web/README.md`

## 实现要点

### 1. 移除旧翻转 Loading Overlay

v1.8.8 使用 `flipLoadingByAgent` 和 `flip-buffer-overlay` 做翻转缓冲。v1.8.9 移除该实现，避免翻转时出现额外遮罩和 Spinner。

### 2. Practice-style 3D Flip

卡片翻转改为：

```css
.agent-card-inner {
  transform-style: preserve-3d;
  transition: transform 600ms cubic-bezier(0.4, 0.2, 0.2, 1);
}

.agent-card--flipped .agent-card-inner {
  transform: rotateY(180deg);
}
```

正反面分别设置：

```css
backface-visibility: hidden;
```

并通过 `opacity / visibility / z-index` 控制翻转过程中的正反面显示。

### 3. Hover 强化

卡片 Hover 时：

- 上浮约 14px。
- scale 轻微增加。
- 阴影深度增加。

### 4. Header Avatar

Header 用户头像在 CSS 中覆盖小尺寸头像的宽高与字体大小，使其达到原先约 2 倍尺寸。

## 后续预留

后续可继续把本地媒体预览替换为真实 Agent Media API，但 DOM 与交互结构不需要推翻。
