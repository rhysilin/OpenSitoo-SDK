# 应用发布物

## 已安装应用读取（开发宿主 0.6.0）

`GET /v1/application` 无路径参数和查询参数，使用现有 `Authorization: Bearer <本地开发令牌>`。仅 host.json v3、application 消费入口、active 持久授权且当前安装根包含 static-application-v1 时可读。v1/v2、conversation 入口或仅能力根返回 403 FORBIDDEN；没有或错误令牌为 401。0.7.0 允许精确宿主 Origin，拒绝 null/外部 Origin 与外部 Host，无 CORS。此资源接口返回数据；执行容器另见[页面手册](/capabilities/pages)。

成功 200，响应 `{ok:true,value:{applicationId,packageId,version,sha256,entry,files}}`。sha256 是签名清单摘要；files 为清单中的 `{path,bytes,sha256,source}` 数组，source 是校验后的 UTF-8 字符串。只包含顶层应用资源，不包含依赖 Guest 源码、凭据、宿主路径或管理配置。响应为 `application/json; charset=utf-8`，no-store、nosniff；HTML/JS 作为数据返回，不在宿主执行。

每次读取重新加载当前完整安装并验证文件摘要、签名/有效期/撤回和应用身份，复核原授权快照与启动时完整安装计划。撤权或授权修订、信任撤回、内容篡改、更新、卸载均拒绝旧读取；页面更新即使保持能力绑定也拒绝。可信操作者重新启动宿主才采用新计划；如果能力绑定变化，还须先显式更新持久授权。合法信任文件无法读取/解析等宿主异常返回 503 UNAVAILABLE，不披露路径或堆栈。多消费者各自读取自己的根，没有 applicationId 切换参数。


## 格式与边界

`StaticApplicationPackageManifest`，与原 `CapabilityPackageManifest` 组成 `InstallablePackageManifest`。`VerifiedCapabilityPackage.manifest` 接受两者，原内容校验/目录读取、署名、离线发布和安装方法均复用。文件名仍为 `capability-package.json`，以 execution 区分类型；旧工具拒绝新类型，升级独立工具后才可处理。

```json
{
  "formatVersion": 1,
  "execution": "static-application-v1",
  "packageId": "bob/app",
  "version": "1.0.0",
  "application": { "applicationId": "bob.shared", "entry": "index.html" },
  "dependencies": [{ "packageId": "bob/consumer", "range": "1.0.0" }],
  "capabilities": [],
  "files": [{ "path": "index.html", "bytes": 123, "sha256": "填入真实64位摘要" }]
}
```

示例中的 bytes/sha256 是占位，不能直接发布；参考项目的 `application.mjs` 会根据实际文件生成。version 为规范 SemVer；依赖使用既有范围解析，最终安装的是完整精确闭包。

所有字段严格校验。application 恰含 applicationId/entry；ID 长度最多 128、由小写字母开头且只包含小写字母/数字/点/连字符，必须以包 namespace 加点开头。entry 必须是已声明的 `.html` 文件。capabilities 必须为空，应用不能携带 Guest 执行函数。业务实现独立发布为能力依赖。

页面内容限 UTF-8 `.html/.css/.js/.json`；相对路径、大小/文件数量预算、摘要、大小写冲突、符号链接和多余文件等按[包内容规则](/capabilities/packages)校验，根清单文件不能同时列为 payload。拒绝二进制、任意原生后端及未声明文件。`sources` 字段对应用表示已验证文本 payload，不能据字段名称把它送入 Guest 执行器。


## 根与依赖

应用只能作为安装计划的**唯一顶层根**；不能作为另一应用或能力的依赖。应用 applicationId 必须与可信根中的 applicationId 相同。多个应用分别使用不同安装根，共享相同能力内容，不共享授权、任务或数据。

非法类型、字段、入口、路径或 payload 返回 INVALID_INPUT，预算错误保持既有规则；应用作为依赖解析为 CONFLICT，应用/安装根身份不符、混合根或剥掉应用的更新为 FORBIDDEN。CLI 与模块均使用既有安全错误封装，不返回源码、凭据或本机路径。

prepare/commit 在同一 SQLite 安装库原子提交应用及完整能力闭包；有任一缺失、冲突、签名/身份失败时，不暴露半个应用。读取安装/租约时重新验证当前信任、完整精确计划和应用身份。更新不能将已有应用换成能力根；原能力根仍支持旧方法以保持兼容。

页面发布物不产生 CapabilityBinding；调用 binding 来自依赖能力。任务租约快照仍保存完整计划，包含应用发布物与所有依赖，因此任务进行中、结果 unknown 或已分派取消时不能更新/卸载根。当前授权、权限审查、代码回收与独立数据迁移规则均保留，安装不自动授权或迁移数据。


## 从生成项目获得有效发布物

本页 JSON 展示格式，不可直接安装。实际文件由[共享应用教程](/getting-started/quickstart)的 app-a/build.mjs 生成：输出目录中 capability-package.json 声明入口及文件摘要，HTML/JS/CSS 必须保持原字节，之后 inspect、签名、发布与安装。app-a 的 applicationId 为 starter-a.product，安装 root.applicationId 使用同一值。

读取成功只证明当前身份能取得已校验资源；开发容器还会执行页面约束。HTTP 没有让调用者指定另一 applicationId 的参数。更新页面、改依赖或改授权后，原页摘要和完整计划会失效，操作者核对后重新启动宿主，不使用历史 GET 输出作为新安装凭证。完整请求例子见[HTTP 参考](/reference/http)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
