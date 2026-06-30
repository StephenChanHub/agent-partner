# 11-40 Agent User Web Flip Media Card Implementation

版本：v1.8.7

## 1. 修改范围

本次主要修改：

```text
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/package.json
Agent-user web/README.md
README.md
```

## 2. 关键实现

### 2.1 双面卡片

通过 CSS 3D transform 实现：

```css
.agent-card-inner {
  transform-style: preserve-3d;
}

.agent-card--flipped .agent-card-inner {
  transform: rotateY(180deg);
}

.agent-card-face {
  backface-visibility: hidden;
}

.agent-card-face--back {
  transform: rotateY(180deg);
}
```

### 2.2 本地媒体预览

使用浏览器对象 URL：

```ts
const url = URL.createObjectURL(file);
```

对象 URL 只保存在前端 React state 中，不上传、不持久化。

### 2.3 视频自动播放一次

当 active agent 或 current media 改变时，如果当前媒体是视频，则：

```ts
video.currentTime = 0;
video.muted = true;
video.play();
```

播放结束后：

```ts
video.pause();
video.currentTime = video.duration - 0.06;
```

### 2.4 事件隔离

卡片本身仍然支持 carousel 手势滑动。按钮点击需要阻止冒泡：

```ts
onPointerDown={(event) => event.stopPropagation()}
onClick={(event) => event.stopPropagation()}
```

避免点击 `i`、`start`、`+` 或媒体 dot 时误触发卡片切换。

## 3. 正式上线预留

未来真实媒体接入时，建议新增 Upload Adapter：

```text
src/features/media/upload.adapter.ts
```

页面层不直接知道上传到哪里，只调用 adapter。

这样正式上线时只替换 Adapter，不需要推翻卡片 UI / 交互逻辑。
