# 设计工作室：独立应用验证

应用版本 0.1.0，要求 SDK >=0.0.4。业务源码在 apps/design-studio，独立静态 UI，通过公开 `@sitoo/sdk/ui` 调用平台，不导入 Desktop IPC、Pi、账户凭据或上游网络客户端。

## 使用流程

1. Desktop 登录账户，在设置中启用至少一个兼容平台文本模型，配置共享图像生成能力与作品目录。
2. 应用市场加载已构建的设计工作室开发包，核对文本推理和生图权限后安装。正式分发仍经签名市场；本版不自动上架到生产市场。
3. 打开应用，选择“海报与文化传播”或“商品与品牌传播”资源包。填写用途、受众、文字、风格与约束，选择平台文本模型和画幅。
4. 生成设计方案，查看构图、配色、假设与检查清单，修改最终提示词。方案模型和生图模型分别配置；文本推理可能计费。
5. 可填写 HTTPS 参考图链接，按方案生成图片。沿用 Desktop 三模式审批；等待期间卡片更新原任务，用户可继续浏览结果。生成成功后平台自动下载并保存作品，点击图片可下载副本。
6. 保存草稿后可重开；进行中的文本任务按同一 requestId 恢复查询，生图通过平台任务列表恢复。失败与未知结果保留诊断，不自动再收费，不作为成功作品。

资源选择或需求、画幅变化会清除当前方案，要求重新形成方案；不会更改已发起任务。方案检查清单供人工审阅，不代表自动审美验收。当前一个应用草稿、多个生图历史任务；不提供完整多项目管理。

## 独立构建与打包

```powershell
node apps/design-studio/build.mjs
node scripts/app-toolkit.mjs
node release/developer-kit/sitoo-app.mjs pack apps/design-studio release/apps/sitoo-design-0.1.0.spkg
node release/developer-kit/sitoo-app.mjs check release/apps/sitoo-design-0.1.0.spkg
```

源码构建使用 React、Base UI Button 与 assistant-ui 开源 ImageGeneration/surfaces 组件，保持品牌色、留白与阅读层级。工作区可复用已安装构建依赖；外部开发者安装开发工具包中的 SDK，并将 package.json 的 workspace 依赖改为实际本地 SDK 安装路径，再安装其声明的前端依赖。不要求其他应用使用同一前端框架。

应用 build 生成静态 payload 和契约配置；标准打包器只打包 payload，逐项校验摘要。资源包规则参考 poster-generator-skill 的层级/排版/检查方法，保留 MIT 声明，不执行原项目 Skill 或其重试流程；资源不获得平台权限。

## 双入口与当前边界

`@设计工作室 help` 或 `@设计工作室 帮助` 返回本地说明。显式 propose / generate 使用同一平台能力；propose 的 model 需使用 SDK 模型列表中的标识，generate 需提供最终提示词。当前对话不会自动组合完整行业方案流程，应用端的规则组装属于业务代码；自然语言编排仍是平台后续缺口。

随包资源的版本和内容摘要会核验，可在 UI 切换；没有独立在线资源包安装市场。本版参考图只接收可访问的 HTTPS 链接，不提供本机文件上传。没有印刷级 CMYK、出血、字体嵌入保证。真实付费通道与设计质量仍需用户在审批后验收，模拟测试只能证明桥、任务和存储行为。
