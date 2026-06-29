# v1.7.3 Implementation Notes

## 前端

### AvatarInitial

新增 `AvatarInitial` 组件，所有头像类 UI 统一使用：

- 背景：`#0D21A5`
- 字符：白色首字符
- Agent 编辑页使用 `large` 模式，字号更大

### 删除二次确认

新增 `confirmDangerTwice`：

1. 第一次 `modal.confirm` 展示删除影响。
2. 第二次 `modal.confirm` 要求再次确认。
3. 第二次确认后才调用 DELETE API。

使用页面：

- AgentsPage
- ModelProfilesPage
- VoiceProfilesPage
- PricingPage

### Pricing 页面

`PricingPage` 拆为两个 Tab：

- Billing Pricing Rules
- Recharge Packages

Pricing Rules 调用：

- `studioApi.pricingRules`
- `studioApi.createPricingRule`
- `studioApi.updatePricingRule`
- `studioApi.deletePricingRule`

## 后端

### 删除接口

新增服务方法：

- `AgentsService.delete`
- `ModelProfilesService.delete`
- `VoiceProfilesService.delete`

沙盒阶段直接从 Mock 数组中移除。

### PricingRuleService

新增 `PricingRuleService`，使用 `mockPricingRules` 作为沙盒内存数据源。

方法：

- `listRules`
- `getRule`
- `createRule`
- `updateRule`
- `deleteRule`
- `numberValue`

`BillingService.pricing()` 从 `PricingRuleService` 读取生效规则，形成当前价格快照。

## 真实数据库阶段注意

进入真实数据库后，删除逻辑建议升级为：

1. 默认软删除。
2. 删除前检查 Agent 引用的 Model / Voice。
3. 禁止删除正在被 Published Agent 使用的 Model / Voice。
4. 关键计费规则可以停用，但不建议物理删除。
5. 所有删除操作写入审计日志。
