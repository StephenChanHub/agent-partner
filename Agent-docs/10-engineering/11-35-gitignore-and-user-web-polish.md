# 11-35 Git Ignore & User Web Polish Implementation

版本：v1.8.1 User Web Polish & Git Ignore Baseline

## 本次工程变更

v1.8.1 完成两类工程工作：

```text
1. 用户网页端首页视觉与交互优化
2. 三个主工程目录补齐独立 .gitignore
```

## 修改文件

用户网页端：

```text
Agent-user web/src/pages/HomePage.tsx
Agent-user web/src/pages/HomePage.css
Agent-user web/src/components/InitialAvatar.css
Agent-user web/README.md
Agent-user web/package.json
Agent-user web/.gitignore
```

Git 忽略文件：

```text
Agent-backend/.gitignore
Agent-Studio Web/.gitignore
Agent-user web/.gitignore
```

文档：

```text
Agent-docs/09-frontend/12-11-agent-user-web-polish.md
Agent-docs/10-engineering/11-35-gitignore-and-user-web-polish.md
README.md
```

## .gitignore 原则

### 必须忽略

```text
node_modules
构建产物 dist / build
本地环境变量 .env / .env.*
日志文件
缓存文件
系统文件 .DS_Store
TypeScript build info
测试产物
```

### 必须保留

```text
.env.example
.env.sandbox.example
.env.local.example
```

原因：正式项目需要保留环境变量模板，但不能提交真实密钥、本地地址、真实数据库连接串。

## Backend 额外忽略

后端额外忽略：

```text
Prisma 本地 sqlite 文件
uploads/
temp/
tmp-audio/
```

原因：后续真实上传、临时音频、开发数据库都不应进入 Git。

## User Web 首页实现原则

当前仍然是 UI-only：

```text
不接 API
不写状态机
不做路由跳转
不做登录
```

但 CSS 结构已经为后续真实 Agent 列表接入预留：

```text
homeAgents mock 数据后续可替换为 GET /agents
Agent 卡片结构不需要推翻
头像策略不需要推翻
start 按钮后续可接入 Agent Session / Chat 路由
```
