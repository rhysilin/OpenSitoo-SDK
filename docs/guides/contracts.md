# 应用契约与命令

同一AppInvocationContract声明应用标识、版本、UI入口、帮助和能力数组。每个能力包含id/name/aliases、description、inputSchema、examples、permissions、requiresTask与requiresConfirmation。

AppCatalog注册RegisteredApp，ApplicationProvider实现业务；新应用不使用已弃用defineApp工具模板。界面调用与命令调用复用同一契约和参数schema。

命令使用appHelp、parseAppCommand及resolveAppInvocation处理。自然语言可以生成提案，授权和执行仍由宿主完成；模型不能批准自己的调用。字段与完整签名见[App SDK](/reference/sdk)。


## 从契约到一次调用

先完成[静态应用教程](/getting-started/static-app)。工具生成的 `sitoo-app.json`具有两层声明：manifest 决定应用身份、UI、SDK 范围与整体权限；invocation 决定可调用的能力、参数 schema 与帮助。应用标识和版本在两层中应一致。`bindings` 将能力 ID 映射到平台实现。

以生成模板为例，能力 ID 是 `echo`，参数为 `{"text":"你好"}`，绑定为 `text.echo`。页面执行 `client.invoke('echo', {text:'你好'})`，宿主校验 schema 后回显。`inputSchema.additionalProperties=false` 会拒绝未声明字段；增加模型、附件等参数时同步 schema，不能仅修改页面。

| 字段 | 开发者应如何填写 |
| --- | --- |
| id / name / aliases | id 是稳定机器标识；name 是展示名称；aliases 是可选命令别名数组 |
| description / examples | 描述实际用途；examples 是命令字符串，其参数必须符合 inputSchema |
| inputSchema | JSON Schema 参数约束，明确 required、类型、长度与额外字段策略 |
| permissions | 本能力所需权限；必须受 manifest 总权限约束 |
| requiresTask | 是否以任务形式执行；不能据此推断所有任务立即完成 |
| requiresConfirmation | 声明确认需求，批准权仍归可信宿主 |

`AppCatalog`、`ApplicationProvider` 与命令解析是可信宿主集成接口，不在静态页面创建；完整函数签名见[App SDK 参考](/reference/sdk)。应用作者先检查 `sitoo-app.mjs check` 的结果，再由宿主安装运行。字段不一致或 schema 错误应修复包后重新构建，不能通过放宽宿主校验绕过。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
