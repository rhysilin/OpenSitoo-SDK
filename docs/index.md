---
layout: home
hero:
  name: OpenSitoo
  text: 开发应用，共享能力
  tagline: 为 OpenSitoo 开发应用界面，调用平台服务，或让多个应用复用同一业务能力。
  image:
    src: /opensitoo-logo-s.webp
    alt: OpenSitoo
  actions:
    - theme: brand
      text: 开始开发
      link: /getting-started/overview
    - theme: alt
      text: 查阅 SDK 与 API
      link: /reference/
    - theme: alt
      text: 下载开发工具
      link: /downloads
features:
  - title: 开发应用界面
    details: 用 HTML、CSS 和 JavaScript 创建静态应用，通过应用页面 SDK 调用已授权的平台服务。
    link: /getting-started/static-app
  - title: 一个实现，多个入口
    details: 独立界面与授权对话消费同一业务能力，保留原任务与结果。
    link: /capabilities/overview
  - title: 精确接口参考
    details: 按应用客户端、开发协议和可信宿主区分SDK、参数与返回类型。
    link: /reference/
  - title: 可维护的发布
    details: 独立版本、签名、安装事务与兼容更新，管理多个应用。
    link: /publishing/monorepo
---

## 你可以开发什么

如果你想做一个有独立界面的工具，例如文案编辑器或图片工作台，可以从**静态应用**开始。页面运行在 OpenSitoo 客户端提供的隔离容器中，通过应用页面 SDK 使用已开放且已授权的文本、图片、配置和数据接口。

如果同一段业务逻辑需要被多个应用，或应用页面与对话入口共同使用，可以开发**共享能力**。例如，两个编辑工具都调用同一个文本标准化能力；能力有自己的输入、输出和版本，调用的任务与结果由宿主管理。

[先了解应用、能力和宿主](/getting-started/overview)，再选择下面的路径。本文档面向应用开发者和可信宿主集成者；已开放能力及环境限制见[版本与支持范围](/getting-started/compatibility)。

## 选择开始路径

| 你的目标 | 从哪里开始 | 所需工具 |
| --- | --- | --- |
| 开发 HTML/CSS/JavaScript 应用界面 | [第一个静态应用](/getting-started/static-app) | App 开发工具包 |
| 两个应用复用一项业务能力 | [第一个共享应用](/getting-started/quickstart) | 共享能力开发工具包、能力包管理工具 |
| 集成可信宿主或查找精确契约 | [SDK 与 API 导航](/reference/) | 按接口区分应用端与可信宿主端 |

## 先准备工具和运行环境

打开[开发工具下载](/downloads)获取 ZIP、版本与校验值，再按[环境与工具](/getting-started/setup)准备 Node.js。构建应用本身不要求取得 Desktop 源码。

运行应用还需要对应宿主和授权环境。应用页面 SDK 由宿主接入，普通浏览器打开 HTML 不会自动获得平台能力。工具包不包含客户端安装程序、账户或令牌；接入条件请先查看[支持范围](/getting-started/compatibility)。

[查阅接口参考](/reference/) · [查看完整示例入口](/support/examples) · [遇到问题](/support/troubleshooting)
