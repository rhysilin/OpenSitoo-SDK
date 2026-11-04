<script setup>
// 部署到子路径时，下载链接也跟随站点根路径。
import { withBase } from 'vitepress';
const tools = [{"title":"App 开发工具包","version":"0.0.11","directory":"developer-kit","file":"opensitoo-developer-kit-sdk-0.0.11.zip","size":"0.84 MB","sha256":"58378156ffef72f7dee346d32ef408003e3c57c57a92875b31f2247e6175b8c8","description":"创建、打包和检查静态应用，包含 App SDK 目录包与应用页面 SDK。"},{"title":"共享能力开发工具包","version":"0.39.0","directory":"capability-kit","file":"opensitoo-capability-kit-0.39.0.zip","size":"0.64 MB","sha256":"c231a1205d5ee2cff9efbae3feb51ace1b2753b80db1eefc9b86fa831ae206c8","description":"创建独立应用与共享能力项目，包含能力 SDK、开发宿主、协议和示例模板。"},{"title":"能力包管理工具","version":"0.10.0","directory":"capability-packages","file":"opensitoo-capability-packages-0.10.0.zip","size":"0.13 MB","sha256":"43b1ab727ec35b77ab8712b013c16261c5417093f186b8f0176131b52e042d88","description":"检查、签名、发布、安装及更新能力包；由开发者与可信宿主操作者按权限使用。"},{"title":"本地CI与发布工具","version":"0.3.0","directory":"ecosystem-tools","file":"opensitoo-ecosystem-tools-0.3.0.zip","sha256":"3c69bfd5fe35ab26b754ccc461cb6365c4b3353d0dde0f88b9533488b3b23783","size":"0.08 MB","description":"冻结依赖安装、测试、构建、校验及公开HTTP测试提交；不包含账号或私钥。"}];
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

静态应用从 App 开发工具包开始；共享应用需要同时下载共享能力开发工具包和能力包管理工具。App 工具包的版本号对应其中 App SDK 版本，当前适配 Desktop 0.0.37。详细兼容范围见[版本与支持范围](/getting-started/compatibility)。

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
