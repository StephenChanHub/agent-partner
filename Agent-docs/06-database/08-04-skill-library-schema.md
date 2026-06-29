# Skill Library Schema - V2 Deferred

## 1. v1.5.5 状态

`skill_profiles` 表不进入 V1。

原因：V1 只做文字聊天和语音聊天，Persona、Capability、Tool、Behavior 在 V1 中全部统一写入：

```text
agent_versions.manifest.config.prompt
```

## 2. V1 不创建的表

```text
skill_profiles
agent_skills
persona_profiles
capability_profiles
tool_skills
behavior_policies
```

## 3. V2 再创建的条件

当系统真正需要下面能力时，再重新设计 Skill Library Schema：

```text
工具调用
权限校验
Robot Action
外部 API 集成
不同 Agent 复用能力包
行为策略统一管理
```

## 4. V1 替代字段

V1 使用 Manifest JSON：

```json
{
  "config": {
    "prompt": "你是 Coding Mentor..."
  }
}
```

不需要任何 Skill 相关数据库结构。
