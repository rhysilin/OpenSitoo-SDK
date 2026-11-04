# 签名与信任

## 来源与信任

沿用[内容校验与精确计划](/capabilities/packages)。新增 Ed25519 署名验证发布者对包精确身份的声明；摘要仍不能独自证明来源，签名也不等于代码安全、租户授权或安装许可。

公钥及其 namespace/environment 授权由可信宿主预配置，包或消费应用不能自带公钥建立信任。namespace 是宿主授予该 keyId 的归属，不是通过包名猜测身份；开发参考未接开发者账号核验。环境由可信安装/宿主配置选择，不将用户 wire 的自报环境当政策。

PackageSigningMetadata 为 `{keyId,environment,issuedAt,expiresAt}`，环境 development/test/production，时间是非负安全整数 UTC epoch 毫秒，有效期最长 7 天。PackageAttestation 增加 `{formatVersion:1,packageId,version,sha256,signature}`，无额外字段，不包含公钥或凭据。signature 为 64 字节 Ed25519 结果的规范 base64。

签名原文为固定顺序 UTF-8 JSON 数组 `["sitoo-capability-release-attestation-v1",1,keyId,environment,packageId,version,sha256,issuedAt,expiresAt]`，使用 Node crypto.sign/verify 的 null algorithm；依据 [Node Crypto 官方参考](https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptosignalgorithm-data-key-callback)。包内 file/hash/schema/依赖都已经由 package sha256 覆盖，metadata 改动也会导致签名失败。


## 接口

| 方法                                                | 约束与返回                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| signCapabilityPackage(pkg,privateKey,metadata)      | 已校验的进程内包对象 + Node KeyObject（private、ed25519）；返回 `ProtocolValidation<Readonly<PackageAttestation>>`，不返回私钥 |
| new CapabilityPackageTrust(keys)                    | 可信配置；非法项抛出固定安全错误，建立不可变政策快照                                                                           |
| trust.verify(pkg,attestation,now=Date.now())        | 返回 `ProtocolValidation<TrustedCapabilityPackage>`，含冻结 package/attestation；不执行源码或授予权限                          |
| new CapabilityReleaseStore(path,options?)           | 可信指定 SQLite 路径，父目录已存在；构造/存储故障固定错误，不自动换库                                                          |
| store.publish(pkg,attestation,trust,now=Date.now()) | 验签后事务写原内容/署名，返回 `{packageId,version,sha256,environment}` 的 ProtocolValidation                                   |
| store.get(reference,trust,now=Date.now())           | reference 同发布返回的四字段；精确查找，重新校验内容与当前有效来源，返回 TrustedCapabilityPackage                              |
| store.close()                                       | 幂等关闭，之后 publish/get 返回 UNAVAILABLE                                                                                    |

TrustedPackageKey 为 `{keyId,namespace,environments,publicKeyPem,notBefore,notAfter,revoked}`，只允许这些字段。keyId 是最多 128 位 ASCII 标识；namespace 使用包 namespace 规则；environments 不重复、至少一个；publicKeyPem 为 SPKI Ed25519 PEM，最多 4096 字符；notBefore/notAfter 为有效区间。最多 32 个不重复 keyId，配置仍受协议 JSON 预算约束。构造时快照，运行时改 trust 输入无效；要撤销/更新需提供新可信 Trust 实例。

验签同时检查当前时间在 key 和署名区间内，署名区间在 key 区间内、namespace 匹配、环境获授权、key 未撤销、精确包身份相同、signature 有效。now 只供可信时钟/测试注入，不能由消费应用覆盖。签名封装最多 4096 字节。格式/伪造内容快照/密钥类型/编码非法为 INVALID_INPUT，来源/环境/签名/过期/撤销拒绝为 FORBIDDEN；无原私钥、路径或底层异常回传。


## 离线发布行为与边界

发布库使用 schema 1 和独立 application_id、DELETE journal/FULL 同步/100ms busy timeout；拒绝外来和未知 schema 库，原有任务数据库不会被当成发布库。发布事务按 `(environment,packageId,version)` 固定唯一内容 sha256，重复同内容署名幂等，不同内容 CONFLICT。同内容允许追加新的有效署名，便于有限期续签；读取重新验证当前可信 key，旧署名不能绕过当前撤销或过期。

最多 128 条内容发布、512 条署名，包含过期项，不自动淘汰或覆盖，超额 LIMIT_EXCEEDED。读取只接精确版本/hash/environment，没有最新版、跨环境或近似回落；不存在/不受当前信任为 FORBIDDEN。库损坏/存储故障为安全 INVALID_INPUT 或 UNAVAILABLE，失败不承诺“未写入”，重开后按原身份查询。库含公开业务源码与元数据，不含私钥、租户配置或模型凭据。


## 独立工具操作

包工具 CLI 版本 0.10.0，复制整个工具目录到仓库外；旧 inspect/plan 仍支持 unsigned 开发目录检查，不产生来源认证。

```powershell
node capability-packages.mjs sign C:/dev/pkg C:/dev/private.pem C:/dev/signing-metadata.json C:/dev/signature.json
node capability-packages.mjs verify-signed C:/dev/pkg C:/dev/signature.json C:/dev/trust.json
node capability-packages.mjs publish C:/dev/pkg C:/dev/signature.json C:/dev/trust.json C:/dev/releases.sqlite
node capability-packages.mjs fetch C:/dev/releases.sqlite C:/dev/reference.json C:/dev/trust.json
```

sign 只写不存在的输出文件，不覆盖；私钥文件最多 4096 字节，CLI 不输出其内容。trust.json 是上述 TrustedPackageKey 数组，须由宿主管理者配置，不能使用从包下载的同名文件。Windows mode 不替代完整 ACL。所有 key fixture 均临时生成，不能提交实际私钥。

publish 验签失败不打开发布库；fetch 要已有库，不创建未知请求。fetch 输出 manifest/sources/bindings/sha256/attestation 的 JSON 内容；该反序列化 JSON 不能作为来源凭证或 Verified 对象，接收端必须重新用 manifest+原源字节校验并验签。sources 保留 UTF-8/BOM，不包含宿主私有状态。后续安装器须在安装和调用绑定时再次核验权限及精确版本。


0.3.0 的[安装事务与根引用](/publishing/installations)已消费本页精确可信发布；本页署名/发布接口仍不执行安装、授予权限或注册运行。

0.3.0 的 get 同时显式比较通过验签的封装环境与查询环境；即使同 keyId 授权多个环境，数据库中放错环境的有效封装也不作为该发布的凭证。

[更新、卸载与代码回收](/publishing/lifecycle)：安装库当前 schema 3；维护流程、活动任务限制及迁移兼容性见此页。


## 准备文件与成功判定

metadata.json 必须是 PackageSigningMetadata（keyId、environment、issuedAt、expiresAt）；时间为 Unix 毫秒，区间受可信公钥有效期约束。private.pem 是发布者 Ed25519 PKCS#8 私钥，trust.json 是操作者预配置的 TrustedPackageKey 数组，不能从同一不可信包自动信任其公钥。完整字段见[包管理参考](/reference/packages)。

最短可运行演示见[共享应用教程](/getting-started/quickstart)的 init：仅在新 .local 生成临时密钥，署名有效一小时，用于无费用本机教学。正式签名应使用维护者管理的既有密钥和合法 namespace；不提供自助生产身份登记。

verify-signed 成功返回可信发布快照；publish 成功返回 packageId/version/sha256/environment 精确引用。将此引用用于安装，不从未经校验的 fetch JSON 构造可信对象。FORBIDDEN 检查 namespace、环境、时间、撤销与公钥；CONFLICT 检查同版本是否更改字节；存储未知响应先按原四字段 fetch，不换版本假装恢复。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
