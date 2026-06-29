# 14. 安全与权限设计

## 1. 安全目标

Jarvis Platform 涉及用户身份、设备身份、语音数据、聊天数据、Agent 配置，以及未来可能出现的物理移动能力。

V1 必须建立清晰的安全边界。

V2 增加机器人移动能力前，必须补齐动作权限和急停策略。

---

## 2. 身份类型

```text
User Identity
Admin Identity
Device Identity
Service Identity（未来）
```

### User

V1 仅支持邮箱注册。注册时必须先通过邮箱限时验证码。验证码存 Redis，默认 5 分钟过期。登录使用邮箱 + 密码，成功后获取 JWT。

### Admin

V1 管理员是后端唯一内置账号，不通过普通注册创建，不需要进入 users 表。管理员邮箱和密码哈希来自环境变量，登录成功后签发 role = ADMIN 的 JWT。

### Device

使用 device_token 认证，不使用用户密码，不使用普通用户 JWT。

---

## 3. 权限模型

| 资源 | USER | ADMIN | DEVICE |
|---|:---:|:---:|:---:|
| 自己的 Profile | ✅ | ✅ | ❌ |
| 自己的 Messages | ✅ | 可选审计 | ❌ |
| 自己的 Devices | ✅ | ✅ | 当前设备有限 |
| Agent 列表 | ✅ | ✅ | ✅ |
| 完整 Manifest | ❌ | ✅ | ❌ |
| 创建 Agent | ❌ | ✅ | ❌ |
| 发布 Agent | ❌ | ✅ | ❌ |
| Chat Runtime | ✅ | 测试用 | ✅ |
| 查看设备移动状态 | ✅ | ✅ | 当前设备上报 |
| 下发移动命令 | 仅 owner 且授权 | 测试/维护 | ❌ 自己不能发起 |
| 急停 | ✅ | ✅ | ✅ 本地触发 |

---

## 4. 邮箱验证码策略

V1 注册验证码策略：

```text
验证码用途：REGISTER
验证码长度：6 位数字
存储位置：Redis
默认 TTL：5 分钟
重发冷却：60 秒
最大尝试：5 次
验证成功：立即删除
```

安全要求：

```text
Redis 中不存明文验证码
日志中不打印验证码
验证码请求必须限流
验证码错误次数必须限制
```

---

## 5. JWT 策略

建议：

```text
access_token: 15 分钟
refresh_token: 7~30 天
```

JWT Payload：

```json
{
  "sub": "user_id",
  "role": "USER",
  "iat": 123,
  "exp": 456
}
```

---

## 6. Device Token 策略

设备 token 必须满足：

- 绑定成功后只返回一次
- 设备本地保存
- 数据库存 Hash
- 可在 Dashboard 撤销
- 可重新生成
- 移动设备建议定期轮换

设备请求头：

```http
Authorization: Device <token>
```

---

## 7. Prompt 与 Manifest 安全

### 用户侧

用户不能获取完整 systemPrompt。

`GET /agents` 只返回公开字段：

```text
name
description
avatar
capabilities
```

### Studio 侧

只有 Admin 可以读取和编辑完整 Manifest。

---

## 8. Skill 权限（V2）

执行 Skill 必须满足三层校验：

```text
Agent Manifest Permission
+
User Authorization
+
Runtime Policy
```

例如 GitHub Skill：

```text
Agent 允许 github
用户绑定 GitHub
Runtime 当前请求需要 github
```

---

## 9. Robot Action 权限（V2）

物理动作必须满足五层校验：

```text
User owns Device
+
Device supports Capability
+
Agent Manifest allows Robot Permission
+
Runtime Safety Policy allows Action
+
Device Local Safety Check passes
```

### 9.1 Agent Manifest Permission 示例

```json
{
  "permissions": {
    "robot": {
      "enabled": true,
      "allowedActions": ["MOVE", "TURN", "STOP"],
      "maxSpeedLevel": "LOW",
      "requiresConfirmationFor": ["FOLLOW_ME", "DOCK"]
    }
  }
}
```

### 9.2 用户授权

普通用户必须能在 Dashboard 关闭移动能力。

```text
Enable Mobility: ON / OFF
Emergency Stop: Available Always
```

### 9.3 设备能力校验

如果设备没有上报：

```json
{"mobility":{"supportsMove":true}}
```

则 Core 不得下发 MOVE 命令。

---

## 10. 急停策略

急停必须有多个入口：

```text
语音：停下 / 别动
Dashboard 急停按钮
设备物理按钮
设备本地安全触发
Core 管理员强制停止
```

急停优先级：

```text
EMERGENCY_STOP > STOP > 所有动作 > 聊天回复
```

急停触发后：

1. 设备立即停止电机。
2. Core 标记设备 `EMERGENCY_STOPPED`。
3. Dashboard 显示红色状态。
4. 后续动作命令全部拒绝。
5. 需要用户或管理员手动解除。

---

## 10. 数据隔离

所有用户私有资源必须校验 ownership：

```text
agent_sessions.user_id == current_user.id
messages 通过 agent_session 归属校验
devices.user_id == current_user.id
device_commands.user_id == current_user.id（V2）
```

---

## 11. Rate Limit

建议 V1 基础限流：

| 接口 | 限流 |
|---|---|
| /auth/login | 严格限流 |
| /chat | 用户级限流 |
| /voice | 设备级限流 |
| /devices/bind | pairing_code 限流 |
| /studio/* | Admin 级审计 |
| /robot/commands | 用户 + 设备级限流 |
| /robot/stop | 不应被普通限流阻断，但需要审计 |

---

## 12. 敏感数据处理

禁止记录：

- 明文密码
- 明文 device_token
- 完整 Authorization header
- 第三方 API Key
- 用户上传音频的公开 URL（除非签名短链）
- 完整 systemPrompt
- 精确家庭地图（V3 前不建议收集）

---

## 13. 物理安全底线

V2 移动设备上线前必须完成：

- STOP 命令
- 物理急停
- 低速限制
- 命令超时
- 本地障碍物检测
- 低电量禁止移动
- 设备倾倒保护
- 电机异常停止
- Dashboard 急停按钮

没有这些，不允许进入真实移动测试。

---

## 14. V1 安全缺口清单

开发前必须补齐：

- 密码 Hash 算法选择，例如 Argon2 / bcrypt
- Refresh Token 存储策略
- Device Token Hash 策略
- Pairing Code 过期与重放防护
- Admin 创建机制
- CORS 白名单
- HTTPS 强制策略
- API Error 不泄漏内部堆栈

---

## 15. V2 Robot 安全缺口清单

机器人移动开发前必须补齐：

- Robot Permission Schema
- Device Capability Schema
- Device Command 签名或可信通道
- Command Timeout
- Emergency Stop 状态机
- Safety Event 日志
- Dashboard Mobility 开关
- 测试环境与真实环境隔离


# v1.5.1 补充：Model / Voice Resource Security

## API Key 安全

`model_profiles.api_key_encrypted` 必须加密保存。

禁止：

```text
明文保存 API Key
日志打印 API Key
API 响应返回 API Key
Agent Manifest 保存 API Key
前端 localStorage 保存 API Key
```

允许：

```text
Studio 创建/更新时提交 apiKey
服务端立即加密
响应只返回 apiKeyMasked
Runtime 内部解密调用 Provider
```

## 权限

只有 Admin 可以：

```text
创建 Model Profile
修改 Model Profile
测试 Model Profile
创建 Voice Profile
修改 Voice Profile
同步 ElevenLabs Voices
```

普通 User 不可访问任何 Profile 管理接口。

## 审计建议

后续版本应记录：

```text
谁创建了 Profile
谁修改了 API Key
谁设置为默认
哪些 Agent 引用了 Profile
Profile 测试是否成功
```

V1.5.1 先保留 `created_by_id`。

---

# v1.5.2：Skill Library 权限与风险控制

Skill Profile 可能赋予 Agent 高风险能力，例如机器人移动、文件访问、外部搜索、GitHub 操作。

因此：

- 只有 Admin 可以创建和编辑 Skill Profile。
- 普通 User 不能直接看到 Skill Manifest 内部规则。
- Tool Skill 必须声明 `riskLevel` 和 `requiredPermission`。
- Robot Control 类 Skill 必须绑定安全策略。
- Published Agent 引用的 Skill Profile 不允许静默破坏性修改。

高风险 Tool Skill 示例：

```json
{
  "kind": "TOOL",
  "tool": {
    "name": "robot.move",
    "riskLevel": "high",
    "requiredPermission": "ROBOT_CONTROL",
    "requiresConfirmation": true
  }
}
```


---

## v1.5.4 Usage & Billing Foundation

新增用户余额和用量基础能力：普通用户可查看自己的 token 余额和使用明细；管理员可查看用户邮箱、昵称、最后上线时间、余额、累计消耗，并可在 V1 手动调整测试余额。

---

# Billing Security Rules v1.5.8

```text
前端不能提交 input_tokens / output_tokens / tts_characters 作为计费依据。
所有 usage 必须由服务端 Adapter 采集。
Agent Tokens 扣费必须在服务端完成。
管理员手动调整余额必须写 usage_records。
价格规则变化后，历史 usage_records 的 pricing_snapshot 不应被修改。
日志中不能输出 DeepSeek / ElevenLabs API Key。
余额不足时，V1 不生成 ElevenLabs 语音，避免高成本失控。
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


---

# v1.5.10 Security Update：Admin Manual Token Adjustment

管理员手动增加 Agent Tokens 是高风险操作。V1 必须遵守：

```text
仅 ADMIN 可调用。
reason 必填。
amountAgentTokens 必须大于 0。
单次上限由 ADMIN_TOKEN_ADJUST_MAX_AMOUNT 控制。
必须记录 operator_admin_id。
必须写 agent_token_transactions。
必须写系统日志。
禁止只更新 users.balance_tokens。
```
