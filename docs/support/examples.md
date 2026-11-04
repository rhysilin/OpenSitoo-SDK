# 完整示例

| 示例 | 工具包位置 | 学习内容 |
| --- | --- | --- |
| 三个独立项目 | sitoo-project.mjs create生成的core/app-a/app-b | 两应用复用同一能力、页面/对话、兼容更新 |
| 多应用仓库 | monorepo-template | 独立路径、版本、全量/单应用构建 |
| 独立发布者 | product-reference | 不改Desktop的发布/更新流程 |
| 通用服务 | verify-persistent-references.mjs、verify-model-ledger.mjs、verify-image-services.mjs、verify-request-services.mjs | 可信Provider、原请求恢复与产物读取 |
| 静态应用 | developer-kit的create模板 | 包内应用页面 SDK、manifest与平台bindings |

示例中的本地开发信任、测试确认和无费用Provider不代表生产部署。私钥和测试数据库不随业务包发布。


## 选一个可以直接运行的入口

| 目标 | 取得方式与前置 | 成功判定 |
| --- | --- | --- |
| 第一个静态页面 | [完整静态教程](/getting-started/static-app)，下载 developer-kit，Node 24 | create/pack/check 成功；Desktop 安装后回显用户文字 |
| 两应用、四入口共享业务 | [共享流程脚本](/examples/shared-workflow.mjs)，下载 kit+包工具，按[完整教程](/getting-started/quickstart) init/verify/serve | 四入口 completed，原 ID 去重为同 taskId，签名页面真实回显 |
| 手动共享对话 | [对话完整脚本](/capabilities/conversation)，前项已 serve | tools/prepare/submit/get；原结果 HELLO，无规划模型费用 |
| 应用页面异步流程 | [页面流程模块](/examples/app-page-flows.js)，复制到 payload，按[初始化](/guides/browser-client)导入 | 模型/任务/存储/附件接口由真实宿主提供；模块不会自动生成 |
| 可信代理、编译与持久任务 | [可信宿主完整脚本](/examples/trusted-host-example.mjs)，Node 24、完整 kit、新数据目录 | completed/success、HELLO，deduplicated=true |
| 数据版本演练 | [迁移完整输入与命令](/publishing/migrations)，包工具与私有 root | prepare 不改值、commit 升版、rollback 增修订 |
| 健康与本地 CI | [测试诊断](/publishing/testing)与[多应用仓库](/publishing/monorepo) | 明确 passed/退出码，不以生成文件代替业务结果 |

## 运行可信宿主脚本

下载 trusted-host-example.mjs 到 C:/Sitoo，完整 capability-kit 解压到 C:/Sitoo/capability-kit；目录包含 service-host.mjs、worker.mjs、quickjs.wasm。输出目录必须不存在，不需要平台源码或 npm 安装。

```powershell
# 本地教学配置，无收费服务、无生产密钥；输出目录存在时选择新的目录。
node C:/Sitoo/trusted-host-example.mjs C:/Sitoo/capability-kit C:/dev/trusted-example-1
```

脚本真实检查 Guest 编译，注册精确无副作用声明、创建本地可信 session、先保存原请求再提交、查询原结果、验证重复请求去重，最后关闭任务协调器和撤销会话。它直接使用可信 Node 集成 API，不是有签名/生产身份的应用安装环境；应用作者的安装教程仍用前面的共享流程。

## 验证器与真实服务的区别

以下脚本在下载 kit 中，可以独立执行，内部创建临时目录和本地无费用 Provider，不接生产网关。阅读每份输出，出现非零退出码立即停止后续发布，不把夹具当成真实文本/生图质量证明。

```powershell
# 工作目录为完整 capability-kit，保留同版侧车和原始字节。
node verify-persistent-references.mjs
node verify-model-ledger.mjs
node verify-image-services.mjs
node verify-request-services.mjs
```

它们分别验证持久引用重绑、原请求占用及只查询恢复、图像服务原任务/产物、结构化文本/图片请求适配。真实模型、麦克风、计费和生产认证需要明确环境、凭据来源与费用授权另验。示例中的开发密钥只在私有 .local，不能作为自己的生产发布身份。


## 在固定 Desktop 上验证独立发布

需要维护者提供未打包 Desktop 0.0.31 及专用 development 账户目录配置；公开工具下载不包含 Electron 运行环境或生产自助接入 API。开发者负责构建/签名/发布；可信操作者负责预配信任与本账户发布/安装/授权目录；用户在客户端确认，不让应用选择他人目录。

下面直接使用下载 kit 内 product-reference/publisher.mjs。新项目目录必须不存在；三位演示发布者只在私有 keys 中保存测试密钥。

```powershell
# 第一次发布到新项目自有发布库，不涉及现有客户端库。
node C:/Sitoo/capability-kit/product-reference/publisher.mjs init C:/dev/product-example C:/Sitoo/capability-packages C:/Sitoo/capability-kit/capability-sdk.js
node C:/Sitoo/capability-kit/product-reference/publisher.mjs publish C:/dev/product-example 1.0.0 C:/dev/product-example/releases.sqlite
```

发布三份内容：alice/shared、bob/application、carol/application；两个应用分别为 bob.product/carol.product，依赖同版 alice。可信操作者查看项目 trust.json 并按自己的安全流程预置 development 目录；不使用其他业务库、不替换真实账户既有文件。没有已提供客户端和可信接入配置时，这一分支应停止在发布完成，不自行猜路径或修改生产信任。

客户端用户刷新共享应用市场，分别预览/安装 Bob 和 Carol 的精确完整计划；分别授予 application/conversation，然后在页面及对话调用规范化能力。预期两个入口取得同一业务规范化结果，但任务、身份与授权隔离。原 taskId/requestId/绑定保存，客户端不重建。

验证 1.0.0 后，操作者明确提供该测试账户的发布库路径，开发者把新 1.1.0 追加到该库（不是覆盖整个数据库）：

```powershell
# publisher-release.sqlite 是操作者授权的专用测试发布库，不能指向未知生产库。
node C:/Sitoo/capability-kit/product-reference/publisher.mjs publish C:/dev/product-example 1.1.0 C:/dev/client-test/publisher-release.sqlite
```

刷新后用户明确确认更新，复核并采用目标两入口授权；页面/对话结果都增加 V2，说明使用新实际共享业务。回退选择仍有效的旧精确闭包，重新核对授权，结果恢复旧业务。卸载只移除自己的根，业务数据/原任务保留；unknown/pin 阻止不安全切换，不能为验更新释放。

固定开发窗口另一种用途是消费已经启动的独立宿主：维护者提供 Electron 可执行文件和未打包 Desktop 应用目录后，使用 `--capability-development-url=http://127.0.0.1:实际端口` 与专用 `--user-data-dir` 启动，手工输入入口令牌。URL 只能是本机显式端口根地址、不能带凭据/query/hash。此参数在正式安装包中拒绝，不是普通产品登录替代；一般应用作者用[浏览器共享教程](/getting-started/quickstart)即可。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
