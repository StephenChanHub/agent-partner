# 12-22 Agent User Web Media Slide & Solid Overlay Polish

版本：v1.8.13

## 目标

本版本解决 `Agent-user web` 中三个视觉与交互问题：

1. Agent 卡片内的媒体切换需要从“替换显示”改为横向平移切换。
2. 对话页点击 Agent 信息后弹出的 Agent 卡片需要完全不透明。
3. 主界面右上角用户头像需要具备上浮状态和更清晰的底部阴影。

## 媒体切换交互

Agent 卡片正面媒体区域使用内部 Slider 结构：

```text
media-frame
└── media-slider-track
    ├── media-slide
    ├── media-slide
    └── media-slide
```

切换方式：

```text
点击左上角媒体点 → 切换到指定媒体
卡片内左滑       → 下一张 / 下一个视频
卡片内右滑       → 上一张 / 上一个视频
```

切换动画：

```text
transform: translate3d(calc(index * (-100% - 5px)), 0, 0)
transition: 520ms cubic-bezier(0.22, 1, 0.36, 1)
```

媒体之间保留 `5px` 间隔，避免切换时出现突兀闪烁。

## 视频行为

当前媒体为视频时：

```text
切换到该视频 → 自动从 0 秒播放一次
播放结束     → 暂停在尾帧附近
切走该视频   → 暂停播放
```

当前仍为沙盒演示，不上传视频、不保存视频、不调用后端。

## 对话页 Agent 卡片弹层

对话页仍复用首页同一个 `AgentFlipCard` 组件，但增加 `agent-card--solid` 样式类。

效果：

```text
卡面背景完全不透明
不使用 backdrop-filter
不使用半透明玻璃卡面
弹层背景不做虚化
点击卡片外空白区域关闭弹层
```

这样在对话页查看 Agent 信息时，视觉更稳定，阅读不受底层对话内容干扰。

## 主界面用户头像

右上角用户头像增加：

```text
默认底部阴影
hover 上浮
hover 阴影增强
```

头像仍遵循平台头像策略：

```text
蓝色底：#0D21A5
白色首字符
不渲染头像图片
头像图片字段 / 接口继续预留
```

## 不实现范围

本版本不实现：

```text
真实媒体上传
真实媒体保存
真实 Agent API
真实语音试听播放
真实用户头像上传
```
