# 11-04. DTO 与 Validation 规范

> Version: v1.4  
> Purpose: 统一 API 输入输出、校验规则和错误响应结构。

## 1. DTO 原则

DTO 是 API Contract 在后端的代码表达。

DTO 只负责：

```text
字段结构
类型约束
输入校验
默认值
API 文档描述
```

DTO 不负责：

```text
业务判断
数据库查询
权限判断
调用 Runtime
```

---

## 2. 输入 DTO 命名

```text
CreateXxxDto
UpdateXxxDto
XxxQueryDto
XxxCommandDto
```

示例：

```text
LoginDto
CreateAgentSessionDto
CreateRuntimeEventDto
CreateRobotActionDto
DeviceHeartbeatDto
```

---

## 3. 输出 DTO 命名

```text
XxxResponseDto
XxxSummaryDto
XxxDetailDto
```

示例：

```text
AgentSummaryDto
AgentDetailDto
MessageResponseDto
RuntimeEventResponseDto
```

---

## 4. 分页 DTO

统一 Cursor Pagination。

```ts
export class CursorPaginationQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
```

统一响应：

```ts
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

---

## 5. Error Response

统一错误结构：

```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent not found.",
    "details": {},
    "requestId": "req_123"
  }
}
```

错误码分组：

```text
AUTH_*
USER_*
AGENT_*
SESSION_*
MESSAGE_*
DEVICE_*
RUNTIME_*
INTENT_*
ACTION_*
ROBOT_*
STUDIO_*
SYSTEM_*
```

---

## 6. Runtime Event DTO

```ts
export class CreateRuntimeEventDto {
  @IsEnum(RuntimeEventSource)
  source!: RuntimeEventSource;

  @IsEnum(RuntimeEventType)
  type!: RuntimeEventType;

  @IsOptional()
  @IsString()
  agentSessionId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
```

---

## 7. Chat Request DTO

```ts
export class ChatRequestDto {
  @IsString()
  agentSessionId!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsBoolean()
  stream?: boolean = true;
}
```

---

## 8. Robot Action DTO

```ts
export class CreateRobotActionDto {
  @IsString()
  deviceId!: string;

  @IsEnum(RobotActionType)
  type!: RobotActionType;

  @IsObject()
  params!: Record<string, unknown>;
}
```

Robot Action 的安全校验不放在 DTO，而放在 Robot Safety Service。

---

## 9. Device DTO

### Device Connect

```ts
export class DeviceConnectDto {
  @IsString()
  deviceId!: string;

  @IsString()
  deviceToken!: string;

  @IsOptional()
  @IsObject()
  capabilities?: Record<string, unknown>;
}
```

### Heartbeat

```ts
export class DeviceHeartbeatDto {
  @IsString()
  deviceId!: string;

  @IsOptional()
  @IsNumber()
  batteryPercent?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  telemetry?: Record<string, unknown>;
}
```

---

## 10. ValidationPipe 配置

`main.ts` 必须启用全局校验：

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

---

## 11. DTO 与 OpenAPI 的关系

v1.4 后端 DTO 必须对齐：

```text
05-api/openapi.yaml
```

任何 DTO 字段变更，都必须同步 API Contract 文档。

---

## 12. v1.4 验收标准

```text
核心 DTO 文件存在
分页 DTO 存在
Error Response DTO 存在
Runtime Event DTO 存在
Robot Action DTO 存在
Device DTO 存在
ValidationPipe 配置明确
```
