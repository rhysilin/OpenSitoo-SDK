# 更新、回滚与卸载

## 边界与操作顺序

使用可信管理员持有的 `CapabilityInstallationStore`。消费应用不能直接访问安装 SQLite、信任配置或这些方法。身份由原来的 tenant/account/application/environment 四元安装根限定；代码缓存和回收则是全库管理操作。更新不授予新权限，不执行包源码或迁移脚本，不读取或删除用户数据、任务记录、凭据与授权配置。

先停止对应开发宿主的新请求，查询活动租约及原事务，再 prepare/commit；完成后重新启动宿主，从当前安装根重新验证签名、编译代码并签发精确消费绑定。此版本没有跨进程维护锁，停服是操作者责任。每个 commit 内的 SQLite 写锁使租约获取和根切换串行；只要该根存在 active 租约，更新或卸载返回 `CONFLICT`，原版本继续保留。不能把 unknown、已分派取消或保守孤立 pin 当成已结束，不得为更新强行调用 `releaseLease`。不支持在途任务期间热切换。


## 可信 Node 方法

以下方法的结果均为 `ProtocolValidation<T>`，错误为既有安全错误码，无绝对路径或源码详情。原 `prepare`、`commit`、`status`、`abort`、`pending`、`load` 和租约接口保持参数兼容。

| 方法               | 参数                                                              | 结果与行为                                                                                                             |
| ------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `prepareUpdate`    | `requestId, roots, references, releases, trust, now = Date.now()` | `CapabilityInstallationTransaction`；完整锁定新闭包及当前根代数，不改变现行根；目标必须已经安装                        |
| `commit`           | `requestId, releases, trust, now = Date.now()`                    | 同一方法提交初装或更新；重查当前信任、精确内容、配额、根代数及 active 租约；在一个事务里替换该根引用和计划             |
| `prepareUninstall` | `requestId`                                                       | `CapabilityInstallationTransaction`；锁定该根代数；`plan` 是卸载前计划，不是空依赖计划，不要求撤销包重新获信任         |
| `commitUninstall`  | `requestId`                                                       | 同一结果；检查原请求类型、根代数和 active 租约；原子删除该根及引用，只留下代码和账本                                   |
| `collectUnused`    | 无                                                                | `{ removed: number, retained: number }`；显式全库回收，只删不被任何根、引用、active 租约或 prepared 计划保护的缓存代码 |

初装、更新和卸载共用原事务请求 ID 空间。不同操作或不同计划复用 ID 返回 `CONFLICT`，不隐式更换请求。已提交请求重试只返回原收据，绝不再次切换或卸载后来安装的根；aborted 请求不能重新提交。收据不代表当前根或当前执行授权，查询当前状态仍用 `load`。更新/卸载准备后若根变动，原 commit 返回 `CONFLICT`；即使代码从 v1→v2→v1，也不能绕过代数检测。中断后先 `status` 查询原请求，再由操作者明确 commit 或 abort；不自动恢复。

准备更新不要求该根立即空闲，提交时才检查。并发租约与提交受同一个安装库事务保护；更新受阻不撤销原 pin。跨任务库与安装库的保守孤立 pin 问题保持原边界，见执行与租约。

卸载仅删除自身根；其他账号、应用和环境的根及引用保持不变。全库代码回收不会删除历史请求、released 租约去重记录和根代数。未结束的 prepared 事务可能保留旧代码，需要先查询、再明确 abort。配额保持 roots 128 / packages 128 / transactions 512 / lease records 1024，不自动删除收据来腾配额。更新新增代码计入回收前总数，超额时整笔拒绝，不先删旧代码。回收仅减少缓存占用，不重置配额账本。


## CLI

```text
update-prepare <installation.sqlite> <root.json> <request.json> <releases.sqlite> <trust.json>
install-commit <installation.sqlite> <root.json> <requestId> <releases.sqlite> <trust.json>
uninstall-prepare <installation.sqlite> <root.json> <requestId>
uninstall-commit <installation.sqlite> <root.json> <requestId>
install-collect <installation.sqlite> <root.json>
install-status/install-abort <installation.sqlite> <root.json> <requestId>
```

通过 `node capability-packages.mjs` 执行；这些新增命令均要求已有安装库文件。更新请求与初装一致，严格包含 `requestId, roots, references` 三字段；roots 是包版本范围，references 是完整、精确、可信的闭包引用，不是未选候选目录。CLI 文件预算和 JSON 输出/退出码保持原行为。共享代码全库回收也必须显式提供可信管理根，不对消费 HTTP 暴露。

代码回退使用独立 requestId 的新 `prepareUpdate`/`commit`，选择旧版本完整 references；当前信任已撤销或到期则不能回退到该发布物。回退不会恢复或覆盖用户数据。0.7.0 已提供独立 JSON 后端的显式迁移/回退，见[数据迁移手册](/publishing/migrations)；此处的代码回退不会触发它，也不能自动恢复现有产品数据。


## SQLite 兼容

安装库 application_id 保持 `0x5343494e`，schema 从 1/2 升到 3。同一初始化事务新增 `installation_generations` 和 `installation_operations` 表，为已有根填充代数 1；保留所有旧根、缓存、引用、请求和租约。未知 schema/异种数据库仍拒绝，不转换。任务库仍是 schema 1、发布库仍是 schema 1。

每次初装、更新、卸载原子递增根代数，卸载后保留该代数，避免删除后重装复用旧计划。operation 表保存 update/uninstall 请求类型与预期代数，原初装请求保持旧结构。旧工具仅识别安装 schema 1/2，升级后不能直接用旧工具打开；回退工具需离线备份整个安装库并核对新任务与 pin，不能仅改 `user_version`。


更新权限预检：0.6.0 新增差异、入口和原策略指纹检查；不自动授予执行权限。

显式业务健康检查（开发宿主/工具包 0.5.0，真实任务与预期结果比较；不是自动升级批准）。


## 更新权限预检与明确提交

prepareUpdate 之后，可信操作者选择 policy={entry,grants} 并调用 reviewUpdate(requestId,policy,releases,trust)。成功返回原 requestId、generation、完整 plan、policy 和 reviewSha256，同时列出 required（目标必需）、added/removed（与旧声明之差）、missing（policy 缺少）、unsupportedEntries（目标不支持本入口）。预检没有执行代码或写入执行授权。

确认界面展示这些字段。missing 或 unsupportedEntries 非空时不能提交；用户拒绝则保留原安装并显式 abort。用户批准后使用同一 policy 和 reviewSha256 调用 commitAuthorizedUpdate；内部重新审查原计划、代数、信任和摘要，不匹配 CONFLICT，缺权限 FORBIDDEN，活动租约 CONFLICT。commit 成功也不会修改授权账本。

```powershell
# 先完成 update-prepare；policy.json 仅含 entry、grants，来自可信操作者。
node C:/Sitoo/capability-packages/capability-packages.mjs update-review C:/dev/app/.local/installation.sqlite C:/dev/app/.local/root.json update-2 C:/dev/app/.local/policy.json C:/dev/app/.local/releases.sqlite C:/dev/app/.local/trust.json
# 人工确认后 approval.json 仅含 policy 与刚读取的 reviewSha256。
node C:/Sitoo/capability-packages/capability-packages.mjs update-commit-authorized C:/dev/app/.local/installation.sqlite C:/dev/app/.local/root.json update-2 C:/dev/app/.local/approval.json C:/dev/app/.local/releases.sqlite C:/dev/app/.local/trust.json
```

以上为操作模板，root、数据库和原更新请求必须由自己的发布流程建立，不能照抄路径访问他人安装库。提交之后按[入口授权](/publishing/authorization)用当前修订显式设置目标 bindings，再重启。权限缩减也需要采用新精确绑定。健康检查见[测试与诊断](/publishing/testing)，不把探针通过当作批准更新。

## 执行租约的管理边界

任务服务通过 TaskPackageLeases 获取并保留原闭包，安装根空闲后才允许切换。管理员可 lease-status、lease-list、lease-load 检查 taskId/原 requestId/status/plan；lease-release 只在可信任务协调已证明业务终态时使用，不为解除 CONFLICT 强行释放。进程中断、unknown、已派发取消可能保留 pin；回收 collectUnused 不会删除它们。参数和返回见[包管理参考](/reference/packages)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
