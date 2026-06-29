# Agent Platform v1.7.3

本包采用正式根目录结构：

```text
Agent-docs/        项目所有文档
Agent-backend/     后端 Core / Sandbox API
Agent-Studio Web/  管理员网页端
```

## v1.7.3 重点

- 所有头像类 UI 统一为 `#0D21A5` 蓝底 + 白色首字符。
- Agent 编辑页头像字符加大。
- 头像图片字段 / 接口继续预留，但 Studio 不开放头像 URL 或上传入口。
- Pricing 页面支持计费规则 CRUD。
- 充值套餐 CRUD 保留，并强化删除确认。
- Agent / Voice / Model 删除操作补齐。
- 所有删除操作必须：警告 → 再次确认 → 执行。

## 本地拓扑

```text
Mac:
Agent-Studio Web
http://localhost:5173

UTM Ubuntu:
Agent-backend
http://192.168.64.2:3000/api
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
# Mac
cd "Agent-Studio Web"
cp .env.local.example .env.local
npm install
npm run dev
```
