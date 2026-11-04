# 安装事务

## 范围与边界

0.9.0 支持[独立应用发布物](/capabilities/artifacts)与完整能力依赖同事务安装。应用必须是唯一顶层根，applicationId 与可信根一致；应用不能作为依赖，更新不能剥掉应用发布物。旧能力根保持兼容，安装 schema 3 不变；页面不执行、不自动授权。

安装器消费离线发布库中当前可信的完整精确依赖闭包。准备只持久化计划，提交在一个 SQLite 事务内同时写入代码缓存、安装根、依赖引用和事务状态；失败不暴露部分安装。不执行安装脚本、不注册 Broker、不授予声明权限、不读写用户数据或凭据。静态 `.spkg` 应用仍使用独立的兼容安装路径，见[静态打包](/publishing/static-packages)。

安装器的准备检查为内容摘要、署名、环境、声明/schema、依赖闭包与精确绑定校验，不调用 Runtime。当前独立已安装宿主在开放执行服务前另行进行真实编译，见运行门禁；可显式执行[业务健康检查](/publishing/testing)，它不自动批准安装；生产完整安装环境须另行验收。

缓存共享的是代码。安装根的身份来自可信宿主配置，不接受应用自行选择任意身份；Desktop 使用已登录账户的安装身份；独立开发宿主使用操作者配置的本机身份，不提供生产账号认证。共享缓存中没有配置、会话或应用数据。本类和 CLI 为管理员辅助入口，不能直接暴露给 Guest/浏览器；`inventory` 是整库管理统计。


## 公开类型与构造

`new CapabilityInstallationStore(path, root)`；数据库父目录须已存在。`root: CapabilityInstallationRoot` 精确四字段：

| 字段          | 说明                                                     |
| ------------- | -------------------------------------------------------- |
| tenantId      | 可信租户标识                                             |
| accountId     | 可信账户标识                                             |
| applicationId | 安装消费者标识；无 UI 的能力消费根也可使用宿主分配的标识 |
| environment   | development / test / production                          |

前三项以及 requestId 均为 1–128 字符，首字符为 ASCII 字母/数字，其余仅字母、数字、`.`、`_`、`/`、`-`。根身份使用四项 JSON 数组组合，不拼接路径；构造时快照，之后修改原对象不会切换根。applicationId 不等于 packageId；依赖仍可来自不同发布者。

`CapabilityReleaseReference = {packageId,version,sha256,environment}`，沿用精确发布读取规则。`CapabilityInstallationTransaction = {requestId,status,plan}`，status 为 prepared / committed / aborted，plan 为现有 CapabilityDependencyPlan。返回对象深冻结；序列化结果仅为记录，不是可信包、权限或执行授权。

`INSTALLATION_LIMITS = {roots:128,packages:128,transactions:512}`；均为整库上限，包括不同身份。事务记录不自动删除，aborted 也计入；引用最多为 128 根 × 每根 128 包。输入快照沿用协议 64 KiB 等预算，单计划能力数和包大小仍受包协议限制。达到配额后查询、已有请求重查和已提交请求幂等返回仍可用，清理/保留策略由后续生命周期门禁设计。

数据库当前 schema 3（兼容迁移 schema 1/2），application_id `0x5343494e`；只初始化空库或打开匹配版本/标识，拒绝外来和未知版本库。构造失败只抛固定 `Installation store unavailable.`，不暴露路径、底层 SQL 或输入。


## 方法

所有下列方法同步返回 `ProtocolValidation<T>`，`close` 除外。

| 方法                                                         | 行为与返回                                                                                                                                                                                                              |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prepare(requestId, roots, references, releases, trust, now?) | roots 为现有 PackageRequirement[]；references 为完整 CapabilityReleaseReference[]；读取并重新验签所有发布，重新解析，拒绝多余、重复、遗漏或非匹配精确闭包。持久化 prepared 事务；返回 CapabilityInstallationTransaction |
| commit(requestId, releases, trust, now?)                     | 对 prepared 请求重新获取当前可信发布、校验原计划，原子提交代码、根、引用与 committed 状态；返回 CapabilityInstallationTransaction                                                                                       |
| status(requestId)                                            | 只查询当前根的原事务；不验签也不执行                                                                                                                                                                                    |
| pending()                                                    | 返回当前根的 prepared 事务数组，按 requestId 排序；不替其他根恢复                                                                                                                                                       |
| abort(requestId)                                             | prepared → aborted；重复 abort 幂等；committed 不可放弃；不删除任何已安装内容                                                                                                                                           |
| load(trust, now?)                                            | 读取当前已安装根及代码，重新验证缓存内容、当前公钥信任/有效期/撤销、引用和整个依赖计划；返回 `{plan,packages:TrustedCapabilityPackage[]}`。不需要发布库在线，不自动注册或执行                                           |
| inventory()                                                  | 管理员整库 `{packages,roots,references,transactions}` 数量；不输出其他根身份                                                                                                                                            |
| close()                                                      | 幂等关闭；之后操作 UNAVAILABLE                                                                                                                                                                                          |

releases 是 CapabilityReleaseStore，trust 是 CapabilityPackageTrust；now 默认 Date.now()，沿用可信时钟校验。prepare 与 commit 都消费当前信任，不继承 unsigned 计划的授权。load 每次复核当前信任，缓存不绕过撤销/过期；其后执行仍需 Broker 会话和权限。已提交请求的重复 commit 返回原收据，不重新验签或重新安装；该收据不能作为执行许可。

同根同 requestId 的相同计划幂等，改变计划为 CONFLICT；references 排序不影响身份，计划 roots 的数组顺序仍保留。aborted 不可再提交，重试新安装须新 requestId。原 prepare 方法只允许首次安装，已安装根的新初装请求和竞争提交均拒绝替换；更新使用独立 prepareUpdate。多个不同根可复用同环境/packageId/version/sha256 的内容；同环境/packageId/version 不得换摘要。不同根的精确多版本运行和持久租约已提供，0.5.0 增加独立更新事务、卸载与显式回收，见[生命周期手册](/publishing/lifecycle)；active 租约存在时拒绝提交，不支持运行中热切换。


## 中断与存储失败

1. prepare 成功只产生可查询的原请求记录，没有可运行安装根。
2. 进程关闭或突然退出后重新打开库，使用 pending/status 查询；构造不会自动提交、重试或放弃其他进程的请求。
3. 操作者明确选择 commit 或 abort。恢复 commit 重新验证当前来源、有效期、环境、完整依赖，不复用过期授权。
4. commit 使用 BEGIN IMMEDIATE，代码缓存、根、引用及 committed 记录在同一文件事务提交；失败回滚。多个句柄竞争同根时只有首个提交能生效。
5. 收到 UNAVAILABLE 或丢失提交响应时先查询原 requestId；错误不保证提交一定没有落盘，不自动换 ID 重试。

使用 DELETE rollback journal、FULL synchronous、100ms busy timeout；未提交事务由 SQLite 在重开时恢复。实现依据[SQLite 原子提交机制](https://sqlite.org/atomiccommit.html)，其保证依赖文件系统锁和可靠 flush。实际子进程中断已经验证，不等于整机断电、网络文件系统、损坏盘或生产备份恢复已验证。不要手动删除 journal，也不要将数据库复制中的状态当作正式备份。

来源库读取失败、关闭或缺少精确发布时不提交；新信任拒绝已有准备记录时记录仍保留，可查询/放弃。共享代码存在时重新校验原缓存，损坏不能被“已安装”标记掩盖；相同内容的新授权提交可更新缓存署名，但不改变其他根绑定或授予权限。源码/schema/签名失败不运行用户代码。

错误沿用协议：INVALID_INPUT（身份/快照或内容不合法）、FORBIDDEN（来源、环境、过期/撤销或不可见原记录）、CONFLICT（闭包/请求/根/不可变内容冲突）、LIMIT_EXCEEDED（整库预算）、UNAVAILABLE（关闭、锁或存储失败）。prepare/commit失败保留其他根，禁止部分安装可见。持久租约见执行参考；卸载和显式 GC 见[生命周期手册](/publishing/lifecycle)；安装器不自动迁移权限或用户数据；独立 JSON 后端的显式接口见[数据迁移手册](/publishing/migrations)。


## 可搬运 CLI

使用[下载的包工具](/downloads) 0.10.0 和 Node 24，下面以工具内 `capability-packages.mjs` 为入口：

```text
node capability-packages.mjs install-prepare installation.sqlite root.json request.json releases.sqlite trust.json
node capability-packages.mjs install-status installation.sqlite root.json original-request
node capability-packages.mjs install-pending installation.sqlite root.json
node capability-packages.mjs install-commit installation.sqlite root.json original-request releases.sqlite trust.json
node capability-packages.mjs install-abort installation.sqlite root.json original-request
node capability-packages.mjs install-load installation.sqlite root.json trust.json
node capability-packages.mjs install-inventory installation.sqlite root.json
```

root.json 精确四字段如上；request.json 精确 `{requestId,roots,references}`，示例：

```json
{
  "requestId": "original-request",
  "roots": [{ "packageId": "bob/consumer", "range": "^1" }],
  "references": [
    {
      "packageId": "alice/text",
      "version": "1.0.0",
      "sha256": "替换为实际发布返回的64位小写摘要",
      "environment": "test"
    },
    {
      "packageId": "bob/consumer",
      "version": "1.0.0",
      "sha256": "替换为实际发布返回的64位小写摘要",
      "environment": "test"
    }
  ]
}
```

CLI 只有 prepare 可创建新安装库；其余命令要求库已存在。现有 inspect/plan/sign/verify-signed/publish/fetch 保持兼容。所有命令输出 ProtocolValidation JSON；失败退出码 1，固定错误不输出秘密或堆栈。install-load 输出源码和署名，不包含配置、公钥私钥或用户数据；接收方不得把 JSON 当作可信证明。


[更新、卸载与代码回收](/publishing/lifecycle)：安装库当前 schema 3；维护流程、活动任务限制及迁移兼容性见此页。


## 只读检查


new CapabilityInstallationStore(path,root,{readOnly:true}) 只打开已有 schema 3 的安装库，不创建文件、不迁移旧库。可 status/pending/load/inventory/lease 查询；prepare、commit、abort、更新、卸载、回收和租约变更返回 FORBIDDEN。要升级旧 schema，先备份，由可信维护流程使用可写句柄；只读拒绝不能通过修改 user_version 绕过。

## 完整初装流程

使用[共享应用教程](/getting-started/quickstart)公开脚本即可真实执行三包构建、三个发布者签名、完整闭包初装和两应用两入口授权。先检查 init 输出，再 verify，预期四入口均 completed 且重提原请求保持同 taskId。安装收据 committed 与授权 read.active 分别核对，不能只看目录存在。

作者自行集成时先建立可信 root/trust/releases，再准备 request.json；references 从 publish 返回读取真实四字段。包范围选定后仍需列出所有传递依赖的精确 references。若准备或提交中断，install-status 查询原 requestId；committed 是原收据，load 才是当前根有效状态。后续更新见[生命周期](/publishing/lifecycle)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
