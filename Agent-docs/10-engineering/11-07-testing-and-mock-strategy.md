# 11-07. Testing 与 Mock Strategy

> Version: v1.4  
> Purpose: 定义 v1.4 后端骨架到 v1.6 Mock API 的测试与模拟策略。

## 1. 阶段目标

v1.4 不要求真实业务完成，但要求每个模块可以被测试、替换和 Mock。

测试目标：

```text
模块能加载
Service 能实例化
Runtime Pipeline 能走通
Repository 能被 Mock
Infrastructure Port 能替换为 Mock Adapter
```

---

## 2. 测试分层

```text
Unit Test
↓
Module Test
↓
API Contract Test
↓
Runtime Pipeline Test
↓
Mock Integration Test
```

v1.4 重点是 Unit Test 与 Module Test。

---

## 3. Unit Test

每个 Service 至少准备测试文件：

```text
__tests__/<module>.service.spec.ts
```

示例：

```ts
describe('AgentSessionsService', () => {
  it('creates a session when it does not exist', async () => {
    // mock repository
  });
});
```

---

## 4. Runtime Pipeline Test

Runtime 至少验证：

```text
输入 Chat Event
↓
生成 Runtime Context
↓
识别 CHAT Intent
↓
分发 Chat Action
```

以及：

```text
输入 Robot Move Event
↓
识别 ROBOT_MOVE Intent
↓
生成 Robot Command Action
```

v1.4 使用 MockLLMPort、MockRobotCommandPort。

---

## 5. Mock Adapter

v1.5 / v1.6 会正式实现：

```text
MockLLMAdapter
MockTTSAdapter
MockSTTAdapter
MockRobotCommandAdapter
MockDeviceGateway
MockCacheAdapter
```

v1.4 先定义接口位置。

---

## 6. API Contract Test

v1.6 开始，API 必须对齐：

```text
05-api/openapi.yaml
```

建议使用：

```text
OpenAPI schema validation
supertest
contract snapshot
```

---

## 7. Mock API 策略

v1.6 Mock API 的目标不是假装完成业务，而是让三端可以并行开发。

Mock 范围：

```text
Auth 登录返回固定 JWT
Agents 返回固定 Agent 列表
Agent Sessions 返回固定 Session
Messages 返回固定消息
Runtime Chat 返回 SSE Mock
Device Connect 返回 Online
Robot Action 返回 PENDING → DISPATCHED → SUCCEEDED
Studio Publish 返回 Mock Version
```

---

## 8. 测试数据 Seed

建议提供最小 seed：

```text
Admin User
Normal User
Jarvis Agent
Coding Mentor Agent
IELTS Coach Agent
One Raspberry Pi Device
Three Agent Sessions
Sample Messages
```

v1.4 只写 seed 规划，v1.5 / v1.6 实现。

---

## 9. CI 检查

最小 CI：

```text
pnpm lint
pnpm test
pnpm build
prisma validate
```

v1.4 先写入工程规范，v1.5 再配置 GitHub Actions。

---

## 10. v1.4 验收标准

```text
测试目录规范明确
Runtime Pipeline 测试策略明确
Mock Adapter 策略明确
Mock API 范围明确
Seed 数据范围明确
CI 最小检查明确
```
