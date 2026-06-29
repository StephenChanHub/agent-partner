# Agent User Web

Jarvis Agent Platform v1.8.1 用户网页端沙盒项目。

当前阶段只完成首页 DOM 与 UI：

- 左上角文本：`DID Agent Partner`
- 已删除页面中部 `AI Partner` 文本
- 右上角用户头像：蓝色底 `#0D21A5` + 白色首字符
- 中间 Agent 卡片区域：CSS 横向滚动 / scroll snap
- Agent 卡片比例：`3:4`，设计基准 `900 x 1200`
- Agent 头像：蓝色底 `#0D21A5` + 白色首字符，无外环
- Agent 卡片内容：昵称、简介、蓝色 `start` 按钮
- 卡片加入左右滑动提示动画与更柔和的 iOS 风格阴影
- 暂不接 API
- 暂不实现登录逻辑
- 暂不实现真实左右切换状态
- 头像图片字段 / 接口继续预留，但首页不开放图片上传或图片头像渲染

## Local run

```bash
cd "Agent-user web"
cp .env.local.example .env.local
npm install
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:5174
```

## Sandbox topology

```text
Mac host:
Agent-user web      http://127.0.0.1:5174
Agent-Studio Web    http://127.0.0.1:5173

UTM Ubuntu:
Agent-backend       http://192.168.64.2:3000/api
```

## Git hygiene

本项目包含独立 `.gitignore`，默认忽略：

```text
node_modules/
dist/
build/
.env
.env.*
logs/
*.log
.DS_Store
*.tsbuildinfo
```

同时保留 `.env.local.example`，用于本地沙盒配置示例。
