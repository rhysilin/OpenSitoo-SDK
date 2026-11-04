# 开发者中心HTTP

服务0.6.0，开发/测试及显式生产身份与发布配置；不是应用SDK、模型服务管理接口或已部署生产REST。服务地址由平台操作者提供，默认本机http://127.0.0.1:18683。操作步骤见[身份与组织](/center/identity)。

## 认证与写请求

GET `/auth/login`启动服务端OIDC授权码+PKCE；GET `/auth/callback`验证state、浏览器绑定、nonce、RS256签名、issuer、audience与期限。仅配置邀请名单的稳定sub可接入。平台职责来自可信配置，不从组织成员权限推断。

登录后浏览器使用HttpOnly SameSite=Lax Cookie，八小时绝对过期；开发名`sitoo_center`，生产名`__Host-sitoo_center_<绑定摘要>`并要求Secure、Path=/、无Domain，另有30分钟不活动过期及每账号最多5个并行会话。重新登录当前浏览器撤销旧会话。GET `/v1/session`读取会话CSRF；所有浏览器写请求必须同源Origin、`Content-Type: application/json`和`X-CSRF-Token`。JSON最大16KiB。浏览器界面正常fetch产生Origin，脚本须显式提供；不能以Bearer模型令牌代替会话。路径中组织ID必须等于当前会话scope且具有当前成员权限。

响应是普通JSON，错误`{error:{code,requestId}}`，不包ProtocolValidation。常见401 UNAUTHENTICATED/LOGIN_STATE/IDENTITY_MISMATCH/LOGIN_TOKEN_INVALID，403 FORBIDDEN/SCOPE_MISMATCH/CSRF_REJECTED/DEVELOPER_NOT_INVITED/ENVIRONMENT_FORBIDDEN，409 LAST_OWNER/NAMESPACE_CONFLICT/ALREADY_MEMBER/INVITATION_UNAVAILABLE，400 INVALID_INPUT/INVALID_NAMESPACE/HOST_MISMATCH，413 BODY_TOO_LARGE，429 LOGIN_LIMIT，503 IDENTITY_UNAVAILABLE/SERVICE_UNAVAILABLE。库验证/上游故障脱敏，不公开密钥、路径、SQL或堆栈。失败未承诺自动重试；重新登录、核对当前scope或先查原记录。

## 路由与数据

| 方法/路径 | 输入 | 成功输出/职责 |
| --- | --- | --- |
| GET /health | 无 | status=ok、version=0.6.0、schema1–4开发/5生产身份、deploymentEnvironment、documentationUrl可选；不是已认证或生产可用证明 |
| GET /v1/session | 会话cookie | actor{id,sub,name}、scope(null个人/组织id)、csrf、organizations[{id,name,role}]、invitations[{id,org,name,role,expires}]、platformRoles[]、deploymentEnvironment |
| POST /v1/logout | {} | signedOut:true，撤销当前会话；独立工具凭据须另行撤销 |
| POST /v1/scope | organization:组织id或null | csrf；轮换cookie，旧会话立即失效，非成员组织拒绝 |
| POST /v1/organizations | name，1–100字符 | 201 {id,csrf}；创建组织并成为owner，切换新组织、轮换会话 |
| GET /v1/namespaces | 当前scope | namespaces[{name,kind}]；只列当前个人/组织归属 |
| POST /v1/namespaces | name | 201 {name}；个人或组织owner/admin申请，全局唯一；小写ASCII、3–40字符、字母开头，允许数字/连字符，保留平台名称 |
| GET /v1/organizations/:org/members | 当前scope | members[{id,sub,name,role}]；当前组织成员可读 |
| POST /v1/organizations/:org/invitations | target:同issuer稳定sub，role，hours可选整数1–168默认24 | 201 {id}；owner/admin；admin不能邀请owner/admin；不是邮件发送 |
| POST /v1/invitations/:id/accept | {} | accepted:true；仅真实目标身份，一次性，过期/重复/邀请者撤权拒绝 |
| PATCH /v1/organizations/:org/members/:actor | role | changed:true；owner/admin；admin不可修改owner/admin或提升至这些角色 |
| DELETE /v1/organizations/:org/members/:actor | {} | changed:true；同上，最后owner不可移除；角色变更/移除撤销目标全部会话、组织凭据及其待接受邀请 |
| GET /v1/organizations/:org/credentials | 当前scope | credentials[{id,environment,name,revoked,expires,actor}]；owner/admin/developer，无原文/摘要 |
| POST /v1/organizations/:org/credentials | name，environment:开发部署development/test；生产部署production | 201 {id,token,expires,environment,scopes:[namespace:read]}；30天，原文仅本响应展示；生产仅命名空间只读凭据，项目发布未开放 |
| DELETE /v1/organizations/:org/credentials/:id | {} | revoked:true；owner/admin可撤组织凭据，developer只能撤自己创建的 |
| GET /v1/environments/:environment/namespaces | Authorization:Bearer 工具凭据 | namespaces[{name,kind}]；仅当前部署对应环境，跨环境拒绝，当前成员/撤权仍复核 |
| GET /v1/organizations/:org/audit | 当前scope | audit[{id,at,actor,action,target}]；owner/admin，最新100条，不含密钥；at/expires为Unix毫秒 |

组织角色owner/admin/developer/reader分别为所有者/管理者/开发者/只读成员。平台reviewer/publisher不是组织角色；审核与发布职责见下方项目发布接口。

## 界面和工具示例

用统一身份登录→创建组织→申请命名空间→按目标稳定sub邀请→目标登录接受→切换组织。当前身份显示sub，邀请无需猜测New API数字ID。通过界面创建test凭据，保存仅显示一次原文：

```powershell
# token来自开发者中心本次创建响应；不要放入包、Git或日志。
$env:SITOO_TEST_TOKEN = '<刚创建的test凭据>'
Invoke-RestMethod 'http://127.0.0.1:18683/v1/environments/test/namespaces' -Headers @{Authorization="Bearer $env:SITOO_TEST_TOKEN"}
Remove-Item Env:SITOO_TEST_TOKEN
```

成功示例`{namespaces:[{name:'team-tools',kind:'organization'}]}`。使用development凭据访问test得到403 ENVIRONMENT_FORBIDDEN；撤销后同一原文访问得到401。不重新创建令牌掩盖已撤销状态。角色降级会注销旧会话，重新登录才能读取当前权限。


[文档首页](/) · [接口导航](/reference/) · [身份与组织](/center/identity)

## 项目与测试发布接口

服务0.2.0，schema2，启用受邀测试发布后才开放；完整操作示例见[项目与测试发布](/center/publishing)。


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



## 目录与渠道

目录模块0.3.0起、schema3起，须平台启用catalog配置；操作见[目录与测试安装](/center/catalog)。目录GET允许会话、只读目录Bearer或匿名public；失效Bearer不能退回匿名。其余写请求仍Cookie+Origin+CSRF。

| 方法/路径 | 输入与输出 |
| --- | --- |
| GET `/v1/catalog` | channel=test或stable（默认test）、q最多100字符；items含id,type,name,packageId,author,license,sdk,visibility,release,version,sha256,channel,environment:test |
| GET `/v1/catalog/:project/releases/:release` | 同channel；当前可见候选root与packages完整闭包（id,manifest,sources,sha256,attestation） |
| GET `/v1/catalog-trust` | 当前可见命名空间keys、environment:test；须确认平台来源，不自动信任包内公钥 |
| GET/POST `/v1/catalog-credentials` | 元数据查询；创建201 {id,token,expires,environment:test,scopes:[catalog:read,release:download]}，7天 |
| DELETE `/v1/catalog-credentials/:id` | 本身份当前范围撤销，{revoked:true} |
| GET `/v1/projects/:project/catalog-settings` | 当前可读项目；visibility,channels,withdrawals |
| POST `/v1/projects/:project/visibility` | {visibility:private或organization或public}，需当前项目写权限；organization限组织项目 |
| POST `/v1/projects/:project/channels` | {release,channel:test或stable,percentage:0–100整数,paused:boolean}；原release、previous、channel、sha256、attestation |
| POST `/v1/projects/:project/withdraw` | {release,reason:1–1000字符}；withdrawn:true、existingInstallations:preserved、originalTasks:preserved |
| POST `/v1/projects/:project/rollout` | {channel,enabled:boolean}；当前可见项目，optedOut:enabled，仅本身份选择 |

401凭据失效；403scope/职责/CSRF；404不可见、缺依赖、过期或撤回候选；409 DEPENDENCY_NOT_PUBLIC/TEST_CHANNEL_REQUIRED；400输入/预算；503脱敏存储故障。health按实际启用模块返回0.1/0.2/0.3/0.4与schema，session新增catalog布尔标记。


[文档首页](/) · [目录与测试安装](/center/catalog)

## 发布CI支持与反馈

[本地CI、诊断与反馈](/center/ci-support)。显式support模块依赖目录/发布，数据库schema4；session返回support布尔值，所有HTTP响应X-Request-Id，错误error增加requestId。GET `/v1/projects/:project/diagnostics?requestId=&release=` 返回requests[{id,at,release,stage,status,code}]，实时项目权限，最近100条/总保留20000条；仅可信项目操作记录，无请求体/源码/URL/堆栈/用户理由。GET/POST `/v1/projects/:project/feedback` 摘要/创建{title,description,requestId?,release?}（201）；GET/PATCH `/v1/projects/:project/feedback/:ticket` 正文/事件或{revision,state,reply?}，answered要求reply。组织owner/admin或个人owner处理/答复，创建者/管理者仅answered后关闭；Cookie/Origin/CSRF、私有项目权限每次复查。409 TICKET_CONFLICT/TICKET_STATE_CONFLICT，400 SENSITIVE_CONTENT。工单为主动提交最小复现，勿含客户数据；平台审核者不自动取得工单权限。诊断落库失败不撤销业务提交，恢复查询原发布。

## 显式生产身份配置

这是自托管配置能力，不是已部署的生产入口。操作者必须独立登记HTTPS origin/issuer、机密clientId、clientSecretFile、invitedSubjects和tls.certFile/keyFile，使用空目录生产数据库；回调固定origin+/auth/callback。身份服务discovery须声明client_secret_post，秘密至少32字符，只由服务端读取，不能放Git、包或截图。默认配置仍为development，本地开发客户端标识和HTTP开发身份服务不能作为生产配置使用。

数据库绑定环境、issuer、origin和clientId。旧schema1–4仅开发兼容，不能自动提升生产；生产身份schema5阻止旧服务打开。错环境/issuer/来源/clientId启动拒绝且不迁移旧数据。TLS必须校验证书链与主机名；有私有身份CA时显式配置identityCaFile，不关闭全局校验。documentationUrl可选，生产只接受HTTPS文档地址；未配置时隐藏文档外链。

生产publishing/catalog/support配置当前拒绝，不能借生产身份配置获得签名、项目提交或目录权限。删除受邀身份后需操作者重启，服务持久撤销其会话、命名空间凭据及既有项目/目录凭据，重新邀请不复活旧秘密。配置热更新和远端身份禁用事件同步未提供。

生产身份接入与外部部署须分别验证；本机HTTPS夹具不能证明真实生产身份或外网部署可用。部署资源、身份策略及生产发布支持由操作者明确告知。

开发部署可显式配置isolatedSessionCookies:true，使Cookie名按origin/client区分，适合一个浏览器同时访问多个本机开发中心；省略时sitoo_center/sitoo_login保持旧兼容。生产Cookie始终独立且Secure，不能通过此选项降级。


生产发布、密钥管理和独立目录安装见[生产发布指南](/center/production-publishing)。中心0.6.0、发布工具0.3.0、开发Desktop0.0.34；SDK0.0.11保持兼容。生产新业务执行与实际托管尚未开放；既有受邀测试环境保持原版本。

## 生产发布与密钥HTTP

| 操作 | 契约与权限 |
| --- | --- |
| GET/POST /v1/environments/production/projects/:project/submissions | production项目Bearer，只允许查询/提交；旧test凭据不能跨环境 |
| GET /v1/signing-keys | key-manager会话；{keys,audit}，audit最近100条，不含私钥 |
| POST /v1/signing-keys/:keyId | key-manager/Origin/CSRF；{operation:activate或retire或revoke,reason}，返回{keyId,state} |
| POST /v1/projects/:project/channels | production渠道仅publisher；已审核签名release及percentage/paused |
| GET /v1/catalog-trust | 当前可见命名空间公钥；会话或只读目录Bearer，不自动授予新键信任 |

生产签发沿用原publish路由，返回environment:production；同版本内容与envelope不可变。KEY_REVOCATION_PERMANENT、KEY_NOT_STAGED为409；签发SIGNING_KEY_UNAVAILABLE为503，激活时为409；错误渠道400。依赖/签名已失效时目录不发现，下载404。配置或历史绑定错误启动拒绝。完整参数、示例与恢复步骤见[生产发布指南](/center/production-publishing)。
