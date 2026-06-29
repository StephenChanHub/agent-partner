# 07-18 Studio UX & Pricing CRUD API

版本：v1.7.1

## 1. Agent 编辑页面相关 API

Agent 编辑页继续使用已有 Studio Agent API：

```text
GET   /studio/agents
POST  /studio/agents
GET   /studio/agents/:id
PATCH /studio/agents/:id
POST  /studio/agents/:id/publish
POST  /studio/agents/:id/disable
```

注意：v1.7.1 不新增媒体上传 API。照片和视频只做浏览器本地预览。

## 2. Pricing Package API

管理员端新增 Studio Pricing Package Mock API：

```text
GET    /studio/billing/packages
POST   /studio/billing/packages
PATCH  /studio/billing/packages/:id
DELETE /studio/billing/packages/:id
POST   /studio/billing/packages/:id/discount
```

用户端仍使用：

```text
GET /billing/packages
```

## 3. 创建套餐

```http
POST /studio/billing/packages
```

请求：

```json
{
  "name": "¥10 基础包",
  "amountRmb": 10,
  "agentTokens": 10000,
  "status": "ACTIVE",
  "sortOrder": 20
}
```

## 4. 更新套餐

```http
PATCH /studio/billing/packages/pkg_10000
```

请求：

```json
{
  "name": "¥10 新手包",
  "amountRmb": 10,
  "agentTokens": 12000,
  "status": "ACTIVE",
  "sortOrder": 20
}
```

## 5. 删除套餐

```http
DELETE /studio/billing/packages/pkg_10000
```

返回：

```json
{
  "deleted": true,
  "id": "pkg_10000"
}
```

## 6. 折扣快捷操作

```http
POST /studio/billing/packages/pkg_10000/discount
```

请求：

```json
{
  "bonusPercent": 20
}
```

重置：

```json
{
  "reset": true
}
```

计算规则：

```text
baseTokens = amountRmb × 1000
bonusTokens = baseTokens × bonusPercent / 100
agentTokens = baseTokens + bonusTokens
```
