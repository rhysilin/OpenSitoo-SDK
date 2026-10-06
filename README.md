# OpenSitoo 开发者文档

独立维护的开发者文档站，使用 VitePress。当前记录 App SDK 0.0.6 的真实能力、公开契约与开发发布流程。此仓库仅包含文档站，不包含 Desktop、SDK 实现或用户数据。

## 本地开发

使用 Node.js 22 或 24：

```sh
npm ci
npm run docs:dev
npm run docs:build
npm run docs:preview
```

构建输出为 `docs/.vitepress/dist`，支持静态 HTTPS 托管。

## Cloudflare Pages

通过 GitHub 集成部署 `rhysilin/OpenSitoo-SDK`：

| 设置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 根目录 | 仓库根目录 |
| 构建命令 | `npm run docs:build` |
| 输出目录 | `docs/.vitepress/dist` |
| 环境变量 | `NODE_VERSION=24` |

推送 main 自动发布生产站点，其他分支构建预览。无需数据库、账户服务或前端密钥。

## 维护规则

- API 与 SDK 契约正文必须与平台实际实现保持一致，明确公开 SDK、内部 IPC、私有桥与规划能力的边界。
- 修改 SDK 接口时，同步修改对应手册、浏览器参考、示例与 `docs/sdk-changelog.md`。
- 提交前运行 `npm ci` 和 `npm run docs:build`，检查导航与搜索。
- 不提交生成产物、市场签名私钥、用户凭据或本地配置。

初始文档来自 Desktop 提交 `ceb2619`。后续平台契约变更应同步到此仓库；排版、导航与托管配置可以独立维护。

