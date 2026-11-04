# 命令行工具

使用已发布开发工具包中的独立脚本。需要 Node.js 24 或更新版本；以下尖括号表示必填参数，方括号表示可选参数，不要原样输入括号。每行是一个独立命令，不输入多个名称组合。配置与私钥文件由可信宿主管理，不放入应用页面或公开仓库。

## 项目初始化

```text
node sitoo-project.mjs create <新项目目录>
node monorepo-template/init.mjs <已存在仓库目录> <capability-kit目录> <capability-packages目录>
```

参见[共享应用入门](/getting-started/quickstart)和[多应用仓库](/publishing/monorepo)。

## 开发宿主

```text
node sitoo-capability.mjs init <new-project>
node sitoo-capability.mjs init-fixtures <new-project>
node sitoo-capability.mjs serve <host.json> <data-directory> [--parent-pipe]
node sitoo-capability.mjs serve-conversation-fixture <host.json> <data-directory> [--parent-pipe]
node sitoo-capability.mjs serve-conversation-model <host.json> <data-directory> <planner.json>
node sitoo-capability.mjs health <host.json> <cases.json> <health-data-directory>
node sitoo-capability.mjs plan <url> <project> <app> <taskId>
node sitoo-capability.mjs confirm <url> <project> <app> <taskId> <revision>
```

## 能力包管理

```text
node capability-packages.mjs authorization-set <authorizations.sqlite> <root.json> <entry> <input.json>
node capability-packages.mjs authorization-read <authorizations.sqlite> <root.json> <entry>
node capability-packages.mjs authorization-status <authorizations.sqlite> <root.json> <entry> <requestId>
node capability-packages.mjs data-initialize <data.sqlite> <root.json> <input.json>
node capability-packages.mjs data-write <data.sqlite> <root.json> <input.json>
node capability-packages.mjs data-migration-prepare <data.sqlite> <root.json> <input.json>
node capability-packages.mjs data-read <data.sqlite> <root.json>
node capability-packages.mjs data-migration-pending <data.sqlite> <root.json>
node capability-packages.mjs data-migration-status <data.sqlite> <root.json> <requestId>
node capability-packages.mjs data-migration-commit <data.sqlite> <root.json> <requestId>
node capability-packages.mjs data-migration-abort <data.sqlite> <root.json> <requestId>
node capability-packages.mjs data-migration-rollback <data.sqlite> <root.json> <requestId>
node capability-packages.mjs update-review <installation.sqlite> <root.json> <requestId> <policy.json> <releases.sqlite> <trust.json>
node capability-packages.mjs update-commit-authorized <installation.sqlite> <root.json> <requestId> <approval.json> <releases.sqlite> <trust.json>
node capability-packages.mjs update-prepare <installation.sqlite> <root.json> <request.json> <releases.sqlite> <trust.json>
node capability-packages.mjs uninstall-prepare <installation.sqlite> <root.json> <requestId>
node capability-packages.mjs uninstall-commit <installation.sqlite> <root.json> <requestId>
node capability-packages.mjs install-collect <installation.sqlite> <root.json>
node capability-packages.mjs lease-acquire <installation.sqlite> <root.json> <lease.json> <trust.json>
node capability-packages.mjs lease-load <installation.sqlite> <root.json> <taskId> <trust.json>
node capability-packages.mjs lease-status <installation.sqlite> <root.json> <taskId>
node capability-packages.mjs lease-release <installation.sqlite> <root.json> <taskId>
node capability-packages.mjs lease-list <installation.sqlite> <root.json>
node capability-packages.mjs lease-inventory <installation.sqlite> <root.json>
node capability-packages.mjs inspect <directory>
node capability-packages.mjs plan <requirements.json> <package-directory>...
node capability-packages.mjs sign <directory> <private.pem> <metadata.json> <output.json>
node capability-packages.mjs verify-signed <directory> <signature.json> <trust.json>
node capability-packages.mjs publish <directory> <signature.json> <trust.json> <store.sqlite>
node capability-packages.mjs fetch <store.sqlite> <reference.json> <trust.json>
node capability-packages.mjs install-prepare <installation.sqlite> <root.json> <request.json> <releases.sqlite> <trust.json>
node capability-packages.mjs install-commit <installation.sqlite> <root.json> <requestId> <releases.sqlite> <trust.json>
node capability-packages.mjs install-status <installation.sqlite> <root.json> <requestId>
node capability-packages.mjs install-abort <installation.sqlite> <root.json> <requestId>
node capability-packages.mjs install-pending <installation.sqlite> <root.json>
node capability-packages.mjs install-inventory <installation.sqlite> <root.json>
node capability-packages.mjs install-load <installation.sqlite> <root.json> <trust.json>
```

## 静态应用工具

```text
node sitoo-app.mjs create <不存在的新目录>
node sitoo-app.mjs check <文件.spkg>
node sitoo-app.mjs pack <项目目录> <输出.spkg>
node sitoo-app.mjs init-market <市场目录> <私钥文件>
node sitoo-app.mjs publish <市场目录> <私钥文件> <文件.spkg>
```

命令失败时检查退出码和错误输出。安装、更新、卸载与迁移命令包含准备、查询和提交阶段；请先阅读[安装事务](/publishing/installations)、[生命周期](/publishing/lifecycle)和[数据迁移](/publishing/migrations)，不能把准备成功当作提交完成。

[文档首页](/) · [接口导航](/reference/)


## 输入文件、输出与退出码

路径均由自己可信配置或创建器取得，目录名是占位，不是已存在的个人路径。Node 使用完整脚本路径或在解压目录执行。只有 init/create/初装准备等明确初始化命令创建自己的新文件；已有输出拒绝覆盖。Node 24 的 SQLite 实验提示不是业务失败，仍检查退出码与 JSON。

| 命令组 | 输入来源与内容 | 成功/错误行动 |
| --- | --- | --- |
| sitoo-project create | 新目录，生成 core/app-a/app-b | 输出项目路径，随后按[完整共享教程](/getting-started/quickstart)构建签名安装 |
| init / init-fixtures | 不存在的宿主示例目录 | 初始化后私有 token/config；fixture 不代表生产服务 |
| serve / serve-conversation-* | 自己 host.json、任务目录；model 另需可信 planner.json | 输出 loopback url，进程保持运行；Ctrl+C 关闭；[配置来源](/capabilities/host) |
| health | v2/v3 已安装配置、formatVersion/cases、独立数据目录 | JSON value.passed=true 与退出码 0；ok=true 但 mismatch 仍退出 1；[用例格式](/publishing/testing) |
| plan / confirm | init-fixtures 生成的 project、app 子目录、原 taskId；confirm 必填刚读取的 revision | 分别 GET 原计划/POST 批准；从私有 token.txt/confirmation-token.txt 读凭据，不适用于共享教程 .local 文件布局 |
| inspect / plan | 真实发布目录；requirements.json 包含 packageId/range 需求数组及所有候选目录 | ProtocolValidation 校验/闭包，无来源认证；[目录包](/capabilities/packages) |
| sign / verify-signed / publish / fetch | Ed25519 私钥、metadata、独立 trust、精确 reference | 输出安全校验/署名/四字段引用/原包；不执行、不授权；[签名流程](/publishing/signatures) |
| install-prepare / update-prepare | root 四字段，request={requestId,roots,references} | prepared 仅计划；commit 前后用原 status/load 核对；[安装](/publishing/installations) |
| update-review / update-commit-authorized | policy={entry,grants}；approval={policy,reviewSha256} | 新权限/入口/摘要变化拒绝；[完整预检](/publishing/lifecycle) |
| uninstall / install-collect | 可信当前 root/原 requestId | 不删业务数据；active/unknown pin 仍保护，不为回收强行 release |
| lease-acquire | lease={taskId,requestId,bindings}、当前 trust | 保护原完整计划；lease-load 重验信任；释放仅可信任务证明终态 |
| authorization-set | {requestId,expectedRevision,policy,status}；policy={entry,grants,bindings} | active/revoked 独立收据，不产生 Bearer；[授权](/publishing/authorization) |
| data-* | initial={dataVersion,value}、write={expectedRevision,dataVersion,value}、migration={requestId,expectedRevision,targetVersion,value} | 只独立 JSON 后端；[完整迁移演练](/publishing/migrations) |
| sitoo-app create/pack/check | 新项目、真实 payload、不存在 .spkg 输出 | 成功输出路径/ID/版本/摘要等原始 JSON，不是 ProtocolValidation；[静态教程](/getting-started/static-app) |
| init-market / publish | 私有 TUF 市场目录、市场外私钥、已检查 .spkg | 静态市场流程，不等于能力签名库；[维护发布](/publishing/static-packages) |

包工具 stdout 为 ProtocolValidation JSON，成功退出 0、失败退出 1。静态工具使用自己的 JSON 输出与非零错误退出；开发宿主 serve 的启动退出与运行生命期分开。仅查看 stdout 不够，PowerShell 执行后读取 `$LASTEXITCODE`；非零停止后续步骤。响应丢失先 status 原请求，不自动更换 ID 重提安装、迁移或业务。

## 租约与静态共享绑定补充

lease-inventory 为整库租约记录/active/引用统计，普通消费应用不应调用。sdkRange>=0.0.11 的静态包可显式绑定 capabilities.text-request/image-request/call，需可信宿主已安装签名共享闭包并分别授权，旧 .spkg 初装不隐式建立共享根。失败不回退旧收费生成，详见[版本说明](/support/versions)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
