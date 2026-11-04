# 项目与测试发布

[文档首页](/) · [身份与组织](/center/identity) · [开发者中心HTTP](/reference/developer-center) · [下载发布工具](/downloads)

开发者中心测试发布兼容服务0.6.0，发布工具0.3.0，Node24、SDK0.0.11。本地服务须显式配置平台Ed25519签名私钥文件、keyId、受邀身份以及独立审核/发布职责。私钥由平台保管，不能放在项目、工具包、网页或凭据文件中；显式生产发布和密钥轮换见[生产发布与签名键管理](/center/production-publishing)；实际托管尚未验证。

先登录中心，在个人或组织范围申请命名空间，再创建应用或能力项目。填写包标识`your-team/application`、类型、名称、署名、许可与SDK版本。只能使用当前范围拥有的命名空间；个人与组织范围分开。项目及其版本列表不向其他组织泄露。

包复用`capability-package.json`目录格式：受限QuickJS函数或静态应用；不接收任意Node安装脚本、ZIP解压路径或新宿主服务实现。构建仍使用已发布开发工具。包内依赖必须能由当前范围已经签名发布的能力版本解析，静态应用不能成为依赖。包内兼容契约、文件路径、内容长度、摘要和精确绑定由既有公共验证器检查。

## 公开工具

从工具包获取独立的`sitoo-publish.mjs`，无需平台源码或node_modules。创建项目后在中心创建**项目发布凭据**：仅此项目、测试环境、查询/提交，有效7天，秘密只展示一次。原命名空间只读凭据不能用来提交；组织角色变化及显式撤销使发布凭据持久失效。

配置`publish.json`不存秘密：

```json
{"origin":"http://127.0.0.1:18683","tokenEnv":"SITOO_PUBLISH_TOKEN"}
```

```powershell
# 从安全凭据配置设置环境变量，不把秘密写进仓库或日志。
node tools/sitoo-publish.mjs prepare dist release-input.json
node tools/sitoo-publish.mjs submit dist <project-id> publish.json
node tools/sitoo-publish.mjs status - <project-id> publish.json
```

prepare只读校验目录，输出发布物JSON供中心上传；输出路径已存在则拒绝覆盖。submit先本地校验，再通过真实HTTP提交。命令成功退出0，失败退出1；只输出记录号、版本、摘要、状态/原因，不回显令牌。origin只允许HTTPS或本地HTTP，拒绝重定向。同版本同摘要重试返回原记录，同版本异内容返回`VERSION_IMMUTABLE`；连接中断后先status查询，不盲目改版本补跑。

## 审核与发布

提交状态为pending。平台审核者核对声明、许可、权限、兼容性和内容摘要，写入批准或拒绝理由；提交者不能自审。批准后由另一身份的发布者显式签名测试发布，服务复核审核者/提交者当前权限、原摘要及依赖。审核者和发布者不能由同一身份完成同一发布。批准后提交者角色变化会使批准永久失效；重新授权不复活旧凭据。

拒绝/失效的旧记录保留；修正包后提高版本重新提交，不覆盖旧版本。发布内容和签名在同一SQLite事务提交，重启后只查询原发布，不形成半发布文件。测试Ed25519签名沿用现有公共格式与七天有效期；客户端仍须从可信宿主配置选择公钥，不能把包附带公钥当信任。

## 当前服务接口

会话接口继续使用HttpOnly Cookie、Origin和X-CSRF-token；Bearer工具路由单独验证项目/环境，不能用于成员管理、审核或发布批准。

|方法|路径|输入/结果|
|---|---|---|
|GET/POST|`/v1/projects`|查询当前范围；创建{packageId,type,name,license,author,sdk}|
|GET/POST|`/v1/projects/:project/submissions`|查询；提交{manifest,sources,sha256,attestation?}|
|GET|`/v1/projects/:project/publishing-credentials`|只读元数据，无秘密|
|POST|`/v1/projects/:project/publishing-credentials`|创建测试项目凭据，秘密只返回一次|
|DELETE|`/v1/projects/:project/publishing-credentials/:id`|当前所有者/管理员或凭据创建者撤销|
|GET|`/v1/submissions/:id/artifact`|所有者或平台审核者只读检查内容，不执行|
|GET|`/v1/review-queue`|仅平台reviewer，读取待审声明|
|GET|`/v1/publication-queue`|仅平台publisher，读取已批准记录|
|POST|`/v1/submissions/:id/review`|{sha256,decision:approved或rejected,reason}|
|POST|`/v1/submissions/:id/publish`|{sha256}，返回{id,environment:test,attestation}|
|GET/POST|`/v1/environments/test/projects/:project/submissions`|Bearer项目凭据，查询/提交|

项目/提交成功分别201，其余成功200。400为无效包/摘要/依赖或不兼容；401为凭据失效；403为作用域/环境/职责越权；404不暴露其他组织项目；409为版本不可变、审核状态或批准冲突；413为请求超过2MiB；503为安全脱敏的服务故障。可选上传签名只按平台配置的publisherKeys核验，包不能自签发信任。实际发布私钥从不返回。

本服务用于受邀本地测试；发布后进入[目录与测试安装](/center/catalog)。正式生产分发尚未开放。

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)

使用[本地冻结CI](/center/ci-support)自动执行测试、构建、校验与提交；独立审核和签名职责保持。0.2.0摘要输出状态/请求号，不回显审核理由。

[受邀测试完整流程](/center/invited-testing)：双开发者共同能力复用、独立安装与原始记录。


生产发布、密钥管理和独立目录安装见[生产发布指南](/center/production-publishing)。中心0.6.0、发布工具0.3.0、开发Desktop0.0.34；SDK0.0.11保持兼容。生产新业务执行与实际托管尚未开放；既有受邀测试环境保持原版本。
