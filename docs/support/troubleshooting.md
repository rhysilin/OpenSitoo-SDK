# 故障排查

| 现象/错误 | 检查与处理 |
| --- | --- |
| FORBIDDEN | 登录账户、入口授权、精确包绑定、资源归属；不要伪造身份 |
| REQUEST_CONFLICT | 原requestId是否用了新参数或不同包摘要；查询原任务 |
| RESULT_UNKNOWN/unknown | 保留原关联，可信宿主只查询原上游；不要自动新ID重试 |
| DISPOSED/UNAVAILABLE | 页面客户端是否已dispose，功能是否由宿主开放 |
| REVISION_CONFLICT | 重新读取配置或任务修订，提示用户处理冲突 |
| APP_TASKS_ACTIVE | 原任务是否仍在运行或需要核对；保留原记录和pin |
| 摘要/签名不匹配 | 获取原始发布物，检查Git换行、文件修改及信任有效期 |
| 模型列表为空 | 平台设置启用模型、应用权限；不在应用写入密钥 |
| 输出截断或schema失败 | 展示未完成，用户调整后明确新请求；不拼接无效JSON |

先确认使用的是静态App SDK还是能力SDK；它们的任务返回形态和确认规则不同。完整错误集合见相应接口类型和协议。


## 按层定位

1. 确认包格式和运行入口：`.spkg` 静态 App SDK、签名共享能力 SDK、本机 HTTP、可信 Node 管理工具不能混用。
2. 核对[支持版本](/getting-started/compatibility)与宿主实际 getCapabilities；下载目录和侧车须同版。
3. 先看传输状态（是否连接、HTTP 401/403/503），再判断 ok/error，最后看原任务 status/result；HTTP 200 不说明模型成功。
4. 保存安全 requestId/taskId/binding/版本/错误码，查询原请求；不把超时解释为未执行，不删除数据库恢复。
5. 仅在确定明确失败、用户理解费用后主动新请求。恢复动作不能隐式新 UUID。

| 现象 | 怎样确认 | 安全下一步 |
| --- | --- | --- |
| 普通浏览器页面没有 SDK 功能 | 缺少平台页面通道，platform.getCapabilities 失败 | 在 Desktop 安装运行静态包，或采用正确共享容器；[初始化](/guides/browser-client) |
| 新签名页面读不到 | application 入口 token、完整安装、active 授权、签名/有效期 | 操作者 load/read 核对，不在包内放凭据；[授权](/publishing/authorization) |
| 对话 plan 503 | plain serve 未启用规划器，或显式规划器不可用 | 手动 prepare；不要自动重复计费规划；[共享对话](/capabilities/conversation) |
| 规划夹具报 INVALID_INPUT | 固定语法或提案字段不符当前工具 schema | 用 tools 查看声明，手动合法参数 prepare；夹具不支持任意语言 |
| 旧页面更新后拒绝 | pin/完整计划/授权修订变化 | 操作者采用目标授权并重启，用户打开新页；原任务仍查询 |
| 健康 ok=true 但命令失败 | value.passed=false、mismatch/failed/unresolved | 查 checks，停止发布，保留原关联；[健康流程](/publishing/testing) |
| prepare 成功但未安装 | 仅 prepared 收据 | status 查询，由操作者明确 commit/abort；[安装](/publishing/installations) |
| 更新 CONFLICT | 根代数、reviewSha256、活动租约或原请求输入变化 | 先查原 status 与 lease，不强制 release；[更新](/publishing/lifecycle) |
| 数据 rollback 冲突 | after 后有新写入/迁移 | 保留新数据，明确合并/补偿，不恢复覆盖旧备份 |
| STORAGE_FAILED / UNAVAILABLE | 存储空间、写锁、关闭、损坏或不匹配 schema | 保留本地编辑/原请求；可信操作者核对空间和原库，不自动重建 |
| 只读旧库打不开 | readOnly 不迁移 schema 1/2 | 维护者离线备份后按可写升级流程处理，不改 user_version |
| 工具产物目录已存在 | 构建/签名工具拒绝覆盖 | 选择新输出/新版本；不要删除未确认产物 |

## 可提供的诊断资料

向维护者提供组件版本、系统/Node 版本、包 ID/版本/摘要、入口种类、复现步骤、命令退出码、HTTP 状态、安全错误码、原 requestId/taskId 与时间。不要附 token、私钥、账号密码、完整 host.json、用户输入/附件或数据库。任务输出可能含业务数据，先脱敏；SDK 的 appErrorDetails 可生成安全错误字段。

暂停新请求后由可信操作者查询原 task/reconcile/status；消费页面不接触安装库或上游秘密。没有可证明结果时明确标 unknown，不拿再次生成探测服务是否恢复。分层契约见[HTTP](/reference/http)、[页面 SDK](/reference/ui)、[可信任务](/reference/tasks)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
