# 12-10 Agent User Web Home

Version: v1.8

## Goal

新增用户网页端 `Agent-user web`，先完成首页 DOM 与 UI，暂不接入真实 API 与业务逻辑。

## Root Directory

```text
Agent-docs/        项目所有文档
Agent-backend/     Core 后端
Agent-Studio Web/  管理员网页端
Agent-user web/    用户网页端
```

## Home UI Requirements

首页参考 iOS / 玻璃拟态风格：

- 页面左上角：`DID Agent Partner`
- 页面右上角：用户头像，统一蓝底 `#0D21A5` + 白色首字符
- 中间区域：Agent 卡片
- Agent 卡片支持横向滚动视觉，使用 CSS scroll-snap，暂不写状态逻辑
- Agent 头像继续使用蓝底 `#0D21A5` + 白色首字符
- Agent 卡片只显示：昵称、简介、蓝色 `start` 按钮

## Avatar Policy

所有头像类 UI 继续遵守平台统一策略：

```text
background: #0D21A5
text: white first character
```

头像图片字段与接口继续预留，但用户首页当前不开放：

- 不上传头像
- 不渲染图片头像
- 不开放头像 URL 输入

## Current Non-goals

V1.8 首页暂不实现：

- 登录逻辑
- 用户资料接口
- Agent 列表接口
- 点击 start 后进入聊天
- 真实左右切换状态
- 头像/媒体上传
