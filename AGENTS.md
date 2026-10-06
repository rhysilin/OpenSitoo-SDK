# 文档站维护规则

此仓库独立维护 OpenSitoo 开发者文档站。不要加入 Desktop 实现、SDK 源码、用户数据或密钥。

- 所有接口描述必须对应真实实现。明确区分公开 SDK、内部 IPC、私有桥、第三方服务和规划能力。
- SDK 公共契约更新时，同批同步手册、浏览器参考、接口参考、示例和 `docs/sdk-changelog.md`，与平台仓库核对版本。
- 保持 VitePress 标准目录与中文导航，保留品牌配色与中文搜索。
- 使用 npm 锁文件；交付前运行 `npm ci`、`npm run docs:build` 和 `git diff --check`。
- main 分支由 Cloudflare Pages 的 GitHub 集成自动构建部署。修改构建命令或输出目录时同步更新 README 和 Cloudflare 设置。
- 构建成功只能证明静态站点生成成功，接口能力仍需要平台运行测试证明。
