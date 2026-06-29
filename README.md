# Agent Platform v1.8.1 User Web Polish & Git Ignore Baseline

本包采用正式根目录结构：

```text
Agent-docs/        项目所有文档
Agent-backend/     后端 Core / Sandbox API
Agent-Studio Web/  管理员网页端
Agent-user web/    网页用户端
```

## v1.8.1 Update

本版本完成两个重点：

```text
1. 优化用户网页端首页视觉与交互细节
2. 为 Agent-backend / Agent-Studio Web / Agent-user web 三个主项目补齐 .gitignore
```

用户网页端首页调整：

```text
删除 AI Partner 文本
卡片比例固定为 3:4，设计基准为 900 x 1200
取消 Agent 头像外环
全局蓝色统一为 #0D21A5
卡片阴影重新美化
卡片加入左右滑动提示动画
继续保持头像蓝底 + 白色首字符
头像图片字段 / 接口预留，但页面不开放图片头像或上传
```

Git 忽略策略：

```text
Agent-backend/.gitignore
Agent-Studio Web/.gitignore
Agent-user web/.gitignore
```

三者都忽略 `node_modules`、构建产物、本地环境变量、日志、缓存、系统文件等；同时保留 `.env.example`、`.env.sandbox.example`、`.env.local.example` 这类示例配置文件。

## 本地拓扑

```text
Mac:
Agent-Studio Web   http://127.0.0.1:5173
Agent-user web     http://127.0.0.1:5174

UTM Ubuntu:
Agent-backend      http://192.168.64.2:3000/api
```

## 启动

```bash
# UTM Ubuntu
cd Agent-backend
cp .env.sandbox.example .env
npm install
npm run start:sandbox
```

```bash
# Mac - 管理员端
cd "Agent-Studio Web"
cp .env.local.example .env.local
npm install
npm run dev
```

```bash
# Mac - 用户网页端
cd "Agent-user web"
cp .env.local.example .env.local
npm install
npm run dev
```

## 用户网页端地址

```text
http://127.0.0.1:5174
```

## 当前限制

```text
不接真实 DeepSeek
不接真实 ElevenLabs
不接真实支付
不上传头像 / 媒体 / 试听音频
用户网页端首页暂不接 API、不做登录、不进入聊天
```
