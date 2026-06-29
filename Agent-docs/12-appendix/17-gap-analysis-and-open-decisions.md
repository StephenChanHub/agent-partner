# 17. Gap Analysis & Open Decisions v1.5.5

## 1. 已关闭决策

### 是否拆分 Persona / Capability / Tool / Behavior？

结论：V1 不拆。

V1 使用：

```text
manifest.config.prompt
```

统一表达 Agent 的人格、能力、行为边界和专属设定。

### 是否保留 Skill Library？

结论：V1 不保留，V2 再做。

### 是否增加 Agent 图片 / 视频字段？

结论：增加。

V1 在 Manifest 中增加：

```text
social.galleryImages[]
social.galleryVideos[]
```

不建媒体表。

### 是否保留 Model Library 和 Voice Library？

结论：保留。

它们是平台资源，短期也有价值。

## 2. 仍然开放的 V1 决策

### 图片和视频是否支持真实上传？

V1 暂定：只保存路径或 URL。

真实上传、文件管理、转码、CDN 放 V2。

### Voice Profile 是否支持多 ElevenLabs API Key？

V1 暂定：平台级单 API Key。

V2 如需多供应商账号，再建 provider credential 表。

### Usage 是否真实扣费？

V1 暂定：记录用量，可手动调整余额；不接支付网关。

## 3. V2 待设计

```text
Skill Library
Tool Invocation
Robot Action 实际执行
Agent Media Library
Payment / Orders
Embedding Memory
Admin RBAC
```


---

# v1.5.9 Recharge Orders Note

V1 已新增轻量充值订单和余额流水能力。相关完整说明见：

```text
03-domain/04-09-lightweight-recharge-orders-model.md
05-api/07-13-lightweight-recharge-orders-api.md
06-database/08-11-lightweight-recharge-orders-schema.md
09-frontend/12-03-wallet-recharge-orders-ui.md
10-engineering/11-23-lightweight-recharge-orders-module.md
```

关键规则：订单记录充值行为，流水记录余额变化，Usage 记录消费明细。所有余额变化都必须写 `agent_token_transactions`。


## v1.6 后仍需确认的问题

1. DeepSeek 真实 API 的最终 response usage 字段映射。
2. ElevenLabs 真实音频返回格式与临时文件写入方式。
3. 余额扣费是否在 Mock 阶段真实修改数据库，还是仅返回模拟 usage。
4. WebSocket 是否在 v1.6 立即实现，还是先由轮询拉取消息。
5. Studio 上传 Agent 图片/视频是否在 V1 只填 URL，还是补最小上传接口。
