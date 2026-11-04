# 数据迁移

## 范围与顺序

CapabilityDataMigrationStore 提供按 tenant/account/application/environment 四元安装身份隔离的一个 JSON 文档、版本与修订号，以及显式迁移账本。使用独立 data.sqlite，和安装库、任务库、发布库分开。共享能力代码不会共享应用数据。只支持这套新 JSON 后端，不自动导入现有 SDK Storage、Desktop 配置、凭据、文件或第三方数据库。

迁移不执行任意代码或包内脚本。可信宿主或操作者先验证业务结构与目标代码兼容性，提供转换后的完整 JSON 快照；本库校验 JSON 预算与版本，再保存 before/after，prepare 不改变可见数据。commit 在单个 SQLite 写事务里比较当前快照与 before，替换数据并记录 committed。停止宿主的新任务、处理已存在任务和隔离旧代码是操作者责任；数据库不导入运行器或读取安装 pin，也没有跨库原子提交或维护锁。代码提交、数据迁移及授权各自有原请求与恢复流程。

普通 write 也需同时提供 expectedRevision 和 expectedDataVersion。修订变化或数据版本不兼容都拒绝写入；旧代码不能拿新修订号继续向新版本数据写入。所有数据写入必须走此后端，不能通过直接改 SQLite 绕过这些检查。业务 schema、代码/数据兼容窗口、运行任务读写授权和实际迁移转换由可信宿主负责，尚未接入产品或现有应用数据。

rollback 仅在当前快照仍与该 migration.after 完全一致时恢复 before 的值和 dataVersion，并产生更大的 revision。迁移后新增写入或后续迁移会导致 CONFLICT，不覆盖用户的新内容，也不降回旧 revision。此时应先保留当前内容，再通过新 requestId 准备经过验证的合并/补偿快照，不强制恢复旧备份。代码回退不会自动触发数据回退。


## 可信方法与数据

```ts
new CapabilityDataMigrationStore(path, root);
initialize(dataVersion, value);
read();
write(expectedRevision, expectedDataVersion, value);
prepare(requestId, expectedRevision, targetVersion, value);
status(requestId);
pending();
commit(requestId);
abort(requestId);
rollback(requestId);
close();
```

除 close 外返回 `ProtocolValidation<T>`。initialize/read/write 返回 `CapabilityDataSnapshot`：dataVersion、revision、value。initialize 为初始 revision 1，已存在根时返回 CONFLICT，不重复初始化或覆盖。write 保持 dataVersion，仅递增 revision。

迁移方法返回 `CapabilityDataMigration`：requestId、status（prepared/committed/aborted/rolledBack）、before、after 两个快照；pending 返回本根 prepared 记录列表。prepare 保存 before 和 targetVersion/新 value，after.revision=before.revision+1；目标数据版本必须和当前不同，可显式升版或降版。数据版本不是包 semver，版本号不证明内容符合业务 schema。

同根 requestId、原 expectedRevision、targetVersion 和原 JSON value 的重试返回原记录；改变这些参数为 CONFLICT，JSON 对象字段顺序也按已保存 JSON 文本比较，不隐式规范化。aborted/rolledBack ID 保留且不可重用；commit 后重试只返回历史收据，不重新覆盖数据。rollback 成功后重试也仅返回历史收据，后续新写入保持不变。收据的 before/after 是历史快照，当前状态用 read 查询。

prepare 后发生写入或竞争迁移时，commit 的比较失败，旧 prepared 记录留存，可查询后显式 abort。中断或响应丢失先 status 原 requestId，再由操作者选择 commit/abort/rollback；重开不会自动执行任何步骤。

错误沿用既有安全码：INVALID_INPUT（版本、ID、JSON 或快照损坏）、FORBIDDEN（本根数据或请求不存在）、CONFLICT（修订/版本变化、错误状态、重复初始化或变化请求）、LIMIT_EXCEEDED（配额/修订上限）、UNAVAILABLE（存储、锁、关闭或无法解析的持久内容）。原始路径、SQL、值和堆栈不放入错误。成功响应包含用户数据，可信操作者不得将这些输出当作可公开诊断日志。


## 预算与持久化

DATA_MIGRATION_LIMITS：全库最多 128 个数据根、512 条迁移记录，所有终态也计入，不自动删除去重或快照。dataVersion/revision 为 1–2147483647 的整数；修订耗尽拒绝继续写入/迁移，保留查询。值沿用协议 JSON：64 KiB 请求 envelope（实际可用值小于 64 KiB）、深度 32、8192 节点，仅 JSON，无任意路径、二进制或凭据服务。每条迁移保留两个受限快照，全库快照载荷约 64 MiB 上界，另加当前根数据及 SQLite 开销。pending 最多 512 条，响应可能包含多个快照，不是公共网络传输接口。

安装库仍 schema 3，任务库和发布库仍 schema 1，不迁移旧库。安装/卸载/代码回收不读取或删除本数据文件；删除、导出、保留策略与自动回收未实现。path 和 root 必须由可信宿主配置提供，不允许消费应用指定任意本机路径或自报所有者。


## CLI

```text
data-initialize <data.sqlite> <root.json> <initial.json>
data-read <data.sqlite> <root.json>
data-write <data.sqlite> <root.json> <write.json>
data-migration-prepare <data.sqlite> <root.json> <migration.json>
data-migration-status/data-migration-commit/data-migration-abort/data-migration-rollback <data.sqlite> <root.json> <requestId>
data-migration-pending <data.sqlite> <root.json>
```

通过 node capability-packages.mjs 执行。只有 data-initialize 可以创建库文件，其余要求已有文件；不能误用 installation.sqlite。输入文件严格字段：initial={dataVersion,value}；write={expectedRevision,dataVersion,value}；migration={requestId,expectedRevision,targetVersion,value}。CLI 文件限额仍为 64 KiB，输出 ProtocolValidation JSON，失败退出码 1。不是应用自助授权通道。



## 可执行的独立数据演练

前置条件：下载包工具、Node 24、可信操作者创建私有 `.local` 目录及 root.json 四字段。不要使用生产用户数据。将下面两个合法 JSON 文件保存到该目录。

initial.json：
```json
{"dataVersion":1,"value":{"title":"示例"}}
```

migration.json（初始修订为 1）：
```json
{"requestId":"data-v2","expectedRevision":1,"targetVersion":2,"value":{"title":"示例","labels":[]}}
```

```powershell
# 工作目录为自己的私有 .local；首次初始化，不能覆盖既有根。
node C:/Sitoo/capability-packages/capability-packages.mjs data-initialize data.sqlite root.json initial.json
node C:/Sitoo/capability-packages/capability-packages.mjs data-migration-prepare data.sqlite root.json migration.json
node C:/Sitoo/capability-packages/capability-packages.mjs data-read data.sqlite root.json
# prepare 后仍是版本 1；明确提交才变为版本 2、修订 2。
node C:/Sitoo/capability-packages/capability-packages.mjs data-migration-commit data.sqlite root.json data-v2
node C:/Sitoo/capability-packages/capability-packages.mjs data-read data.sqlite root.json
# 没有新写入时可显式回退，恢复值/版本而继续递增 revision。
node C:/Sitoo/capability-packages/capability-packages.mjs data-migration-rollback data.sqlite root.json data-v2
```

各命令输出 ok=true 才进入下一步。prepare 后 value 不变；commit 后 version=2/revision=2；rollback 后 version=1/revision=3。若有新写入再 rollback 应 CONFLICT，不清空数据库。此演练只验证独立 JSON 后端，不迁移 App SDK storage，后者数据格式由应用维护。完整方法见[包参考](/reference/packages)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
