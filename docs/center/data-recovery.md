# 数据备份、恢复、导出与删除

适用中心服务0.8.0/schema8、Desktop0.0.39与Node24。以下是可信宿主操作者的运维接口，应用开发者不需要取得这些权限。

[文档首页](/) · [工具下载](/downloads) · [开发者中心HTTP](/reference/developer-center)

## 先区分两类操作

备份/恢复由可信运维在宿主执行，包含敏感业务及凭据摘要，文件权限和保存位置必须由运维管理；Windows上的文件mode不能替代目录ACL。普通用户导出不包含会话、CSRF、凭据哈希或签名私钥。Guest、应用页面、App SDK及发布凭据没有数据库或文件路径操作接口。

恢复始终创建独立新目录，不覆盖运行实例。恢复演练和切换上线是不同操作：验证恢复副本、重新配置可信路径并重新登录后，才能在维护窗口切换；不能同时运行同一批业务任务的两个副本。代码回退不能降低数据库schema；旧二进制不得自动降级schema8。production业务执行仍受原生产门禁控制。

## 运维命令与备份清单

从[工具下载](/downloads)取得数据保护运维工具，解压后在工具目录运行以下命令。需要Node24；不需要Desktop源码。

先在备份目录外创建独立删除登记；`binding`由运维为同一数据集合固定，不能从旧备份重建登记：

```powershell
node ecosystem-data.mjs registry-init C:\sitoo-ops\deletions.json center-development
```

准备 `backup-plan.json`，所有路径使用实际绝对路径：

```json
{
  "version": 1,
  "tenant": "my-tenant",
  "environment": "development",
  "binding": "center-development",
  "registry": "C:\\sitoo-ops\\deletions.json",
  "resources": [
    { "id": "center", "kind": "center", "path": "C:\\sitoo-data\\center.sqlite" }
  ],
  "keys": []
}
```

```powershell
node ecosystem-data.mjs backup backup-plan.json C:\sitoo-backups\snapshot-001
```

成功输出 `{ok:true,value:{manifestSha256,cutAt,elapsedMs,resources}}`。将 `manifestSha256`另存于受保护运维记录，不能从待恢复包内取出摘要作为可信证明。备份不是加密包，不要上传到公开下载站。

资源逐项登记，不递归扫描用户目录：

| kind | 内容与版本 |
| --- | --- |
| center | 中心身份、组织、发布、撤销、公钥状态、审计；schema1–7 |
| installations | 安装根、安装事务、租约、已安装精确版本；schema1–3 |
| authorizations | 入口授权与收据；schema1 |
| releases | 发布物及签名闭包；schema1 |
| data | 应用JSON数据和迁移记录；schema1 |
| tasks | 原任务及绑定；schema1–2 |
| quota | 共享许可、限额和identity；schema1 |
| references | 受控引用及撤销；schema1 |
| models | 模型原请求、原上游ID和已有结果；schema1 |
| asset | 信任配置、公钥策略或必要不可变产物；必须提供其sha256 |

有签名密钥时，`keys`登记 `{id,publicKey}`，publicKey为SPKI PEM；私钥放在独立受保护位置，不装进普通导出。运维应核对运行配置中的全部数据路径，并将所有参与的数据库、信任资产及必要产物列入清单。清单不是自动发现器，漏登记资源不会凭空得到保护。外部Provider账户、旧独立应用数据和远端产物保留策略须由其所有者单独处理。

中心WAL数据库支持运行中备份。工具先取得所有数据库写屏障，再复制主库/必要WAL，校验副本并折叠WAL。写请求可能短暂等待或按既有错误拒绝，不承诺无停顿。任务宿主使用EXCLUSIVE锁，须由可信所有者先关闭；不能强杀无关进程。共享配额涉及的任务库必须作为同一恢复集合登记，缺失原许可或其他账本时拒绝恢复。可变配置在维护窗口冻结，资产摘要变化时失败。

## 独立目录恢复

`restore-policy.json`：

```json
{
  "tenant": "my-tenant",
  "environment": "development",
  "binding": "center-development",
  "registry": "C:\\sitoo-ops\\deletions.json",
  "manifestSha256": "替换为另存的64位十六进制摘要",
  "keyFiles": {}
}
```

有密钥登记时，`keyFiles`按id映射独立私钥文件。环境、租户、schema、文件集合、大小、摘要、公钥与私钥对应关系或删除登记不符合时拒绝；已有目标不会改写。

```powershell
node ecosystem-data.mjs restore C:\sitoo-backups\snapshot-001 C:\sitoo-restored\snapshot-001 restore-policy.json
```

恢复会话清空，原撤销记录、任务ID、精确版本和保护租约保持。任务库与共享配额路径，以及含绝对任务库路径的许可ID，只在副本中对应重绑定；保留unknown，不重发业务。成功返回恢复数量、耗时和快照年龄。快照年龄是该次演练数据损失窗口的参考值，不是生产RPO承诺；生产目标待实际容量测量。

## 中心用户导出和删除HTTP

服务配置显式设置 `dataManagement:{registry,binding}`；登记缺失或损坏时不能继续使用已启用策略。现有完整中心同时保留publishing、catalog、support配置。启用后schema7要求后续启动继续提供策略，不允许撤掉配置绕过删除。`GET /v1/session`增加布尔字段`dataManagement`。

| 方法与路径 | 输入 | 成功响应 |
| --- | --- | --- |
| GET /v1/data/export | 当前会话Cookie | version、environment、owner、profile、namespaces、projects、submissions、credentials元数据、feedback |
| POST /v1/data/deletion-preview | `{}` | token、confirmation、owner、projects/submissions/credentials的ID、dataDigest、retentionDays=30、irreversible=true |
| POST /v1/data/delete | `{token,confirmation,confirm:"DELETE"}` | deleted、backupPolicy="quarantined"、retentionDays=30 |

POST须同源JSON、当前会话及`x-csrf-token`。客户端不能通过owner字段选择他人数据。个人操作当前个人范围，组织操作只允许当前组织owner。个人仍拥有组织时先处理组织或转移所有者。预览有效5分钟，绑定账户、当前范围和正文摘要；数据变化需重新预览，不能复用另一账户确认。

示例中`request`表示宿主同源会话请求，不是App SDK方法：

```javascript
const preview = await request('/v1/data/deletion-preview', {});
// 先向用户展示归属、影响和不可逆性，取得用户确认后才执行。
await request('/v1/data/delete', {
  token: preview.token,
  confirmation: preview.confirmation,
  confirm: 'DELETE',
});
```

同源页面可按以下方式实现示例中的`request`；须在可信中心页面使用，不向第三方应用传递Cookie或CSRF：

```javascript
const session = await fetch('/v1/session').then((response) => response.json());
async function request(path, input) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.code ?? 'REQUEST_FAILED');
  return result;
}
```

删除先持久禁止复活登记，再清除正文、会话、成员关系及相关凭据的可用性，发布物保留不可执行墓碑和最低审计。组织删除不删除成员个人数据。中途故障时身份及Bearer立即拒绝，中心重新启动在提供服务前继续清理。当前进程失败后不要反复登录绕过登记；由运维修复故障并重启原中心。

错误：UNAUTHENTICATED=401，CSRF_REJECTED/FORBIDDEN/OWNER_DATA_DELETED=403；ORGANIZATION_OWNERSHIP_REQUIRED、DELETE_CONFIRMATION_REQUIRED、DELETE_PREVIEW_CHANGED=409；存储故障为脱敏SERVICE_UNAVAILABLE=503。未启用模块没有对应HTTP路由。发布凭据和目录只读凭据不能调用这些会话接口。

## 客户端账户清理

可信运维用账户策略JSON调用`account-export`、`account-deletion-preview`、`account-delete`。策略包含tenant、account、environment、binding、registry及`databases:[{kind,path}]`；允许installations/authorizations/data/tasks/references/models/quota。必须包含安装根库以核对归属，路径不能由应用提供。删除前关闭该账户所有宿主；有存活配额许可时拒绝。共享发布缓存及其他账户安装根不递归删除。

```powershell
node ecosystem-data.mjs account-export account-policy.json
node ecosystem-data.mjs account-deletion-preview account-policy.json
node ecosystem-data.mjs account-delete account-policy.json deletion-preview.json CONFIRMATION_SHA256
```

将预览成功响应中的`value`对象另存为`deletion-preview.json`，核对其内容后使用`confirmation`值。数据变化须重新预览。部分跨库提交后失败，禁止复活登记仍保留；安装根最后提交，运维可重新预览并继续清理原账户。普通导出写到stdout，调用方须保护保存位置。

Desktop登记位于共享安装根的`data-deletions/<binding>/registry.json`，binding为`SHA256(JSON.stringify([tenant,environment]))`，owner为`SHA256(JSON.stringify([tenant,account,environment]))`。各租户和环境分别登记，不能影响其他租户；运维策略必须使用这份固定登记，不能另建无关登记冒称已阻止客户端打开。默认策略目录不存在时保持旧资料兼容；初始化后目录仍在而登记缺失时拒绝，不能删除目录或替换成旧登记绕过保护。删除阻止共享安装/服务入口，不注销外部New API账户，也不代表删除第三方服务中的数据。

## 备份保留与故障处理

任意删除登记修订变化都会使更早备份被逻辑隔离，不能通过旧备份复活删除记录。默认物理保留期最多30天，运维需定期执行以下预览和确认清理；工具不会后台自动删除：

```powershell
node ecosystem-data.mjs retention-preview C:\sitoo-backups center-development
node ecosystem-data.mjs retention-apply retention-preview.json CONFIRMATION_SHA256
```

同样保存预览响应的`value`对象。只处理指定根目录下、匹配binding且超过30天的登记目录；候选变化则重新预览，不递归删除其他账户目录。数据库删除是逻辑删除，不是介质安全擦除或法规认证。更长法规保留要求需单独制定策略。

遇到锁冲突先关闭属于本次维护范围的宿主；不要强杀别人的进程。删除登记`.lock`若因运维进程崩溃遗留，须先确认没有登记写入者，再由运维处理锁文件，不能在运行中直接移除。不能为让恢复通过而重置登记、忽略摘要或清理unknown/pin。


## 浏览器应用运行环境

中心0.8.0/schema8、Desktop0.0.39、浏览器宿主0.1.0、数据工具1.1.0新增本机HTTPS签名应用运行路径，支持经典静态页面与受限QuickJS。原生设备桥、模块脚本、图片产物Provider及公网托管未开放。具体配置、例子、原任务与更新行为见[浏览器宿主指南](/center/browser-host)；工具见[下载页](/downloads)。旧版下载保留，不自动降级schema。
