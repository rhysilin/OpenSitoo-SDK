<script setup>
// 部署到子路径时，下载链接也跟随站点根路径。
import { withBase } from 'vitepress';
const tools = [{"title":"App 开发工具包","version":"0.0.11","directory":"developer-kit","file":"opensitoo-developer-kit-sdk-0.0.11.zip","size":"0.84 MB","sha256":"58378156ffef72f7dee346d32ef408003e3c57c57a92875b31f2247e6175b8c8","description":"创建、打包和检查静态应用，包含 App SDK 目录包与应用页面 SDK。","bytes":884928},{"title":"共享能力开发工具包","version":"0.39.0","directory":"capability-kit","file":"opensitoo-capability-kit-0.39.0.zip","size":"0.64 MB","sha256":"c231a1205d5ee2cff9efbae3feb51ace1b2753b80db1eefc9b86fa831ae206c8","description":"创建独立应用与共享能力项目，包含能力 SDK、开发宿主、协议和示例模板。","bytes":672973},{"title":"能力包管理工具","version":"0.10.0","directory":"capability-packages","file":"opensitoo-capability-packages-0.10.0.zip","size":"0.13 MB","sha256":"43b1ab727ec35b77ab8712b013c16261c5417093f186b8f0176131b52e042d88","description":"检查、签名、发布、安装及更新能力包；由开发者与可信宿主操作者按权限使用。","bytes":132372},{"title":"本地CI与发布工具","version":"0.3.0","directory":"ecosystem-tools","file":"opensitoo-ecosystem-tools-0.3.0.zip","sha256":"3c69bfd5fe35ab26b754ccc461cb6365c4b3353d0dde0f88b9533488b3b23783","size":"0.08 MB","description":"冻结依赖安装、测试、构建、校验及公开HTTP测试提交；不包含账号或私钥。","bytes":86438},{"title":"数据保护运维工具","directory":"ecosystem-data","file":"opensitoo-data-tools-1.1.0.zip","bytes":13153,"sha256":"c39de6ae92b98d13c6adeaac516908b9160b553b0a7cfaf8b84359dc786c176b","version":"1.1.0","files":[{"path":"ecosystem-data.mjs","sha256":"cd52aac4d0243e6c642d3b8b17670342d1f1cd330785b4da7161098677703842"},{"path":"README.md","sha256":"2fa792ba8491cce514a77b79e3d2af57ec54adb18cef8e182596e45d73df94bc"},{"path":"manifest.json","sha256":"bcbe4b97214829295ec91bab28437a7771af7decb3cb1d4b4862156a831d58b2"}],"size":"0.01 MB","description":"识别中心schema8，支持可信运维备份恢复；旧版1.0.0下载保留。"},{"title":"浏览器应用宿主","directory":"browser-host","file":"opensitoo-browser-host-0.1.0.zip","bytes":691632,"sha256":"8d822bb15e230ab3efad92e028ddfd7f3661e0691000f202fe144c211f232101","version":"0.1.0","files":[{"path":"browser-worker.mjs","sha256":"7d21697aae1371e98af8633d823fad11466fb8028eca2c11ed765f3a3f6c7fc2"},{"path":"browser-server.mjs","sha256":"b962417f33e89d56df806b487dbf16e15991d46496db36121be283bf324a728d"},{"path":"browser-client.mjs","sha256":"077c375a3094441e6e66653c5e56321fdef30d9d3be82c3fa76ab45447eebe9e"},{"path":"browser.html","sha256":"eb37ef435181fae462a5b18f53d0a52e20ad7e5edf3c83fa94ab731afe3f981a"},{"path":"worker.mjs","sha256":"9c21d9fd6ce2134eedd555554b1d8ba47e4f016677e0f27fd8e746e04a66a128"},{"path":"quickjs.wasm","sha256":"d4c9375f2b1ca4dc95f72c8aa2982a7a9951ac8011490d79c6582df732b4bbd9"},{"path":"sitoo-job.exe","sha256":"3aa683e887f2f840429a5360e52e2c75f1f53ef03f5f916e60127d422784c05c"},{"path":"isolation-manifest.json","sha256":"9cb8525969bad258c26879b58dcb0e818cbb77d7da94c01cc50d2d7df24dcc49"},{"path":"QUICKJS-LICENSE","sha256":"f7735da3b2531ddf451937117343cfadb853fd8054b499e7a70695dc57ffd184"},{"path":"licenses/jose.txt","sha256":"8078b0829d6c3e9ecde2f003e1966e4cad3efc6e7a640efbab0313cc166b1af1"},{"path":"licenses/ajv.txt","sha256":"a05350a88e318e4f5f2c2a1ff1e2e88daa4dd38e6e78b71cccae422bdc762cc3"},{"path":"licenses/fast-deep-equal.txt","sha256":"7bf9b2de73a6b356761c948d0e9eeb4be6c1270bd04c79cd489c1e400ffdfc1a"},{"path":"licenses/fast-uri.txt","sha256":"b010b0dfdfdb23d7396e03b82cd4621fc9bb8f95d6b0aea70b9c24e12074c786"},{"path":"licenses/json-schema-traverse.txt","sha256":"7bf9b2de73a6b356761c948d0e9eeb4be6c1270bd04c79cd489c1e400ffdfc1a"},{"path":"licenses/semver.txt","sha256":"4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b"},{"path":"README.md","sha256":"d930143e1cd882c3faf6153b438bffa3c1093b037866114b8986a49686abde2b"},{"path":"admin-web/index.html","sha256":"1f598845e383e4e60f4c3caa47d0dc41f284c248e8a0abfe5de3c18daaee8a93"},{"path":"admin-web/app.js","sha256":"5488902a7093ae304072cd780bbcd3ed51581d4b1a87ef50520d4e7659775ef9"},{"path":"admin-web/app.css","sha256":"146b411072a7927b44de0f40cc96e1d23f034cff216c111f889cf13e81230226"},{"path":"manifest.json","sha256":"4461d1d2e5082ea1aa2a4ebd9563c84a91a2dee13848273a3d3643b9339a60b6"}],"size":"0.66 MB","description":"Windows x64/Node24、本机HTTPS工程验证；签名静态页面与受限QuickJS。无需Desktop源码，不含秘密配置。"}];
</script>

# 开发工具下载

选择与你的应用开发方式对应的工具包。以下是本站提供的完整 ZIP 下载，解压后即可按指南使用；不需要取得 Desktop 源码。

<div class="tool-downloads">
  <article v-for="tool in tools" :key="tool.file" class="tool-download-card">
    <h2>{{ tool.title }}</h2>
    <p class="download-version">版本 {{ tool.version }} · ZIP · {{ tool.size }}</p>
    <p>{{ tool.description }}</p>
    <a class="download-button" :href="withBase('/downloads/' + tool.file)" download>下载 {{ tool.title }}</a>
    <details><summary>查看 SHA-256 校验值</summary><code>{{ tool.sha256 }}</code></details>
  </article>
</div>

静态应用从 App 开发工具包开始；共享应用需要同时下载共享能力开发工具包和能力包管理工具。App 工具包的版本号对应其中 App SDK 版本，当前适配 Desktop 0.0.39。详细兼容范围见[版本与支持范围](/getting-started/compatibility)。

## 运行环境

需要 Node.js 24 或更新版本。可以从 [Node.js 官方下载页](https://nodejs.org/en/download)获取运行环境；安装后在终端检查：

```powershell
# 检查当前终端能找到 Node.js 和 npm；Node.js 应为 24 或更高版本。
node --version
npm --version
```

当前工具验证环境为 Windows 与 Node.js 24。工具包不包含 Desktop 安装程序、账号、令牌、私钥或已授权生产环境；在 Desktop 中运行应用需要已安装客户端和对应账户。其他操作系统的兼容性见支持范围。

## 解压与目录

将 ZIP 解压至同一工具根目录，例如 C:/Sitoo。每个 ZIP 已包含一个顶层目录，解压后应得到：

```text
C:/Sitoo/
  developer-kit/         # 静态应用工具与 sdk/
  capability-kit/        # 共享能力 SDK、项目模板与开发宿主
  capability-packages/   # 包检查、签名及生命周期 CLI
  ecosystem-tools/       # 项目发布与运维 CLI
```

不要重复嵌套同名目录。使用前可核对[下载文件校验清单](/downloads/SHA256SUMS.txt)：

```powershell
# 在下载目录执行；文件名须与本页选择的 ZIP 一致。
Get-FileHash ./opensitoo-capability-kit-0.39.0.zip -Algorithm SHA256
```

将输出与本页公布的对应值比较；一致表示文件与本站发布内容相同。不要把摘要一致当作包内应用获得安装授权。

## 解压后检查文件

四个 ZIP 都包含顶层目录。以 Windows PowerShell 为例，先进入实际下载目录，再解压到你的工具根目录：

```powershell
# 创建工具根目录；已经存在时保留其中内容。
New-Item -ItemType Directory -Path C:/Sitoo -Force | Out-Null

# 文件名对应本页下载按钮；目标目录首次解压，不覆盖旧版本文件。
Expand-Archive ./opensitoo-developer-kit-sdk-0.0.11.zip C:/Sitoo
Expand-Archive ./opensitoo-capability-kit-0.39.0.zip C:/Sitoo
Expand-Archive ./opensitoo-capability-packages-0.10.0.zip C:/Sitoo
Expand-Archive ./opensitoo-ecosystem-tools-0.3.0.zip C:/Sitoo

# 对应行均应返回 True；只下载静态应用工具时仅需第一行。
Test-Path C:/Sitoo/developer-kit/sitoo-app.mjs
Test-Path C:/Sitoo/capability-kit/sitoo-project.mjs
Test-Path C:/Sitoo/capability-packages/capability-packages.mjs
Test-Path C:/Sitoo/ecosystem-tools/sitoo-publish.mjs
```

如果同名目录已有旧工具，解压到另一个根目录，并在后续命令中替换路径。不要混合版本覆盖旧目录；摘要不一致时重新下载核对，未核对前不要执行文件。

CLI 的独立脚本可以直接用 Node.js 运行。App SDK 目录包还声明了第三方 npm 依赖，在新项目中安装它可能访问包源；这与直接运行已封装 CLI 或模板中的页面 SDK 不同。详见[环境与工具](/getting-started/setup)。

## 工具包没有提供的材料

| 材料 | 用途与取得方式 |
| --- | --- |
| Desktop 客户端和测试账户 | 在对应客户端中运行应用；由目标环境维护者提供，本站当前没有可核实的公开安装包地址 |
| 宿主地址与应用入口令牌 | 在可信开发宿主调用已授权能力；由宿主操作者为指定应用和入口提供，开发工具不会自动签发 |
| 发布者私钥与可信公钥配置 | 签名发布物和建立安装信任；由对应发布者/可信操作者管理，不包含在 ZIP 中 |
| 模型配置与计费条件 | 仅调用相应文本/图片服务时需要；由宿主配置，应用不接收平台密钥 |

没有这些材料仍可创建、构建和检查示例；需要实际运行的步骤须先具备教程所列前置条件。不要为学习无费用回显示例启用收费模型。

## 下载后从哪里开始

- [创建第一个静态应用](/getting-started/static-app)：使用 developer-kit。
- [创建第一个共享应用](/getting-started/quickstart)：使用 capability-kit 与 capability-packages。
- [安装 App SDK 与准备环境](/getting-started/setup)：按目录包方式安装 SDK。
- [命令行工具参考](/reference/cli)：查看各工具的参数和适用权限。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)

测试发布工具的账号、项目与限域凭据由测试环境维护者提供，原命名空间只读凭据不能提交。操作流程见[项目与测试发布](/center/publishing)。

旧[共享工具包0.35.0](/downloads/opensitoo-capability-kit-0.35.0.zip)保留原下载字节；它的已安装宿主仅支持development。测试目录接入使用0.36.0。

[本地冻结CI、诊断与反馈教程](/center/ci-support)。旧[测试发布工具0.1.0](/downloads/opensitoo-ecosystem-tools-0.1.0.zip)保留原字节；使用CI请选择0.2.0。


发布工具0.3.0支持显式production提交与受信运维会话密钥操作，详见[生产发布指南](/center/production-publishing)。[旧版0.2.0](/downloads/opensitoo-ecosystem-tools-0.2.0.zip)继续保留，缺省test行为兼容，不能使用新运维命令。

共享工具包0.39.0增加Windows x64受限进程入口，详见[宿主与资源预算](/capabilities/host)。原[0.36.0工具包](/downloads/opensitoo-capability-kit-0.36.0.zip)保留，旧签名测试教程仍可按原版本运行。新工具不含账户或私钥，不开放生产业务执行。


## 数据保护运维工具

此工具面向可信宿主操作者；普通应用和Guest不能获得其文件权限。使用步骤、预览确认、独立删除登记及失败处理见[数据备份、恢复、导出与删除](/center/data-recovery)。旧开发工具下载保持可用。


浏览器应用运行环境单独使用[浏览器宿主指南](/center/browser-host)。当前只支持回环HTTPS验证，不是公网部署完成声明。
