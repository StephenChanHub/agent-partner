# 07-00. Auth Registration Policy v1.5.7

## 1. V1 认证边界

V1 阶段只支持最小、可落地、可扩展的身份体系：

```text
普通用户：邮箱验证码注册 + 邮箱密码登录
管理员：后端唯一内置账号 + 密码哈希校验
设备：设备码绑定 + device_token 认证
```

V1 不实现：

```text
手机号注册
OAuth / Google / Apple 登录
多管理员账号
RBAC 权限系统
短信验证码
验证码数据库表
```

---

## 2. 普通用户注册

注册必须分两步：

```text
请求邮箱验证码
↓
提交邮箱 + 验证码 + 密码 + 昵称完成注册
```

验证码只存 Redis，不进入 MySQL。

Redis Key 建议：

```text
jarvis:auth:email-code:register:{email}
```

Redis Value 建议存验证码哈希和尝试次数，不存明文验证码：

```json
{
  "codeHash": "bcrypt_or_hmac_hash",
  "purpose": "REGISTER",
  "attempts": 0,
  "createdAt": "2026-06-28T10:00:00.000Z"
}
```

默认策略：

```text
验证码长度：6 位数字
有效期：5 分钟
重发冷却：60 秒
最大验证尝试：5 次
验证成功后：立即删除 Redis Key
注册成功后：创建 users 记录
```

---

## 3. 普通用户登录

V1 登录使用：

```text
email + password
```

登录成功后返回：

```text
accessToken
refreshToken
user profile
```

用户登录不需要每次邮箱验证码。

---

## 4. 管理员账号

V1 管理员账号是唯一内置账号。

不允许：

```text
用户注册成为管理员
数据库创建多个管理员
Studio 页面创建管理员
普通 users 表中的 ADMIN 用户作为主要方案
```

推荐环境变量：

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$12$...
```

登录时：

```text
如果 email == ADMIN_EMAIL
↓
使用 bcrypt 校验 ADMIN_PASSWORD_HASH
↓
通过后签发 role=ADMIN 的 JWT
```

管理员身份可以视为 Virtual Admin Principal。

V1 中由管理员创建的资源，例如 Model Profile / Voice Profile，`created_by_id` 可以为空，或者后续 V2 迁移到真实 admin_users 表。

---

## 5. 安全要求

```text
验证码不能写入日志
验证码不能明文存 Redis
验证码失败次数必须限制
验证码请求必须限流
管理员密码不能明文写代码
管理员密码哈希必须来自环境变量
JWT_SECRET 必须是强随机值
Redis 必须带 namespace，避免环境混用
```

---

## 6. V2 升级方向

V2 可以升级为：

```text
admin_users 表
多管理员
RBAC
操作审计
邮箱登录验证码 / magic link
第三方登录
验证码服务商队列
```

但这些都不进入 V1。
