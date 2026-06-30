# 12-23 Agent User Web Header Tokens & Chat Simulation Polish

## Version

v1.8.14

## Goal

本版本继续完善网页用户端首页与对话页的 UI / DOM 交互，让沙盒状态更接近正式产品体验，同时仍然不接真实 Core API。

## Home Header

主页面头部调整为：

```text
左侧：用户头像 + 昵称
右侧：DID Agent Partner
右下角：Tokens：10000
```

头像规则继续遵守全平台头像策略：

```text
蓝色底：#0D21A5
白色首字符
50px × 50px
圆角正方形
底部阴影 + hover 上浮
```

## Tokens Display

首页右下角显示：

```text
Tokens：10000
```

其中 `Tokens` 使用更强的个性化字体风格，后续可替换为品牌字体。

## Chat Header

对话页顶部容器改为同款玻璃材质：

```text
左侧：返回按钮
中间：Agent 头像 + 名字
右侧：Tokens：10000
```

## Agent Card Action Buttons

修复对话页弹出 Agent 卡片里 `i` / `🎵` 按钮默认不可见问题。

新规则：

```text
默认：白色半透明玻璃底 + #0D21A5 图标
Hover：#0D21A5 背景 + 白色图标
```

## Chat Simulation

对话页输入框支持本地模拟发送：

```text
1. 用户输入文本
2. 点击上箭头或按 Enter
3. 插入用户消息
4. 插入 Agent thinking 消息
5. 延迟替换为沙盒回复
6. 状态变更为 ready
```

当前不调用：

```text
POST /chat
POST /voice
TTS
STT
Billing
```

## Message Area

消息区域支持滚动：

```text
overflow-y: auto
新消息自动滚动到底部
```

新增 DOM 缓冲动画：

```text
opacity 0 -> 1
translateY(18px) -> 0
轻微 blur -> 清晰
```
