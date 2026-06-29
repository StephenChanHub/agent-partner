# 21 Local Fixes Officialized

版本：v1.6.2

本文件记录从用户本地沙盒启动过程中发现并正式纳入项目包的修复。

## 1. 缺失 Nest 项目配置

问题：

```text
Could not find TypeScript configuration file "tsconfig.json"
```

正式修复：

```text
tsconfig.json
tsconfig.build.json
nest-cli.json
```

## 2. TypeScript 6 配置变化

问题：

```text
TS5011 common source directory requires rootDir
TS5101 baseUrl deprecated
```

正式修复：

```text
rootDir = ./src
移除 baseUrl
```

同时 `package.json` 将 TypeScript 收敛到：

```text
~5.8.3
```

## 3. Prisma 沙盒 Stub

问题：

```text
@prisma/client has no exported member PrismaClient
$queryRaw / $connect / $disconnect 不存在
```

正式修复：沙盒阶段使用 `PrismaService` Stub，不连接真实数据库。

## 4. Runtime 类型重复

问题：

```text
context/runtime-context.types.ts
types/runtime-context.types.ts
```

两份类型同时存在，导致 `RuntimeContext` 不兼容。

正式修复：

```text
types/runtime-context.types.ts 是唯一真实类型
context/runtime-context.types.ts 只做 re-export
```

## 5. Engine 方法缺失

问题：

```text
ChatEngineService.run 不存在
RobotEngineService.run 不存在
IntentResult / ActionResult 未定义
```

正式修复：补齐 Runtime Stub：

```text
ChatEngineService.run
RobotEngineService.run
VoiceEngineService.run
SystemEngineService.run
IntentEngineService.analyze
TaskDispatcherService.dispatch
```

## 6. Nest 入口缺失

问题：

```text
Cannot find module dist/main
```

正式修复：

```text
src/main.ts
nest-cli.json entryFile = main
```

## 7. 结论

这些修复不是临时 workaround，而是 v1.6.2 后端沙盒基线的一部分。后续任何版本都必须继承这些文件和策略。
