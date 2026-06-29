# 12-06 Agent Profile Editor & Pricing CRUD

版本：v1.7.1  
范围：Agent-Studio Web 管理员端。

## 1. Agent 编辑体验调整

v1.7.1 将 Agent 编辑从列表页 Drawer 拆分为独立页面：

```text
/agents/new
/agents/:id/edit
```

列表页只承担：

```text
查看 Agent 列表
进入编辑页
发布
禁用
```

## 2. Agent 编辑页布局

编辑页参考 Instagram 个人主页结构：

```text
顶部 Profile 区域
- 头像
- 名称
- 状态
- 照片数量
- 视频数量
- 版本
- 描述

中部基础信息表单
- 名称
- slug
- 描述
- 头像 URL
- Model Profile
- Voice Profile
- Config Prompt

底部媒体展示区域
- 全部
- 照片
- 视频
```

## 3. 媒体预览规则

v1.7.1 不做真实媒体上传。

管理员点击“添加照片预览”或“添加视频预览”时：

```text
浏览器读取本地文件
使用 URL.createObjectURL 生成临时预览地址
只在当前页面展示
不上传到 UTM Ubuntu
不调用 Core 上传接口
不写入 Agent Manifest
刷新页面后本地预览消失
```

这一规则避免在沙盒阶段过早引入：

```text
对象存储
文件上传安全
媒体审核
缩略图生成
CDN
```

## 4. Pricing 套餐 CRUD

Pricing 页面从只读展示升级为可编辑套餐管理。

支持：

```text
创建套餐
编辑套餐
删除套餐
启用 / 停用套餐
排序
```

套餐字段：

```text
id
name
amountRmb
baseTokens
agentTokens
bonusTokens
discountPercent
status
sortOrder
createdAt
updatedAt
```

## 5. 折扣快捷操作

v1.7.1 的“折扣”使用赠送 Tokens 表达，不改变人民币金额。

快捷操作：

```text
+10% 赠送
+20% 赠送
+50% 赠送
重置
```

计算规则：

```text
baseTokens = amountRmb × 1000
bonusTokens = baseTokens × bonusPercent
agentTokens = baseTokens + bonusTokens
```

例如：

```text
¥10 基础包
baseTokens = 10000
+20% 赠送 = 2000
最终 agentTokens = 12000
```

## 6. 沙盒边界

Pricing CRUD 目前只作用于 Mock 内存数据。后续接入真实数据库时，需要将 `mockRechargePackages` 替换为 Prisma Repository。
