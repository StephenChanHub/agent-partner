# 07-01. Auth API v1.5.7

## 1. 模块职责

Auth API 负责 V1 的用户身份认证。

V1 只支持：

```text
邮箱验证码注册
邮箱密码登录
唯一内置管理员登录
刷新 Token
退出登录
读取当前用户
```

不支持：

```text
手机号注册
OAuth 登录
多管理员
用户注册为 Admin
复杂 RBAC
```

---

## 2. V1 身份策略

### 普通用户

```text
注册：邮箱 + 验证码 + 密码 + 昵称
登录：邮箱 + 密码
身份来源：users 表
角色：USER
```

### 管理员

```text
账号来源：后端环境变量
数量：唯一账号
密码：bcrypt hash
角色：ADMIN
是否进入 users 表：V1 不需要
```

---

## 3. Token 策略

Dashboard 和 Studio 使用：

```http
Authorization: Bearer <access_token>
```

建议：

```text
accessToken: 15 分钟
refreshToken: 7~30 天
```

refreshToken 建议使用 httpOnly Cookie 或安全存储。

---

## 4. POST /auth/email-code/send

请求邮箱验证码。

V1 用于用户注册。

### Request

```json
{
  "email": "user@example.com",
  "purpose": "REGISTER"
}
```

### Response

```json
{
  "data": {
    "success": true,
    "expiresIn": 300,
    "cooldownSeconds": 60
  },
  "requestId": "req_01"
}
```

### 行为

```text
生成 6 位数字验证码
↓
将验证码哈希写入 Redis
↓
设置 TTL，默认 5 分钟
↓
发送邮件
```

Redis Key：

```text
jarvis:auth:email-code:register:{email}
```

验证码必须限流。

---

## 5. POST /auth/register

使用邮箱验证码完成注册。

### Request

```json
{
  "email": "user@example.com",
  "verificationCode": "123456",
  "password": "strong-password",
  "nickname": "Stephen"
}
```

### Response

```json
{
  "data": {
    "user": {
      "id": "usr_01",
      "email": "user@example.com",
      "nickname": "Stephen",
      "role": "USER",
      "createdAt": "2026-06-27T10:00:00.000Z"
    },
    "accessToken": "jwt.access.token",
    "refreshToken": "jwt.refresh.token"
  },
  "requestId": "req_01"
}
```

### 行为

```text
检查邮箱是否已注册
↓
从 Redis 读取验证码
↓
校验验证码
↓
验证码成功后立即删除 Redis Key
↓
创建 users 记录
↓
设置 email_verified_at
↓
签发 Token
```

注册成功后不批量创建 Agent Session。用户第一次打开某个 Agent 时再创建对应 Agent Session。

---

## 6. POST /auth/login

用户或管理员登录。

### Request

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### Response

```json
{
  "data": {
    "user": {
      "id": "usr_01",
      "email": "user@example.com",
      "nickname": "Stephen",
      "role": "USER"
    },
    "accessToken": "jwt.access.token",
    "refreshToken": "jwt.refresh.token"
  },
  "requestId": "req_01"
}
```

### Admin 行为

如果 email 等于环境变量 `ADMIN_EMAIL`：

```text
读取 ADMIN_PASSWORD_HASH
↓
bcrypt 校验密码
↓
签发 role=ADMIN 的 JWT
```

V1 管理员不通过普通注册创建。

---

## 7. POST /auth/refresh

刷新 accessToken。

### Request

```json
{
  "refreshToken": "jwt.refresh.token"
}
```

### Response

```json
{
  "data": {
    "accessToken": "new.jwt.access.token",
    "refreshToken": "new.jwt.refresh.token"
  },
  "requestId": "req_01"
}
```

---

## 8. POST /auth/logout

退出登录。

### Request

```json
{
  "refreshToken": "jwt.refresh.token"
}
```

### Response

```json
{
  "data": {
    "success": true
  },
  "requestId": "req_01"
}
```

---

## 9. GET /me

获取当前登录用户。

### Headers

```http
Authorization: Bearer <access_token>
```

### Response

```json
{
  "data": {
    "id": "usr_01",
    "email": "user@example.com",
    "nickname": "Stephen",
    "avatarUrl": null,
    "role": "USER",
    "currentSessionId": "ses_01",
    "createdAt": "2026-06-27T10:00:00.000Z"
  },
  "requestId": "req_01"
}
```

---

## 10. 错误码

| Code | HTTP | 场景 |
|---|---:|---|
| VALIDATION_ERROR | 400 | email / password / code 格式错误 |
| INVALID_EMAIL_CODE | 400 | 验证码错误 |
| EMAIL_CODE_EXPIRED | 400 | 验证码过期 |
| UNAUTHORIZED | 401 | 密码错误或 token 无效 |
| CONFLICT | 409 | 邮箱已注册 |
| RATE_LIMITED | 429 | 验证码请求或登录尝试过多 |
