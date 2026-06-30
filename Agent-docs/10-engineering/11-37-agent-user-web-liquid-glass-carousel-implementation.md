# 11-37 Agent User Web Liquid Glass Carousel Implementation

Version: v1.8.3

## 修改范围

```text
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/package.json
Agent-user web/README.md
README.md
```

## 关键实现

### 1. 引入 Liquid Glass

`Agent-user web/package.json` 增加：

```json
"liquid-glass-react": "^1.1.1"
```

`HomePage.tsx` 中引入：

```tsx
import LiquidGlass from 'liquid-glass-react';
```

每个 Agent Card 的内容被包裹在 LiquidGlass 中：

```tsx
<LiquidGlass>
  <div className="agent-card-content">...</div>
</LiquidGlass>
```

### 2. 删除蓝色阴影

v1.8.3 删除以下视觉来源：

```text
card-glow 节点
卡片蓝色 box-shadow
active card 蓝色呼吸阴影动画
start button 蓝色阴影
```

保留：

```text
玻璃背景
玻璃边框
内部高光
```

### 3. 修复点击目标卡片失败

原实现只依赖卡片 `onClick`，当卡片重叠时，active card 可能遮挡左右目标卡片。

v1.8.3 增加容器级点击兜底：

```text
左侧点击区 -> previous
右侧点击区 -> next
中间点击区 -> no-op
```

同时把卡片横向间距从 48% 扩大到 78%，降低遮挡概率。

### 4. 手势滑动

保留 Pointer Events：

```text
pointerdown
pointermove
pointerup
pointercancel
```

滑动阈值：

```text
48px
```

拖动过程中通过 `--drag-x` 做轻量视觉反馈。
