# Skill Library Modules - V2 Deferred

## 1. v1.5.5 状态

Skill Library 后端模块不进入 V1。

已从 V1 backend skeleton 中移除：

```text
src/modules/skill-profiles
SkillProfilesModule
SkillProfilesController
SkillProfilesService
SkillProfileRepository
```

## 2. V1 使用什么替代

V1 Agent 的人格、能力、边界统一存入：

```text
AgentVersion.manifest.config.prompt
```

由 Runtime Context Builder 注入大模型。

## 3. V2 再恢复

当系统需要真实工具调用时，再新增：

```text
src/modules/skill-profiles
src/modules/tools
src/modules/permissions
src/modules/tool-invocations
```
