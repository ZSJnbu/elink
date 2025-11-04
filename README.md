# 外链优化平台

## 项目简介
本项目基于 **Next.js + T3 Stack** 打造，提供“英文文本关键词提取 + 外链智能推荐”的一站式能力，既可通过 Web UI 操作，也支持外部系统通过 API 集成。项目内置管理员后台，用于签发访问密钥和管理调用权限。

## 核心能力
- **AI 关键词分析**：支持使用内置 OpenAI Key 或外部自定义模型，自动提炼文章中的高价值关键词。
- **外链推荐**：集成 Serper 搜索服务，可结合偏好域名和黑名单筛选最佳链接。
- **访问密钥管理**：管理员后台提供密钥的添加、查看、删除能力，接口访问需凭密钥鉴权。
- **多模型兼容**：POST 接口支持自定义 `baseUrl` + `apiKey`，满足第三方 OpenAI 兼容模型的调用需求。

## 快速开始
1. **环境准备**
   - Node.js ≥ 20（推荐使用 [Bun](https://bun.sh/) 以匹配现有脚本）
   - PostgreSQL（如需持久化用户数据，可自行部署；默认使用 Upstash Redis Adapter）
2. **安装依赖**
   ```bash
   bun install
   ```
3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 根据需求填写密钥和服务地址
   ```
4. **启动开发服务**
   ```bash
   bun run dev
   ```
5. **访问应用**
   - 前台：<http://localhost:3000>
   - 登录页面：<http://localhost:3000/login>
   - 管理后台：<http://localhost:3000/admin>（默认账号 `admin / admin123`）

## 环境变量
核心变量如下，全部写入 `.env.local`：

| 名称 | 说明 |
| ---- | ---- |
| `OPENAI_API_KEY` | 默认 AI 模型调用所使用的 OpenAI Key |
| `SERPER_API_KEY` | Serper 搜索服务密钥（用于外链推荐） |
| `AUTH_SECRET` | NextAuth 会话密钥，可使用 `openssl rand -base64 32` 生成 |
| `AUTH_TRUST_HOST` / `NEXTAUTH_URL` | NextAuth 相关配置，开发环境可保持默认 |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Next.js Server Actions 的稳定密钥 |
| `PLUNK_API_KEY` / `NEXT_PUBLIC_PLUNK_API_KEY` | 邮件通知服务配置（如不使用可暂留占位值） |
| `ADMIN_EMAIL` / `EMAIL_SERVER` | 邮件登录使用的 SMTP 账号配置 |
| `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN` | Upstash Redis 凭证（必填，所有服务端数据持久化依赖 Redis） |
| `RESEND_API_KEY` | 可选邮件服务 Resend 的密钥 |
| `ADMIN_PORTAL_USERNAME` / `ADMIN_PORTAL_PASSWORD` | 管理员后台默认账号密码，默认为 `admin/admin123` |
| `ZPAY_PID` / `ZPAY_KEY` | 7Pay 商户 ID 与签名密钥，用于扫码支付 |
| `C_ID` | （可选）7Pay 渠道 ID，指定固定收款通道 |

## 常用脚本
- `bun run dev`：启动开发环境
- `bun run build`：构建生产包
- `bun run preview`：构建并运行生产服务
- `bun run typecheck`：执行 TypeScript 类型检查
- `bun run lint` / `bun run lint:fix`：代码质量检查与自动修复
- `bun run db:*`：Drizzle 数据库脚本（如需使用 PostgreSQL）

## 项目结构
```
src/
  actions/              # Server Actions（含管理员相关动作）
  app/                  # Next.js App Router 页面与 API
    admin/              # 管理后台入口
    api/external-links/ # 对外 POST API
    login/              # 登录页（支持邮箱与管理员凭证）
    settings/           # 前台设置页面
  components/
    admin/              # 密钥管理 UI
    auth/               # 登录相关组件
    keyword-editor/     # 关键词编辑与展示
    layout/             # 全局布局组件
    settings/           # 用户自定义配置组件
  hooks/                # 业务 Hook
  lib/                  # 工具库（AI、Serper、错误处理等）
  server/
    api-keys/           # 密钥存储与校验逻辑
    kv/                 # Redis 客户端封装
  stores/               # Zustand 状态管理
  services/             # 业务服务层（关键词 / 搜索 / 认证）
  types/                # 全局类型声明
```

## 管理后台
- 访问路径：`/admin`
- 默认管理员账号：`admin / admin123`（可通过环境变量覆盖）
- 功能：
  1. 查看已颁发的访问密钥（仅展示哈希片段与元数据）
  2. 新增访问密钥：录入授权邮箱即可生成密钥（SHA-256），页面会弹出密钥提示并尝试自动复制
  3. 查看密钥详情：支持再次查看指定邮箱对应的密钥原文（后台即时计算）
  4. 编辑授权邮箱：修改后会重新生成密钥并提示复制
  5. 删除密钥：删除后即刻失效
- 只有 `session.user.isAdmin === true` 的用户才能看到导航入口；未授权访问将被重定向到首页。

## 外部 API 使用指南

### 接口概览
- **请求方式**：`POST`
- **接口地址**：`/api/external-links`
- **功能说明**：输入英文文本，自动提取关键词并生成外链推荐，同时返回 Token 使用情况。

### 认证要求
- 所有请求只需在 JSON 请求体中携带授权邮箱（`email` 字段），该邮箱必须已在后台登记。
- 另外需要在请求头中添加 `x-token`，Token 可在管理后台或“密钥”页面的详情弹窗中直接复制。
- 缺少或传入错误邮箱 / Token 时，接口将返回 `401`，并提示 `"未被授权使用 Elink"`。
- 邮箱将与后台登记的密钥记录绑定，后端会基于邮箱自动计算访问凭证。
- 使用平台内置 OpenAI Key 的登录用户将按照 `1 美元 / 1000 token` 的汇率从账户余额自动扣费（以 AI 返回的 `totalTokens` 计算）。

### 请求体字段
| 字段名 | 是否必填 | 说明 |
| ------ | -------- | ---- |
| `email` | 必填 | 授权邮箱，需提前在后台登记 |
| `text` | 必填 | 需要分析的英文文本 |
| `fingerprint` | 可选 | 未登录用户限流识别用指纹 |
| `blacklist` | 可选 | 需要排除的域名，使用字符串数组传递，如 `["example.com","spam.com"]` |
| `preferredSites` | 可选 | 优先推荐的域名，使用字符串数组传递 |

> 模型、API Key 与 Base URL 均由服务器环境变量统一配置，无需在请求体中传递。

### 响应示例
```json
{
  "success": true,
  "data": {
    "keywords": [
      {
        "keyword": "Search Engine Optimization",
        "query": "What are the best SEO strategies for 2024?",
        "reason": "帮助读者了解最新 SEO 策略并提升站点流量。",
        "link": "https://example.com/best-seo-strategies",
        "title": "Best SEO Strategies for 2024",
        "alternatives": { "preferred": [], "regular": [] }
      }
    ],
    "usage": {
      "promptTokens": 123,
      "completionTokens": 45,
      "totalTokens": 168
    },
    "linkFetchError": null
  }
}
```

### Curl 调用示例
```bash
curl -X POST 'http://localhost:3000/api/external-links' \
  -H 'Content-Type: application/json' \
  -H 'x-token: your-issued-token' \
  -d '{
    "text": "Search engine optimization is crucial",
    "email": "user@example.com",
    "preferredSites": ["moz.com"],
    "blacklist": ["example.com"]
  }'
```

服务端会自动使用环境变量中的 `OPENAI_API_KEY`、`SERPER_API_KEY` 以及默认模型配置，无需再在请求体中传递相关参数。

## 余额充值
- 访问路径：`/checkout`
- 支持自定义充值金额（人民币），最低 0.01 起
- 未登录用户需要填写充值邮箱；已登录用户默认使用账户邮箱
- 提交后会弹出二维码弹窗，支持支付宝 / 微信扫码支付
- 付款完成后系统会自动刷新订单状态，充值成功后余额会立即写入 Redis
- 管理后台仍可查看、更新或删除该邮箱关联的访问密钥，后续可据此扣费或统计

## 开发与测试建议
- **类型检查**：`bun run typecheck`
- **代码质量**：`bun run lint`（或 `bun run lint:fix` 自动修复）
- **接口验证**：管理员后台登记授权邮箱后，使用 Curl 或 Postman 调用 `/api/external-links`，在 JSON 请求体中附带 `email`，并在请求头中附带 `x-token` 进行验证。记得覆盖以下场景：
  - 未携带或携带错误邮箱/Token => 返回 401 + `"未被授权使用 Elink"`
  - 携带合法邮箱 + 文本 => 返回 200 并生成关键词结果
- **集成测试建议**：重点覆盖以下场景
  1. 传入合法邮箱 + 文本，确认返回 200
  2. 缺少或错误邮箱或 Token 时返回 401

## 部署提示
- 构建命令：`bun run build`，运行命令：`bun run start`
- 部署到 Vercel/自建服务器均可，需确保环境变量配置完整（尤其是 `AUTH_SECRET`、各类 API 密钥、Redis 凭证）。
- Redis 为强制依赖，请在所有环境中配置有效的 `UPSTASH_REDIS_*` 凭证，否则应用将无法启动。
- 邮件登录依赖 SMTP，请根据实际场景配置 `EMAIL_SERVER` 或改造登录方式。

### 部署到 Cloudflare Pages
1. **安装依赖**：仓库已内置 `@cloudflare/next-on-pages` 与 `wrangler`，运行 `bun install` 会同步准备 Cloudflare 插件。
2. **构建命令**：在 Cloudflare Pages 控制台的项目设置中，将 Build command 设置为 `bun run cf:build`，Output directory 保持为 `.vercel/output/static`。
3. **环境变量**：在 Pages 的 `Settings → Environment Variables` 中补齐生产环境所需变量（见上表，尤其是 `AUTH_SECRET`、`UPSTASH_REDIS_*`、`NEXTAUTH_URL` 等）。
4. **Node 兼容性**：`wrangler.toml` 已开启 `nodejs_compat` 标志，用于支持项目中的 Node API。部署时无需额外配置。
5. **本地预览**：可运行 `bun run cf:preview` 使用 Cloudflare 模拟器验证构建。

> Cloudflare Workers 环境不支持直接建立 SMTP 连接，因此如果需要邮箱登录，请改用 Resend、Plunk 等基于 HTTP 的邮件服务并在环境变量中启用相应密钥。

---

更多关于 T3 Stack 的使用指南，可参考官方文档：<https://create.t3.gg/>。如在使用过程中发现问题，欢迎提交 Issue 或 PR。***
