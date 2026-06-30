# 11-36 Agent User Web Carousel Interaction Implementation

Version: v1.8.2

## Files Changed

```text
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/src/config/agents.ts
Agent-user web/package.json
Agent-user web/README.md
README.md
```

## Implementation Notes

### State model

首页新增本地状态：

```ts
const [activeIndex, setActiveIndex] = useState(0)
```

当前状态只用于 UI 切换，不接 API，不持久化。

### Gesture model

页面使用 Pointer Events：

```text
onPointerDown
onPointerMove
onPointerUp
onPointerCancel
```

当横向位移超过阈值时触发切换：

```text
SWIPE_THRESHOLD = 56
```

### Click-to-select

非当前卡片可点击：

```text
点击左侧 / 右侧目标卡片
↓
setActiveIndex(targetIndex)
```

### Visual layout

卡片 deck 使用绝对定位和 transform 表现左右卡片：

```text
active:   center, scale 1
neighbor: side,   scale 0.86
far:      side,   scale 0.72, low opacity
```

外部 carousel 容器保持透明，无阴影。

## Production Compatibility

这版交互以后接真实数据时无需推翻逻辑。

未来只需要替换：

```text
homeAgents mock data
```

为：

```text
GET /agents
```

并在点击 start 时进入：

```text
/agents/:slug/chat
```

或创建 / 读取对应 Agent Session。
