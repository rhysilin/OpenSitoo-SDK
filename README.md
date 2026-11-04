# OpenSitoo 开发者文档

正式开发者文档站，包含应用与共享能力开发指南、SDK/API参考、发布维护说明及工具下载。当前SDK0.0.11、能力工具0.39.0。

生产站点：https://opensitoo-sdk.pages.dev/

## 本地运行

需要Node.js24.11.1。执行 `npm ci`、`npm run docs:dev`；发布检查执行 `npm run docs:build`。

## Cloudflare Pages

生产分支main，构建命令 `npm run docs:build`，输出目录 `docs/.vitepress/dist`。构建先检查58页正文、197个接口导出及公开下载摘要，再生成正式站；本地通用构建产物同时保留在artifacts/site。

`deployment.json`记录实际构建提交，可用于核对部署。旧文档URL提供301跳转，历史下载包保留。维护源码同步时保留本仓库Git历史，不强推。此仓库仅包含文档、公开资源及必要构建元数据；不需要平台源码、密钥或运行数据库。
