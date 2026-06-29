# Behavior Policy Runtime - V2 Deferred

## 1. 状态

v1.5.5 后，Behavior Policy Runtime 不进入 V1 独立模块。

V1 的行为边界直接写进：

```text
manifest.config.prompt
```

## 2. V1 示例

```text
不要编造不存在的事实。
不确定时说明不确定。
不要执行危险动作。
回答先给结论，再解释原因。
```

## 3. V2 再拆分

当 V2 需要机器人动作、工具调用、高风险操作确认时，再把 Behavior Policy 独立出来。
