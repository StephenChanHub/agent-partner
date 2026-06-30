# Agent-docs

这里存放 Jarvis / Agent Platform 的全部项目文档。

当前版本：v1.7.4 Studio Professional Interaction & Production-Ready UX

## 根目录结构

```text
Agent-docs/        项目所有文档
Agent-backend/     后端 Core / NestJS 沙盒
Agent-Studio Web/  管理员网页端 / React Vite
```

## v1.7.4 更新重点

```text
1. 管理员端交互升级为专业后台基线
2. 全局 Environment Banner 展示 Core ready 状态
3. 列表页统一搜索、筛选、刷新、行选择
4. 顶层 ErrorBoundary 防止页面白屏
5. HTTP 请求增加 X-Request-ID / X-Client-App / X-Client-Env
6. Dashboard 增加 Production Readiness Panel
7. 新增 System Readiness 页面
8. 正式上线预留项整理为可执行 checklist
```

## 沙盒原则

```text
管理员端先跑沙盒
网页用户端先跑沙盒
树莓派用户端先跑沙盒
不直接上服务器开始真实业务
```

## 新增文档

```text
05-api/07-21-studio-professional-interaction-api.md
09-frontend/12-09-studio-professional-interactions.md
10-engineering/11-33-production-ready-admin-ux-baseline.md
11-operations/25-studio-production-readiness-runbook.md
```


## v1.8 Agent User Web Home

新增 `Agent-user web` 用户网页端项目，完成首页 DOM 与 UI，暂不实现业务逻辑。详见：

- `09-frontend/12-10-agent-user-web-home.md`
- `10-engineering/11-34-agent-user-web-home-implementation.md`
- `05-api/07-22-agent-user-web-home-api-readiness.md`

## v1.8.2 Update

- 用户网页端首页卡片切换修复：手势滑动 + 点击目标卡片切换。
- 卡片外部装载容器透明化，不再产生外层阴影。
- 首页 Mock Agent 数量增加到 5 个。
