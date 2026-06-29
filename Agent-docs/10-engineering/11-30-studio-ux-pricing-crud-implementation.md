# 11-30 Studio UX & Pricing CRUD Implementation

版本：v1.7.1

## 1. 本版目标

v1.7.1 的目标是优化管理员端核心操作体验：

```text
Agent 编辑从 Drawer 升级为独立页面
媒体展示区域支持本地预览
Pricing 套餐从只读升级为 CRUD
Pricing 增加折扣快捷操作
```

## 2. 前端变更

新增：

```text
Agent-Studio Web/src/pages/agents/AgentEditPage.tsx
```

更新：

```text
Agent-Studio Web/src/pages/agents/AgentsPage.tsx
Agent-Studio Web/src/pages/billing/PricingPage.tsx
Agent-Studio Web/src/router/AppRouter.tsx
Agent-Studio Web/src/api/studio.ts
Agent-Studio Web/src/api/http.ts
Agent-Studio Web/src/types/api.ts
Agent-Studio Web/src/styles/global.css
```

## 3. 后端变更

更新：

```text
Agent-backend/src/mock/mock-data.ts
Agent-backend/src/modules/billing/recharge-package.service.ts
Agent-backend/src/modules/billing/studio-billing.controller.ts
```

新增/补齐 API：

```text
GET    /studio/billing/packages
POST   /studio/billing/packages
PATCH  /studio/billing/packages/:id
DELETE /studio/billing/packages/:id
POST   /studio/billing/packages/:id/discount
```

## 4. 媒体预览实现

本地媒体预览使用：

```text
URL.createObjectURL(file)
URL.revokeObjectURL(url)
```

不会调用上传接口。

## 5. Pricing 折扣实现

当前折扣策略使用赠送 Tokens：

```text
+10% / +20% / +50%
```

不改变人民币金额，只改变最终到账 Agent Tokens。

## 6. 后续真实数据库迁移

当前 CRUD 作用于 Mock 内存数组。进入真实数据库阶段时：

```text
RechargePackageService -> Prisma Repository
mockRechargePackages -> recharge_packages table
```
