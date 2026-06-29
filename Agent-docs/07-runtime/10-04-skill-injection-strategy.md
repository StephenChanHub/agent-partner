# Skill Injection Strategy - V2 Deferred

## 1. 状态

v1.5.5 之后，Skill Injection 不进入 V1 Runtime。

V1 不做工具调用，不注入 Tool Schema。

## 2. V1 替代方案

管理员把 Agent 的人格、能力、边界写进：

```text
manifest.config.prompt
```

Runtime 每次调用大模型时注入这段提示词。

## 3. V2 再启用

当系统需要：

```text
Search
GitHub
Calendar
Robot Move
Weather
Function Calling
```

再设计 Skill Injection。
