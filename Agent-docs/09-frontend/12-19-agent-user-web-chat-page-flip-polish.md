# 12-19 Agent User Web Chat Page & Flip Polish

版本：v1.8.10

## 目标

本版本继续完善网页用户端的首页卡片体验，并新增用户对话页面的 DOM 与 UI。当前仍然是沙盒 UI 阶段，不接真实 Core API，不产生真实对话记录。

## 首页卡片更新

### 翻转动画

卡片使用 Y 轴双面翻转：

```css
.agent-card-inner {
  transition: transform 1000ms cubic-bezier(0.2, 0.82, 0.18, 1);
}

.agent-card--flipped .agent-card-inner {
  transform: rotateY(180deg);
}
```

动画时长从 0.6s 延长到 1s，以减少生硬感。

### 卡片边框

取消卡片正反面边框：

```css
.agent-card-face {
  border: 0;
}
```

保留玻璃化背景、内高光和卡片自身阴影。

### Start 按钮

正面 `start` 继续保持透明液态玻璃样式，并增加 Hover 上浮：

```css
.liquid-start-button--front:hover:not(:disabled) {
  transform: translateY(-5px);
}
```

背面 `start` 保持蓝色背景 `#0D21A5` + 白色字体。

## 对话页

新增路径：

```text
/chat/:agentId
```

由于当前未引入路由库，前端通过 `window.history.pushState` 和自定义事件完成轻量级沙盒路由。后续正式上线时可以平滑替换为 React Router，不需要重写页面结构。

### 顶部结构

```text
左侧：返回按钮
中间：Agent 头像 + Agent 名字，左右排列
右侧：占位区域，用于保持标题居中
```

### 对话区域

只展示双方气泡，不展示复杂卡片或多余系统信息。每条气泡下方独立显示操作按钮：

```text
复制
播放
```

气泡尾巴位于气泡上方、靠近消息来源的一侧：

```text
Agent 消息：左上角尾巴
User 消息：右上角尾巴
```

### 状态展示

当前示例支持：

```text
thinking
ready
ready to play
```

`thinking` 状态额外显示三个跳动点，用于预留未来 Agent 思考状态。

### 输入区

底部固定输入区：

```text
文本输入框 + 语音输入按钮
```

当前按钮不发送请求，仅作为正式交互预留。

## 当前不实现

- 不调用 `/chat` API。
- 不调用 `/voice` API。
- 不播放真实 TTS 音频。
- 不保存消息。
- 不接入用户登录状态。
- 不接入 Agent Session。

## 后续接入方向

正式联调时，对话页应接入：

```text
GET  /agent-sessions/current
GET  /agent-sessions/{sessionId}/messages
POST /chat
POST /voice
GET  /runtime/audio/temp/{audioId}
```
