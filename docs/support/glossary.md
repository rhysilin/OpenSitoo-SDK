# 术语表

| 术语 | 含义 |
| --- | --- |
| 应用 | 带独立身份、界面/对话入口和权限的消费方 |
| 能力 | 有输入/输出契约、可独立版本化的业务实现 |
| 宿主 | 建立身份、安装、授权、执行、任务与平台服务的可信环境 |
| Provider | 由可信宿主绑定资源或服务的实现，不由应用加载密钥 |
| 发布物 | 构建后用于检查、签名和安装的不可变文件集合 |
| 精确绑定 | 包标识、版本与SHA256组成的执行引用 |
| requestId | 调用者在提交前保存的原请求标识，用于关联与去重 |
| taskId | 宿主任务标识，查询原任务与产物使用 |
| pin/租约 | 任务对依赖闭包的保留，阻止未完成任务依赖被回收 |
| unknown | 无法证明最终结果，不代表失败、未执行或未计费 |


## 容易混淆的词

| 术语 | 在本文档中的具体含义 | 动手入口 |
| --- | --- | --- |
| 应用页面 SDK | 页面中的 JavaScript 库，宿主赋予窄通道；不是 Chrome/Edge 软件 | [页面初始化](/guides/browser-client) |
| 静态应用 / .spkg | static-platform ZIP 应用与平台 bindings | [静态教程](/getting-started/static-app) |
| 共享应用发布物 | static-application-v1 的签名页面根与独立能力依赖 | [共享教程](/getting-started/quickstart) |
| Guest | QuickJS 中执行的受限异步业务函数，无 Node/任意网络权限 | [能力包](/capabilities/packages) |
| application / conversation | 同一应用两个消费入口，分别授权，业务可复用 | [入口授权](/publishing/authorization) |
| App SDK Agent | 应用独立、无工具的多轮文本会话 | [应用对话](/guides/agent) |
| 共享能力对话 | 从已授权工具生成/校验提案后明确提交任务 | [共享对话](/capabilities/conversation) |
| schema | 输入/输出数据结构约束，不等于权限或上游执行保证 | [请求协议](/capabilities/protocol) |
| plan / binding | plan 为完整依赖闭包，binding 为单能力精确版本摘要 | [依赖](/capabilities/packages) |
| attestation / trust | 发布者署名与操作者预置信任，二者共同核验来源 | [签名](/publishing/signatures) |
| grants | 可信操作者明确授予的权限，不由包声明自行获得 | [权限](/guides/permissions) |
| revision / generation | revision 为配置/数据/任务修订，generation 为安装根变更代数；都不是 SemVer | [存储](/guides/storage)、[更新](/publishing/lifecycle) |
| prepared / committed | 事务仅准备计划 / 原子提交成功；原收据不保证当前根仍相同 | [安装](/publishing/installations) |
| planSha256 / reviewSha256 | 原完整计划摘要 / 更新审查摘要；变更后旧页面或确认失效 | [HTTP](/reference/http)、[更新](/publishing/lifecycle) |
| referenceId | 原归属受控资源/Provider 的 UUID，不是密钥、路径或跨账户凭证 | [服务](/capabilities/services) |
| reconcile / query-only | 核对原上游结果，不执行第二次副作用、不重新收费 | [恢复](/guides/tasks) |
| dispose / stopWatching | 清理页面客户端或订阅，不取消上游任务 | [图片](/guides/images) |
| 夹具 / 真实服务 | 可控无费用实现 / 实际上游业务；各自有独立验证范围 | [示例](/support/examples) |

术语与各接口实际枚举应一起阅读，不能把通用状态表套到每个服务。遇到名称不明时先从[接口导航](/reference/)选择调用层，再看对应指南。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
