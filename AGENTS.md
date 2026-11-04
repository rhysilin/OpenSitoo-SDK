# 文档站维护规则

独立维护OpenSitoo正式开发者文档。仅加入正式正文、公开资源和构建必需元数据，不加入平台实现、用户数据或密钥。

接口必须对应真实实现，区分公开SDK、可信宿主及规划边界；变化同步指南、reference和support/versions。维护VitePress中文导航、品牌明暗主题与可用搜索。

使用Node24、npm锁文件，提交前执行npm ci、npm run docs:build及git diff --check。main由Cloudflare Git集成发布，保持README声明的命令和输出目录；构建成功不代替生产页面验证。旧URL和历史下载保持可访问。
