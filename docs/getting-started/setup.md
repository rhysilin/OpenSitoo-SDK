# 环境与工具

本页帮助你准备工具、检查目录，并判断是否需要安装 App SDK。创建与构建示例不要求平台源码，也不要求先登录客户端；运行应用则需要对应宿主和授权环境。

## 1. 检查 Node.js

当前验证环境为 Windows 和 Node.js 24；工具要求 Node.js 24 或更高版本。安装与 ZIP 获取见[开发工具下载](/downloads)。在 PowerShell 执行：

```powershell
# 在开始构建之前确认当前终端使用的版本，而不是仅检查电脑是否装过 Node。
node --version
npm --version
```

第一行应显示 v24.x.x 或更高版本，第二行应显示 npm 版本号。若提示无法识别命令，重新打开终端检查安装后的 PATH；多个 Node 安装并存时，使用 Get-Command node 查看当前执行文件位置。高于 24 的版本须按实际结果验证，不将环境要求等同于已完成逐版本兼容测试。

## 2. 选择并解压工具

先按[下载页](/downloads)核对 ZIP 的 SHA-256 并解压。以下路径是教程使用的示例路径，你可以更换根目录，但所有后续命令须一起修改。

| 开发目标 | 必需目录 | 主要文件 |
| --- | --- | --- |
| 静态应用 | C:/Sitoo/developer-kit | sitoo-app.mjs、sitoo-app-client.js、sdk/ |
| 共享应用/能力 | C:/Sitoo/capability-kit 与 C:/Sitoo/capability-packages | sitoo-project.mjs、sitoo-capability.mjs、能力 SDK、capability-packages.mjs |
| Node.js 契约或可信宿主集成 | developer-kit/sdk 及对应宿主工具 | package.json 中的公开入口与第三方依赖 |

每个 ZIP 自带顶层目录。正确路径是 C:/Sitoo/developer-kit/sitoo-app.mjs，重复嵌套成 developer-kit/developer-kit 会导致后续命令找不到文件。

```powershell
# 三个独立工具入口均应存在；只开发静态应用时可以只检查第一项。
Test-Path C:/Sitoo/developer-kit/sitoo-app.mjs
Test-Path C:/Sitoo/capability-kit/sitoo-project.mjs
Test-Path C:/Sitoo/capability-packages/capability-packages.mjs
```

对应行应返回 True。能力 CLI 已封装为独立 ESM 文件，可以直接由 Node.js 执行，不需要先在平台仓库运行 pnpm install。

## 3. 判断是否需要安装 SDK 目录包

静态应用创建工具会把页面客户端放进生成的项目；共享应用模板也带有相应公开客户端。跟随两个入门教程时先使用模板，不必为了运行 CLI 额外安装 @sitoo/sdk。

如果你的 Node.js 或构建项目需要按包名导入 App SDK，则在**自己的项目目录**安装工具包中的 SDK。当前没有本站提供的公共 npm 包下载地址；下面安装的是已经解压的本地目录，不是从公共包源获取 @sitoo/sdk。

```powershell
# 创建一个全新练习目录；若目录已存在，请换名，不覆盖已有工程。
New-Item -ItemType Directory -Path C:/Sitoo/sdk-example -ErrorAction Stop | Out-Null
Set-Location C:/Sitoo/sdk-example

# npm init 在当前项目生成 package.json。
npm init -y

# 安装本地 SDK 的独立副本；其第三方依赖仍可能需要访问 npm 包源。
npm install --install-links C:/Sitoo/developer-kit/sdk

# 列出的直接依赖应为 @sitoo/sdk@0.0.11。
npm ls --install-links @sitoo/sdk --depth=0
```

检查依赖时也保留 --install-links，与安装模式一致，避免本地目录副本被当作链接误报 invalid。--install-links 让本地包按独立依赖安装，而不是依赖个人工具目录的链接。SDK 的实际版本见其 package.json；版本组合见[支持范围](compatibility)。安装会获取 SDK 声明的第三方依赖，并受你当前 npm 配置、网络和包源缓存影响，不能把 ZIP 称为含全部 npm 依赖的离线安装包。

可以用下面的只读命令检查一个公开模块是否可导入。它不会打开宿主会话或调用业务：

```powershell
# 仅验证模块导入成功；输出 function，不代表应用已经获得任务桥和授权。
node --input-type=module -e "import { createCapabilityClient } from '@sitoo/sdk/capabilities'; console.log(typeof createCapabilityClient)"
```

模块入口、调用方和环境见[SDK 与 API 导航](/reference/)。应用页面 SDK 需要宿主提供的受限通信环境；在普通浏览器或 Node.js 中能导入函数，不代表能直接创建有效的平台会话。

## 4. 分开管理项目、发布物与运行数据

| 目录 | 放什么 | 是否适合提交或公开 |
| --- | --- | --- |
| 项目目录 | 契约、源码、界面和构建脚本 | 可提交，先排除敏感配置 |
| 构建输出目录 | 经检查的应用或能力发布物 | 按发布流程提供，不随意覆盖同版本 |
| 私有配置目录 | 入口令牌、签名私钥、宿主可信配置 | 不放入公开下载或源码仓库 |
| 运行数据目录 | 本地数据库、任务与诊断数据 | 不包含在应用源码包中；按宿主责任管理 |

安装和授权是独立步骤。运行前由环境维护者提供宿主或客户端、身份和权限；获取工具不会自动取得这些权限。共享流程见[入口授权](/publishing/authorization)，静态应用运行见[第一个静态应用](static-app)。

## 常见准备问题

| 现象 | 检查与处理 |
| --- | --- |
| Cannot find module 或工具路径不存在 | 对照工具根目录和 ZIP 顶层目录，检查是否重复嵌套或命令路径与解压位置不一致 |
| npm 安装报网络或 ENOTCACHED | 目录包仍有第三方依赖；检查当前包源/网络，离线缓存不齐时改用可访问包源或由维护者提供完整离线依赖，不忽略失败继续运行 |
| npm ls 看不到 SDK | 确认命令在自己的项目目录执行，安装命令成功；不要在工具目录误建项目 |
| 页面能打开但平台接口不可用 | 核对是否处于声明支持的宿主容器及已有授权，普通浏览器不会提供平台任务桥 |

## 下一步

根据开发目标进入[第一个静态应用](static-app)或[第一个共享应用](quickstart)。需要查命令参数时使用[CLI 参考](/reference/cli)，不使用未核实的参数推测操作。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
