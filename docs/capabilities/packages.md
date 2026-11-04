# 目录包与依赖

## 目录包格式

根文件 `capability-package.json` 在 quickjs-function-v1 能力类型只允许以下字段；0.9.0 新增独立应用类型及 application 字段，完整规则见[应用发布物手册](/capabilities/artifacts)。两类分别发布，内容校验/签名/安装方法相同。

| 字段                | 值与约束                                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| formatVersion       | 1                                                                                                                                                                     |
| execution           | quickjs-function-v1；只有函数体，无任意 Node、native 或网络入口                                                                                                       |
| packageId / version | namespace/name；精确规范 semver，不能用 v 前缀、范围或最新版                                                                                                          |
| dependencies        | `{packageId,range}[]`；非空有效 semver range，同包不可重复或自依赖                                                                                                    |
| capabilities        | `{capabilityId,source,interfaceVersion,inputSchema,outputSchema,permissions,allowedEntries,delegates,effects}[]`；使用 Broker 当前真实声明，去掉 binding，增加 source |
| files               | `{path,bytes,sha256}[]`；每个原始 UTF-8 源文件的长度与小写 SHA-256                                                                                                    |

能力 ID 与包同 namespace。所有源文件必须被声明使用，不允许额外 payload、重复能力、不同大小写别名、路径穿越、绝对路径、Windows 设备名或非 `.guest` 文件。source 为异步函数体，仍由现有受限 Runtime 执行；只检查 Broker 声明，不执行源码。UTF-8 BOM 保留用于原字节摘要，非法 UTF-8 拒绝。

预算：manifest 65536 字节（还受协议 JSON 深度 32/节点 8192/请求 envelope 64 KiB 约束）；1–16 个源文件，每个 1–65536 字节，总计最多 1 MiB；1–16 个能力、最多 32 个依赖。目录读入最多遍历 64 个条目/16 层，不读设备文件、不允许链接，未声明文件拒绝。读取前后尺寸受限，但不是抵御恶意并发修改文件系统的 OS 沙盒；安装时须从已验签的不可变暂存区重新核验。schema 编译沿用可信 Broker/Ajv，恶意 schema 的 CPU/正则隔离和生产审核待专项门禁。


## 宿主接口

| 方法                                                                                       | 返回                                                                                                                         |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| verifyCapabilityPackage(manifestJson:string, files:ReadonlyMap<string,Uint8Array>)         | 同步 `ProtocolValidation<VerifiedCapabilityPackage>`；运行时要求 Map，校验后保存冻结的 manifest/sources/bindings/sha256 快照 |
| readCapabilityPackage(directory:string)                                                    | 异步相同结果；读取目录并调用内容校验，错误不返回本机路径或原异常                                                             |
| resolveCapabilityDependencies(roots:unknown, catalog:readonly VerifiedCapabilityPackage[]) | 同步 `ProtocolValidation<CapabilityDependencyPlan>`；仅接本模块实例签发的已校验对象，不能把反序列化对象当可信 catalog        |

PackageRequirement 为 `{packageId:string,range:string}`。roots 为 1–32 个不重复需求；catalog 最多 128 个版本。包内同 packageId/version 不允许多个内容摘要，完全相同项合并。注册前宿主还须核验签名和来源、再建立 session；Verified 对象不是授权凭证。

解析采用确定的包名顺序及版本优先顺序，优先满足条件的高版本，约束冲突时回溯；预发布遵循 semver 的显式范围规则。全部传递依赖满足后输出依赖先于消费者的 packages，及对应精确 bindings。循环、缺包、无可满足版本、能力 ID 多重所有者或 delegate 不在本包/声明依赖闭包中拒绝。最多探索 2048 个状态，超额 LIMIT_EXCEEDED，绝不返回半份计划。

计划为 `{formatVersion:1,roots,packages:[{packageId,version,sha256}],bindings}`，冻结快照可保存为 JSON。解析器不持久化锁；[安装事务](/publishing/installations)提供 load 重验，不能把保存 JSON 直接作为新的 Verified catalog。单个安装计划一个包/能力只选一版；不同应用可以使用独立计划保留不同版本，并存安装与在途任务绑定由[安装根及租约](/publishing/installations)管理。解析不使用调用者 grants，也不自动扩大权限。

失败为 `{ok:false,error:{code,message}}`：格式/源码/schema/伪造校验对象 INVALID_INPUT，依赖不可满足/循环/同版本不同摘要 CONFLICT，目录/搜索超额 LIMIT_EXCEEDED。缺包属于不可满足约束。合法计划不承诺对应能力已经安装或能够调用。


## 可搬运工具

三发布者样例随工具放入 reference/，包含 alice/text 与 bob/carol 两个无 UI 消费包；这是协议参考，不是已经接入 Desktop 的独立 UI 应用。模块测试实际通过 WASM 执行两条委托链并保持各自身份。

仓库内 `node scripts/capability-packages.mjs` 构建 `release/capability-packages/`，包含自足 CLI、文档和依赖许可证；复制整个目录到仓库外，在 Node 24 下使用：

```powershell
node capability-packages.mjs inspect C:/dev/text-package
node capability-packages.mjs plan C:/dev/requirements.json C:/dev/text-package C:/dev/poster-package
```


[更新、卸载与代码回收](/publishing/lifecycle)：安装库当前 schema 3；维护流程、活动任务限制及迁移兼容性见此页。

0.7.0 新增[独立 JSON 数据迁移与回退](/publishing/migrations)，不自动转换既有 SDK/产品数据。

[持久授权与运行门禁](/publishing/authorization)（包工具 0.8.0、开发宿主 0.4.0；可信管理与 opt-in v3）。


## 构建、检查和选择依赖

1. 用 sitoo-project.mjs create 生成独立项目，修改 core 中的能力声明与 `.guest` 业务函数。
2. 运行 core/build.mjs 到新输出目录，由构建器根据原始 UTF-8 字节生成 files；不要手写伪摘要。
3. 对输出执行 capability-packages.mjs inspect，预期 ok=true，检查 manifest、bindings、sha256。
4. 用 plan 的 requirements.json 指定包和版本范围，列出候选目录；预期返回完整 dependency plan，缺包和循环会失败。
5. 进入[签名与信任](/publishing/signatures)，再从可信发布建立[安装根](/publishing/installations)。unsigned inspect/plan 仅验证格式和依赖，不授予权限。

完整可运行文件、命令与输出见[共享应用教程](/getting-started/quickstart)，方法参数见[包管理参考](/reference/packages)。改变内容须增加版本并重新生成摘要和签名，不能修改已发布的不可变版本。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
