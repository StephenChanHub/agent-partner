# 12-17 Agent User Web Flip Interaction Polish

Version: v1.8.8

## Goal

`Agent-user web` 首页 Agent 卡片在 v1.8.7 已经从单面卡升级为正反双面卡。本版本继续优化翻转体验、媒体切换体验和正式上线预留入口。

## Updates

### 1. Flip Buffer Animation

点击 `i` 按钮翻转卡片时，前端会显示 0.5s 的 DOM 缓冲动画：

- 避免正反面切换显得生硬。
- 降低媒体层、玻璃层、背面信息层同时更新时的视觉卡顿。
- 当前只做视觉缓冲，不请求后端。

### 2. Media Switching

卡片正面媒体切换支持两种方式：

- 点击左上角媒体指示点切换。
- 在卡片媒体区域内左右滑动切换。

规则：

- 左滑：切换到下一项媒体。
- 右滑：切换到上一项媒体。
- 只有当前激活卡片响应媒体切换。
- 卡片外部左右滑动仍用于切换 Agent。

### 3. Voice Preview Placeholder

正面右上角 `i` 按钮下方新增声音按钮。

当前版本只作为未来能力入口：

- 不播放真实音频。
- 不请求 Voice Profile。
- 不调用后端。

未来接入后，该按钮将使用选中 Agent 的 Voice Profile previewAudioUrl。

### 4. Back Side Start Button

卡片背面信息页的 `start` 按钮调整为：

- 蓝色背景：`#0D21A5`
- 白色字体

用于和正式开始对话的主行动保持一致。

## Local-only Policy

当前媒体仍然只做浏览器本地预览：

- 使用 `URL.createObjectURL(file)`。
- 不上传到 UTM Ubuntu。
- 不写入数据库。
- 刷新页面后本地媒体消失。

