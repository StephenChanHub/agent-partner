# 11-21. Auth Email Registration Module v1.5.7

## 1. 模块目标

V1 Auth Module 只实现最小闭环：

```text
邮箱验证码注册
邮箱密码登录
唯一管理员登录
JWT 签发
Refresh / Logout
```

---

## 2. 模块组成

```text
modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── email-code.service.ts
├── admin-auth.service.ts
├── dto/
│   ├── send-email-code.dto.ts
│   ├── register.dto.ts
│   └── login.dto.ts
└── repositories/
    └── auth-user.repository.ts
```

---

## 3. 依赖边界

Auth Module 可以依赖：

```text
Cache Adapter / Redis
Mailer Adapter
Crypto / Password Hash
JWT Service
User Repository
Config Service
```

Auth Module 不允许依赖：

```text
Runtime
LLM Adapter
TTS Adapter
Device Runtime
Studio Agent Service
```

---

## 4. Email Code Service

职责：

```text
生成验证码
哈希验证码
写入 Redis
发送邮件
校验验证码
限制尝试次数
验证成功删除验证码
```

V1 可先使用 Mock Mailer，在日志中只显示“已发送”，但不得打印验证码到生产日志。

---

## 5. Admin Auth Service

职责：

```text
读取 ADMIN_EMAIL
读取 ADMIN_PASSWORD_HASH
bcrypt 校验
返回 Virtual Admin Principal
```

V1 管理员不进入 users 表。

---

## 6. v1.6 Mock API 要求

v1.6 至少跑通：

```text
POST /auth/email-code/send
POST /auth/register
POST /auth/login
GET /me
```

Mock 环境中可以将验证码固定为 `123456`，但必须通过配置显式启用：

```env
AUTH_EMAIL_CODE_MOCK_ENABLED=true
```
