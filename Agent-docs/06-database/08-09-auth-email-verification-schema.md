# 08-09. Auth Email Verification Schema v1.5.7

## 1. V1 原则

V1 邮箱验证码注册不新增 MySQL 验证码表。

```text
验证码状态：Redis
用户身份：MySQL users
管理员身份：后端环境变量
```

---

## 2. Redis 验证码结构

Key：

```text
jarvis:auth:email-code:register:{email}
```

Value：

```json
{
  "codeHash": "hmac_or_bcrypt_hash",
  "purpose": "REGISTER",
  "attempts": 0,
  "createdAt": "2026-06-28T10:00:00.000Z"
}
```

TTL：

```text
AUTH_EMAIL_CODE_TTL_SECONDS=300
```

验证成功后删除 Key。

---

## 3. users 表字段

V1 在 users 表中保留邮箱验证时间：

```text
email_verified_at
```

注册成功时设置为当前时间。

---

## 4. 为什么不建 email_verification_codes 表

V1 不需要验证码历史追踪。

验证码是短生命周期数据，用 Redis 更合适：

```text
天然 TTL
无需定时清理 MySQL
减少表复杂度
降低注册链路成本
```

未来如果需要审计或风控，再引入 auth_events / verification_attempts 表。

---

## 5. 管理员账号

V1 管理员账号不进入 users 表。

配置来源：

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$12$...
```

这意味着：

```text
users 表里不需要创建 ADMIN 用户
普通注册永远只能创建 USER
Studio 访问依赖 ADMIN JWT
```

V2 可迁移为 admin_users 表。
