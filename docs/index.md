---
layout: home
hero:
  name: Sitoo App SDK
  text: 开发专业应用，接入统一平台能力
  tagline: 独立界面、对话调用、受控能力与可验证的发布流程。
  actions:
    - theme: brand
      text: 创建第一个应用
      link: /35-developer-kit-quickstart
    - theme: alt
      text: 浏览器 SDK
      link: /browser-sdk
features:
  - title: 独立开发
    details: 使用独立开发工具创建、检查和打包静态应用，无需修改 Desktop 源码。
  - title: 受控平台能力
    details: 平台负责账户、审批、生图和业务数据隔离。应用拥有自己的 UI/UX。
  - title: 独立分发
    details: 使用 spkg 和 TUF 签名市场安装、升级与回滚。
---

## 当前可用范围

SDK 0.0.3，浏览器协议 `sitoo-app-v1`，应用包格式 1。支持静态 HTML/CSS/JavaScript 界面、普通配置、项目/草稿 JSON 存储、随包资源、生图任务查询与平台能力绑定。工作区 SDK 尚未发布到公共 npm，开发者使用独立工具包中的 SDK。

文本模型推理、任意第三方后端、独立资源包市场和外部应用自然语言编排仍待实现。能力发现返回真实支持状态；不要将类型声明视为宿主已开放能力。

## 阅读顺序

1. [快速开始与发布](./35-developer-kit-quickstart.md)：创建项目、开发包安装、签名上架。
2. [浏览器 SDK](./browser-sdk.md)：能力发现、保存草稿、任务恢复与错误处理。
3. [标准与兼容性](./standards.md)：版本、权限、schema 和发布约束。
4. [SDK 手册](./33-app-sdk-developer-guide.md)与[接口参考](./34-api-reference.md)：区分公开应用接口、可信宿主和内部 IPC。

## 文档维护与部署

本文档站独立维护于 OpenSitoo-SDK 仓库，构建时由 Markdown 生成网站。平台契约更新需与 Desktop 仓库中的 SDK 手册同步。执行 `npm run docs:build`，将 `docs/.vitepress/dist` 部署到静态 HTTPS 站点。子路径部署在构建时指定 `SITOO_DOCS_BASE=/developers/`。本地预览使用 `npm run docs:preview`，地址为 `http://127.0.0.1:18682/`。网站无需登录或新增动态服务，不含市场私钥和用户凭据。

更新 SDK 公共契约必须同步更新手册、浏览器参考、CHANGELOG 与运行示例，并验证文档构建与链接。
