# 12-15 Agent User Web Header & Card Shadow Polish

## Version

v1.8.6

## Scope

本版本只优化用户网页端首页视觉与交互表现，不接入 API，不改变业务流程。

## Header

顶部 Header 改为透明背景：

- `background: transparent`
- 无 border
- 无 shadow
- 无 backdrop-filter

右上角用户头像保持平台头像策略：

- 背景色：`#0D21A5`
- 白色首字符
- 形状：圆角正方形

## Agent Card

卡片自身负责阴影，不再由外层 carousel 或 deck 容器产生阴影。

默认阴影：柔和中性阴影，避免蓝色底部光晕。

Hover：

- 阴影增强
- 轻微上浮
- 边框透明度增强

## Non-goals

- 不接接口
- 不做登录
- 不进入聊天页
- 不上传头像图片
- 不上传 Agent 媒体
