# Skill Library & Agent Profile Model - V2 Deferred

## 1. 状态

本文档在 v1.5.5 中被标记为：

```text
V2 设计保留，不进入 V1 实现范围。
```

v1.5.2 曾经提出：

```text
大模型 + 音色 + Skill/Profile = 一个 Agent
```

这个方向长期正确，但 V1 当前只做文字聊天和语音聊天，因此不需要在数据库和 Studio 中拆分 Persona / Capability / Tool / Behavior。

## 2. V1 的替代方案

V1 使用：

```text
config.prompt
```

来统一表达：

```text
Persona：人格
Capability：专业能力
Tool：能力描述，不是真实工具调用
Behavior：行为边界
Prompt：Agent 专属设定
```

## 3. V2 再启用的能力

当 V2 需要实现以下能力时，再恢复 Skill Library：

```text
Search
GitHub
Calendar
Weather
Robot Move
Camera / Vision
Home Assistant
真实工具调用
工具权限管理
行为策略复用
Persona 模板复用
```

## 4. V2 可能的数据模型

V2 可以考虑：

```text
skill_profiles
或
persona_profiles
capability_profiles
tool_skills
behavior_policies
```

当前不创建这些表。

## 5. V1 明确不做

```text
不做 Skill Profile CRUD
不做 Skill Profile 选择器
不做 Tool Skill 执行
不做 Behavior Policy Builder
不做 Agent-Skill 关联
```

V1 只在 Studio Agent Editor 中提供一个 `config.prompt` 文本框。
