# 07-10 Studio Skill Library API - V2 Deferred

## 1. 状态

本 API 在 v1.5.5 中被标记为：

```text
V2 预留，不进入 V1 API 实现范围。
```

## 2. V1 替代方案

V1 Studio Agent Editor 使用：

```text
config.prompt
```

统一描述 Agent 的人格、能力、行为边界和专属设定。

## 3. V1 不实现的接口

```http
GET    /studio/skill-profiles
POST   /studio/skill-profiles
GET    /studio/skill-profiles/:id
PATCH  /studio/skill-profiles/:id
POST   /studio/skill-profiles/:id/test
```

## 4. V2 再恢复

当系统进入工具调用阶段，再重新设计 Skill Library API。
