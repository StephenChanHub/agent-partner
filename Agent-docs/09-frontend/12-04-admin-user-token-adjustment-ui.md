# 12-04 Admin User Token Adjustment UI

版本：`v1.5.10`

## 1. 页面位置

管理员端：

```text
Studio / Users / User Detail
```

在用户详情页增加：

```text
增加 Agent Tokens
```

## 2. 弹窗字段

```text
用户邮箱：只读
当前余额：只读
增加数量：必填，正整数
原因：必填
确认按钮
```

## 3. 交互流程

```text
管理员点击“增加 Agent Tokens”
↓
填写数量和原因
↓
点击确认
↓
调用 POST /studio/users/{id}/tokens/adjust
↓
刷新用户余额
↓
刷新余额流水
```

## 4. V1 不开放扣减

V1 页面只允许：

```text
增加
```

不允许：

```text
扣减
```

避免误操作和客服纠纷。

## 5. 余额流水展示

管理员端用户详情应展示流水：

```text
时间
类型
方向
数量
操作前余额
操作后余额
原因
操作管理员
```

用户端 Wallet 页面也可以展示这条流水，但不展示操作管理员信息。
