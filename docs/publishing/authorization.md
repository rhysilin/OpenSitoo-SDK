# 入口授权

## 身份、职责与兼容

共享能力代码不共享授权。`new CapabilityAuthorizationStore(path, root, entry)` 由可信操作者选择租户、账户、应用、环境与入口；root 沿用[安装根](/publishing/installations)。application/conversation/service 分开保存。独立 SQLite schema 1，application_id 为 `0x53434155`，与安装 schema 3、数据 schema 1、任务/发布 schema 1 分开。异种库与未知 schema 拒绝打开，不重建旧表。

无记录即无授权；不能从包的 permissions 自动推导 grants。授权不等于来源信任、收费同意或数据共享。消费应用不能访问此管理模块、CLI 或账本路径；生产环境需要受认证的管理服务与审计，当前开发 bearer 不是生产认证。

授权绑定完整精确能力 bindings。可信操作者必须从当前验签后的 install-load 取得计划，结合权限预检决定 grants。记录接口只校验结构，不独立验签、不推断用户同意或替操作者检查业务副作用；宿主启动时检查精确已安装闭包，运行前继续验签。代码更新不自动迁移授权。安装、授权和数据是不同库，没有跨库原子切换：停止旧宿主，查询/处理旧任务与 pin，按生命周期提交代码，明确授权目标 bindings，然后重新启动；中断时分别查询原请求，不自动重提业务执行。


## 可信管理契约

方法同步返回 `ProtocolValidation<T>`，成功快照深冻结。错误为 INVALID_INPUT、CONFLICT、LIMIT_EXCEEDED、UNAVAILABLE；错误不包含数据库路径或原始 SQL。

| 方法                                              | 返回和约束                                                    |
| ------------------------------------------------- | ------------------------------------------------------------- |
| read()                                            | 当前 CapabilityAuthorization 或 null；缺少记录不隐式初始化    |
| status(requestId)                                 | 原 CapabilityAuthorizationReceipt 或 null，只查当前身份与入口 |
| set(requestId, expectedRevision, policy, status?) | 原子保存授权与收据；status 默认 active，或显式 revoked        |
| close()                                           | 幂等关闭；关闭后的查询/修改返回 UNAVAILABLE                   |

policy 严格为 `{entry,grants,bindings}`，沿用 Broker 校验：最多 64 个唯一合法权限与 64 个唯一 capabilityId 的精确绑定。entry 必须匹配构造入口，权限和 bindings 顺序规范化；对象键顺序不影响同一请求判断。CapabilityAuthorization 为 `{revision,status,policy}`；收据为 `{requestId,expectedRevision,authorization}`。

首次 expectedRevision=0，之后须匹配当前 revision，每次明确 set 都递增。revoked 必须使用空 grants；操作者撤销时应保留原 bindings 便于审计。恢复授权需要新的 requestId 和当前 revision。requestId 为 1–128 字符的安装标识规则。同一原请求、原 revision 和相同规范化输入返回历史收据，输入不同 CONFLICT；历史收据不会回写旧 grants，也不证明当前授权仍然有效。提交响应未知先 status，再 read 核对当前状态。

AUTHORIZATION_LIMITS：整库 384 个身份/入口 scope、1024 条终身收据，revision 上限 2147483647。满额拒绝新变更，保留查询、原请求去重及当前状态；不自动删除收据或回退 revision。授权行和收据在同一 SQLite 写事务中提交，中断时整体恢复。


## 可搬运管理命令

复制完整包工具目录，在 Node 24 执行：

```text
node capability-packages.mjs authorization-set <authorizations.sqlite> <root.json> <entry> <input.json>
node capability-packages.mjs authorization-read <authorizations.sqlite> <root.json> <entry>
node capability-packages.mjs authorization-status <authorizations.sqlite> <root.json> <entry> <requestId>
```

set 输入严格为 `{requestId,expectedRevision,policy,status}`，仅 set 可创建新库；read/status 要求文件存在。root/input 采用现有 64 KiB、有界 UTF-8 JSON 读取。CLI 不接消费 HTTP，也不发放 bearer。


## 已安装宿主配置 v3

```json
{
  "version": 3,
  "installationPath": "installation.sqlite",
  "trustPath": "trust.json",
  "authorizationPath": "authorizations.sqlite",
  "consumers": [
    {
      "token": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "root": {
        "tenantId": "tenant",
        "accountId": "account",
        "applicationId": "app",
        "environment": "development"
      },
      "entry": "conversation"
    }
  ]
}
```

三个已有文件的真实路径必须在配置目录内。每个 root+entry 仅配置一次；token 仍为唯一 64 位小写十六进制开发凭据，示例不可用于正式服务。v3 拒绝内联 grants；启动要求 active 授权且 bindings 与验签后的整个安装闭包一致，再经过真实 QuickJS 编译。配置 v1 源码 fixture、v2 内联可信 grants 继续兼容，但它们没有持久授权撤销保护。迁移由操作者显式创建账本、切换 v3，不自动改旧配置。

宿主保存启动时授权快照，在 POST /v1/tasks、新任务租约获取、执行前再次获取租约，以及每个实际执行器入口（包括嵌套调用）重新读账本。任何修订变化、撤销、缺失或读取失败均拒绝旧快照继续进入新执行；即使 grants 内容相同，新 revision 也需重新启动宿主。不热增权，也不自动采用新策略。恢复操作不会复活旧宿主快照。

撤销不会强制终止已经进入执行器的代码或撤回已经发生的上游操作；检查与外部执行不是跨进程原子撤销。任务终态仍照常记录，旧任务 GET/list/cancel/query-only reconcile 保持原身份可用，其他应用无法查询。unknown 与活动 pin 不因撤销而释放，继续先查原任务；没有自动取消、重试或 TTL 清理。


显式业务健康检查（开发宿主/工具包 0.5.0，真实任务与预期结果比较；不是自动升级批准）。


## 只读检查


new CapabilityAuthorizationStore(path,root,entry,{readOnly:true}) 只打开已有授权库，read/status 不改记录；set 返回 FORBIDDEN，不初始化无记录身份或升级未知库。只读失败仍保留原授权，不能把错误当成空 grants 自动重设。

## 初始授权、撤销和重新采用绑定

初始 policy 来自 install-load.plan.bindings，entry 选择 application 或 conversation，expectedRevision=0。先在确认界面解释 grants 与费用，再 set；成功 read 显示 active 与递增 revision。完整无费用流程见[共享应用教程](/getting-started/quickstart)。

撤销时读取当前 revision，以新的 requestId 保存 status=revoked、grants=[] 和原 bindings。恢复或更新后授权也使用新 requestId 与当前 revision；相同历史请求只能返回收据，不恢复旧权限。CONFLICT 重新 read 让操作者决定，UNAVAILABLE 先 status 再 read，不能盲目循环 set。

开发 bearer 由宿主维护者私有配置分配，不由 authorization-set 返回；该令牌不属于生产登录。应用只调用自己的入口，不能让页面选择 root 或操作者秘密。[权限指南](/guides/permissions)解释角色，管理方法见[包参考](/reference/packages)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
