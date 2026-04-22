# edg-e2e

独立的 Web UI 自动化测试项目，对外通过 `http://localhost:3000`（前端）+ `http://localhost:3001`（后端）访问 [../edg](../edg) 里的业务应用，与业务代码完全解耦。

## 目录

```
e2e/
├── playwright.config.ts        # Playwright 配置（testDir: ./tests）
├── package.json                # 只依赖 @playwright/test
├── tests/
│   ├── auth.setup.ts           # 4 角色登录 + 写 storageState
│   ├── fixtures/               # auth fixture + 测试账号
│   ├── pages/                  # POM
│   └── specs/                  # 测试用例
└── .web-e2e/
    ├── testcases/              # 用例设计文档（md）
    ├── dump/                   # dump-web-ui 产物
    ├── routes.config.mjs
    └── project-profile.json
```

## 常用命令

```bash
# 安装
npm install
npx playwright install chromium

# 跑全量
npm test

# 有头 + 慢动作
npm run test:slow

# UI 调试模式
npm run test:ui

# 跑单个 spec
npx playwright test tests/specs/login.spec.ts

# 只跑某个 @tag
npx playwright test -g "@P0"
```

## 前置：业务服务要起来

在 `../edg` 下：

```bash
# 前端
npm run dev            # :3000 (或 WEB_PORT)

# 后端
cd backend && npm run start:dev    # :3001 (或 API_PORT)
```

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `WEB_PORT` | 3000 | 前端端口 |
| `API_PORT` | 3001 | 后端端口 |
| `API_BASE` | http://localhost:3001/api | 登录接口 base |
| `BASE_URL` | http://localhost:3000 | storageState 里 origin |
| `SLOWMO`   | 0 | 慢动作毫秒 |
