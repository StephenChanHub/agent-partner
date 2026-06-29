# 13. 工程工作流与部署

## 1. 开发环境分工

```text
Mac = 写代码
GitHub = 版本管理
Ubuntu = 运行服务
Docker = 部署环境
```

不要直接在 Ubuntu 上改代码。

---

## 2. 推荐目录

### Mac

```text
~/Projects/
└── jarvis-platform/
    ├── core/
    ├── dashboard/
    ├── studio/
    ├── device/
    ├── docs/
    └── docker-compose.yml
```

### Ubuntu

```text
~/services/
└── jarvis-platform/
    ├── core/
    ├── docker-compose.yml
    └── .env
```

---

## 3. Monorepo 建议

V1 推荐使用 Monorepo，而不是拆成多个 Git 仓库。

原因：

1. Core、Dashboard、Studio、Device 会一起演进。
2. Docker Compose、环境变量、文档可以统一管理。
3. 早期项目减少仓库切换成本。
4. 更容易保持 API 与前端同步。

---

## 4. Docker Compose 服务

```yaml
services:
  core:
    build: ./core
    env_file: .env
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8

  redis:
    image: redis:7

  nginx:
    image: nginx:latest
```

V1 开发阶段 Dashboard 可直接在 Mac 上 `npm run dev`，不一定部署到 Ubuntu。

---

## 5. 每日开发流程

```text
Mac 修改代码
↓
npm test / npm run lint
↓
git add
↓
git commit
↓
git push
↓
Ubuntu git pull
↓
docker compose up -d --build core
```

---

## 6. Git 分支策略

V1 简化策略：

```text
main      # 稳定版本
develop   # 日常开发
feature/* # 单功能开发
```

发布流程：

```text
feature/*
↓ PR
develop
↓ tested
main
↓ deploy
Ubuntu
```

---

## 7. 环境变量规范

```env
NODE_ENV=development
DATABASE_URL=mysql://...
REDIS_URL=redis://...
JWT_SECRET=...
DEVICE_TOKEN_SECRET=...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
OBJECT_STORAGE_BUCKET=...
```

禁止：

- API Key 进入 Git
- 前端打包包含后端密钥
- 在日志里打印 token

---

## 8. 开发命令建议

```bash
# 安装依赖
pnpm install

# 启动 Core
pnpm --filter core dev

# 启动 Dashboard
pnpm --filter dashboard dev

# 启动 Studio
pnpm --filter studio dev

# Prisma
pnpm --filter core prisma:migrate
pnpm --filter core prisma:generate
```

---

## 9. 部署顺序

1. MySQL / Redis
2. Prisma Migration
3. Core
4. Nginx
5. Dashboard / Studio 静态部署
6. Device Client 配置 Core URL

---

## 10. 生产环境建议

V1 最小生产配置：

```text
1 台 Ubuntu VPS
Docker Compose
MySQL
Redis
Nginx + HTTPS
GitHub Actions 可选
```

后续扩展：

```text
独立数据库
对象存储
CI/CD
日志平台
监控告警
多实例 Core
Queue
```
