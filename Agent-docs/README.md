# Agent-docs

这里存放 Jarvis / Agent Platform 的全部项目文档。

当前版本：v1.7.1 Studio UX & Pricing CRUD

## 根目录结构

```text
Agent-docs/        项目所有文档
Agent-backend/     后端 Core / NestJS 沙盒
Agent-Studio Web/  管理员网页端 / React Vite
```

## v1.7.1 更新重点

```text
1. Agent 编辑页独立为 /agents/new 与 /agents/:id/edit
2. Agent 编辑页采用 Instagram 个人主页式布局
3. 媒体区域支持本地照片 / 视频预览，不上传到虚拟机
4. Pricing 页面充值套餐支持 CRUD
5. Pricing 页面提供 +10% / +20% / +50% 赠送 Tokens 快捷操作
6. 后端补齐 Studio Pricing Package Mock API
```

## 沙盒原则

```text
管理员端先跑沙盒
网页用户端先跑沙盒
树莓派用户端先跑沙盒
不直接上服务器开始真实业务
```
