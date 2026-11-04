# 目录与测试安装

服务0.4.0、Desktop0.0.33、独立宿主0.20.0、共享工具包0.36.0、SDK0.0.11，适用于受邀本地测试，生产环境尚未开放。

[文档首页](/) · [项目发布](/center/publishing) · [HTTP参考](/reference/developer-center) · [下载工具](/downloads)

## 发现和可见性

平台在原发布配置中显式设置`catalog:true`，使用schema3。新项目默认private：个人项目仅当前所有者可见；组织私有项目限当前owner/admin或项目创建者。organization仅限当前组织成员；public对匿名可读。私有项目不通过项目列表、目录搜索、下载或依赖错误泄露。初次迁移schema2时旧组织项目保留原组织可见性，后续重启不改变选择；schema3不允许关闭目录后绕过权限。

先发布完整能力依赖，再在项目界面推广test渠道；应用随后发布并推广。目录仅返回依赖闭包可读取、未撤回、签名未过期的候选。公开应用前先公开依赖；后续依赖变私有或撤回，会使应用从不具备权限的目录消失。摘要与签名仍按原发布保存，不自动修复、重新签发或替换依赖。

## 渠道和版本操作

test与stable都是测试签名环境。stable表示稳定测试候选，**不表示production**。同一发布号推广到stable前须先位于该项目test渠道；操作不重建包、不更改摘要/签名。百分比0–100按可信身份与项目计算固定分组，同一身份重复请求保持一致；暂停或主动退出回到该渠道此前发布，没有此前版本则不返回候选。匿名公共读取使用统一匿名分组，不能当成独立用户灰度。

撤回需要发布号及原因，阻止后续发现/下载/新安装。保留原发布、摘要、审核、审计和安装根；已安装应用及原任务不被远端删除。原任务查询不重跑，活动/unknown任务仍锁定原版本。已安装版本失去信任或签名到期时正常可信验证仍可阻止新执行，不用撤回策略绕过信任。

## 只读目录凭据

中心当前范围创建目录凭据，有效7天，仅`catalog:read`和`release:download`；秘密只展示一次，列表仅返回元数据。它不同于项目提交凭据、命名空间凭据、New API模型令牌。撤销、成员移除/角色变更立即拒绝下一次请求。凭据不用于组织修改、审核或发布；Cookie写操作仍需要Origin与CSRF。

```powershell
# 从安全凭据配置设置，不写入包、Git、命令参数或报告。
$headers = @{Authorization="Bearer $env:SITOO_CATALOG_TOKEN"}
$catalog = Invoke-RestMethod 'http://127.0.0.1:18683/v1/catalog?channel=test&q=your-team' -Headers $headers
$item = $catalog.items | Where-Object type -EQ application | Select-Object -First 1
Invoke-RestMethod "http://127.0.0.1:18683/v1/catalog/$($item.id)/releases/$($item.release)?channel=test" -Headers $headers
```

成功下载返回root元数据与packages完整闭包，每个包包含manifest、sources、sha256、attestation。客户端必须再次调用公共包/签名验证器，不能只相信HTTP200或下载摘要。坏Bearer返回401，不退回匿名公开读取；不可读取的项目/发布返回404。

## Desktop测试接入

仅未打包开发版在显式`PI_MARKET_SHARED_ENVIRONMENT=test`时显示“测试目录连接”。默认development与原用户资料保持；为本次测试选择新的`--user-data-dir=<独立绝对路径>`。启动入口与构建方式见[环境与工具](/getting-started/setup)。

1. 使用正常Desktop账户登录，进入应用市场。
2. 从可信平台取得中心origin、当前范围只读目录凭据、公钥JSON。origin允许HTTPS或本机HTTP，不跟随重定向。
3. 打开“测试目录连接”，填写三项，选择test或stable，明确确认命名空间和公钥来源，再连接。公钥可在中心“目录与安装”查看，仍须确认平台来源；包附带公钥不成为信任。
4. 点击“检查并安装”，确认精确闭包；安装本身不授予权限。分别确认页面与对话入口授权后打开业务。
5. 更新先检查精确新版本；取消不切换旧安装，新增权限不自动授予。活动任务阻止切换/卸载；查询或明确处理原请求后再操作。

Desktop把目录授权绑定当前可信New API账户资料范围，通过safeStorage加密保存秘密，不向应用桥提供。中心OIDC sub与New API数字账户不是自动同一身份，连接是显式只读委托，不提升中心角色。账户切换使旧异步响应与待确认草稿失效。

目录失效/离线/断开时缓存不用于新安装，仍显示已安装版本，可查询原任务或明确卸载；断开不自动撤销中心令牌，中心需另行撤销。重新连接可以追加可信命名空间公钥，不能移除/修改旧安装的公钥策略。服务新签名kid绑定单一命名空间；旧base-kid跨命名空间发布不能合成同一信任策略，须单命名空间消费或发布新版本，原发布字节不改。

独立Node宿主0.20.0的已签名v3配置同样支持test，并复用相同安装/授权/任务契约。旧v1源码夹具及v2显式grants仍限development，不支持生产网关。

[文档首页](/) · [HTTP参考](/reference/developer-center) · [版本范围](/getting-started/compatibility)

[受邀测试完整流程](/center/invited-testing)：双开发者共同能力复用、独立安装与原始记录。


生产发布、密钥管理和独立目录安装见[生产发布指南](/center/production-publishing)。中心0.6.0、发布工具0.3.0、开发Desktop0.0.34；SDK0.0.11保持兼容。生产新业务执行与实际托管尚未开放；既有受邀测试环境保持原版本。
