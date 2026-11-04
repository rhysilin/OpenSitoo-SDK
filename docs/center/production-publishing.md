# 生产发布与签名键管理

[文档首页](/) · [项目与测试发布](/center/publishing) · [目录与安装](/center/catalog) · [中心HTTP](/reference/developer-center) · [下载工具](/downloads)

中心/服务0.6.0、发布工具0.3.0、Desktop0.0.34、SDK0.0.11。生产发布需要运营方提供独立HTTPS服务与受信身份；本站未提供已托管生产服务入口。现有test/stable仍是测试渠道。生产客户端目录、下载、安装和授权使用独立生产目录；新业务执行暂不开放，不能用测试开发宿主执行production安装。

## 配置与迁移

先完成[身份配置](/center/identity)。production必须独立数据库、可信issuer/client、TLS与机密客户端秘密文件，不能沿用test数据库或原单键publishing配置。数据库schema5启用生产发布后迁移到6；开发库仍1–4。旧程序拒绝6，回退须使用独立备份；不要改schema版本号，也不要用渠道回退代替数据恢复。

下面仅是publishing配置片段，合并到可信部署配置；路径、时间戳和身份由运维填写，秘密不进入项目仓库：

```json
{
  "platformRoles": {
    "trusted-reviewer-sub": ["reviewer"],
    "trusted-publisher-sub": ["publisher"],
    "trusted-operator-sub": ["key-manager"]
  },
  "publishing": {
    "environment": "production",
    "keys": [{
      "keyId": "production-2026-01",
      "privateKeyFile": "C:/Sitoo-private/production-2026-01.pem",
      "notBefore": 1791676800000,
      "notAfter": 1823212800000
    }]
  },
  "catalog": true
}
```

私钥要求Ed25519；最多16把配置键，keyId、公钥和有效期不可修改，所有历史键保留在配置中。实际访问目录信任组合最多32项（keyId按命名空间派生）；超限拒绝而非截断。私钥只由平台服务与受信运维保管，不能上传到项目、目录或浏览器。文件权限、备份与实际秘密托管按目标部署核验，当前没有HSM或自动秘密托管。

## 从提交到推广

开发者先申请命名空间并创建项目。在生产中心签发的项目凭据仅允许对应production项目查询/提交，有效7天；不授予审核、签名、密钥管理或组织管理权限。测试凭据不能跨库使用。CLI缺省仍test；生产须显式写环境和HTTPS地址：

```json
{"origin":"https://developers.example.com","environment":"production","tokenEnv":"SITOO_PUBLISH_TOKEN"}
```

```powershell
# 秘密从安全环境注入；不写进命令、配置或CI日志。
node C:/Sitoo/ecosystem-tools/sitoo-publish.mjs submit ./dist <project-id> publish.json
node C:/Sitoo/ecosystem-tools/sitoo-publish.mjs status - <project-id> publish.json
```

上传的是原目录包，服务不执行上传代码。提交者不能自审；批准摘要之后由不同身份publisher签发，再由publisher将原release推广到production渠道。生产没有test→stable→production捷径。项目所有者可调整可见性和撤回，不能仅靠项目所有权推广生产。签发前再次验证提交者/审核者权限、原摘要和依赖。依赖必须可解析且受信，目录闭包缺失或失效时不返回该应用。

同版本同摘要重复提交返回原记录，内容变化报VERSION_IMMUTABLE。签名与记录单一事务落盘；提交前中断回滚，提交后重试返回原envelope，即使原键后来撤销也不会重新签发旧版本。查询历史签名不表示它仍可安装或执行；恢复需新版本重新审批。

## 密钥引入、轮换与恢复

1. 运维生成独立新键，追加keyId、私钥路径和有效期后重启服务。新键为staged，不签名、不进入客户端信任导出。
2. key-manager在中心激活新键。原活动键自动retired；退役键仍可在有效期内验证旧签名，但不能再次激活签发。
3. 操作者从可信平台确认新键与命名空间，在客户端断开后重新连接，明确确认包含历史键和新键的信任配置。不会从包里自动信任新公钥。
4. 泄露时永久revoke。服务/客户端拒绝新安装和授权；不能以重启、配置回退或旧批准复活。恢复追加全新材料/keyId，激活并提交新版本。

每次操作记录actor、时间、操作、keyId及原因。GET /v1/signing-keys仅key-manager可读，包含公钥元数据和最近100条密钥审计。POST /v1/signing-keys/:keyId输入{operation:activate|retire|revoke,reason}，成功返回{keyId,state}。会话Cookie、Origin和CSRF照常验证。签名最长7天，并且expiresAt不超过键notAfter；到期时拒绝，无宽限期。

运维CLI复用实际生产会话，项目凭据不能代替它；会话仍受30分钟闲置/8小时绝对有效期约束。会话Cookie只通过安全环境变量交付给受信操作者，不提供给应用或CI项目脚本：

```json
{"origin":"https://developers.example.com","environment":"production","sessionEnv":"SITOO_OPERATOR_SESSION","reason":"计划轮换签名键"}
```

```powershell
node C:/Sitoo/ecosystem-tools/sitoo-publish.mjs keys list - operator.json
node C:/Sitoo/ecosystem-tools/sitoo-publish.mjs keys activate production-2026-02 operator.json
node C:/Sitoo/ecosystem-tools/sitoo-publish.mjs keys revoke production-2026-01 operator.json
```

CLI不登录或保存会话；优先通过中心界面操作。未知键、失效期报SIGNING_KEY_UNAVAILABLE/NOT_FOUND；撤销恢复报KEY_REVOCATION_PERMANENT；更改/删除历史绑定启动时拒绝SIGNING_HISTORY_REQUIRED/SIGNING_KEY_IMMUTABLE。无活动键时签发暂停，批准记录保留，修复后查询原记录再重试。

## 客户端与撤回

开发客户端用独立user-data目录启动，并显式设置PI_MARKET_SHARED_ENVIRONMENT=production。当前支持生产目录连接、完整闭包下载、安装/更新/授权；此环境的新业务执行仍关闭。普通应用无法获取目录秘密；真实产品秘密使用Electron系统安全存储。新账号不能继承他人连接或安装。production只允许HTTPS及production信任；test/stable请求拒绝。

每次生产管理操作从原HTTPS目录刷新已确认信任，只能收紧/撤销同材料绑定；新公钥需重新确认。网络、凭据或目录失效时拒绝新操作，不退回离线缓存。断开保留安装、业务数据和原任务。更新不自动授权新权限，撤权记录不会因回滚/恢复签名而生效。

撤回后目录不再发现/下载，客户端缓存不能形成新安装。已有合法安装的只读检查及原任务历史保留，仍须区分当前信任：签名已到期/撤销的安装不能用于新执行。撤回不会删除原数据或任务；撤回标记永久保留，重新开放需新版本。生产执行与完整托管验证尚未开放时，不能从只读历史查询推断业务可运行。
