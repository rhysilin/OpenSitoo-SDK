# 静态应用打包与发布

`.spkg` 是标准 ZIP。根目录 `package.json` 包含 `formatVersion: 1`、`execution: static-platform`、`app`、`bindings`、`files`。工具根据 payload 生成每个文件的尺寸和 SHA-256。单文件上限 16 MiB，总解压上限 32 MiB，最多 256 个 payload 文件；压缩包上限 32 MiB。只允许安全相对路径与普通文件，不允许链接、额外文件和任意安装脚本。

`app` 沿用 SDK 的 RegisteredApp；UI 入口必须是包内 `.html`。能力必须有 JSON Schema 和对应 binding。`text.echo` 返回参数 text。`images.generate` 要求 manifest 和能力均声明 `sitoo_image:generate`，参数使用现有 SitooImageRequest。平台继续处理模型配置、审批、收费请求和作品保存。该调用返回后台任务，不能将提交成功写成图片交付成功。

浏览器使用样例中的 `createAppClient().invoke(capability, parameters, requestId?)`。付费请求遇到超时应保留同一 requestId 并查询实际任务，不能自动换 ID 重试；同一 ID 更改参数会被拒绝。`client.images.getCapabilities()` 查看可用配置，`getTask(taskId)` 查询本应用任务，`getArtifact(taskId)` 取得已保存图片。请求记录保存应用版本、包摘要、参数指纹与平台任务 ID。进度可通过下述 watchTask 轮询订阅；服务端事件推送与通用自然语言 MCP 调用尚未开放。

文本推理 binding 为 `text.generate`，manifest 与能力均声明 `text:generate`。安装确认展示模型费用权限。应用选择 `text.listModels()` 返回的已启用平台模型标识，不提交密钥、provider 地址或任意网关；invoke 返回后台任务，按 requestId 查询实际结果。该接口不提供 Agent 工具。具体 schema、输出限制与恢复策略见[应用页面 SDK 参考](/reference/ui)。

## 随包设计资源

在 `sitoo-app.json` 的 resourcePacks 数组声明 SDK AppResourcePack，资源文件放在 payload。工具和安装器校验 targetAppId、appVersionRange、每个资源摘要及包内路径。`client.resources.list()` 返回本应用资源声明，`read(packId, resourceId)` 返回 UTF-8 文本和不可变 snapshot（最多 64 KB）。图片、字体等文件作为本应用静态资源使用，文本桥仅开放设计规则、风格、模板、交付规范、检查表。

## 应用配置与进度

静态 app 可以声明普通 configuration（schema/defaults/version），不能声明凭据槽位。`client.configuration.get()` 返回当前账户配置，`save(revision, values)` 检查 schema 和 revision；更新时不支持的配置迁移会阻止安装，保留旧版。密钥不能写入普通配置。

`client.images.watchTask(taskId, onTask, onError?)` 每两秒查询一次原任务，最多等待十分钟，返回取消订阅函数。它是轮询订阅，不是服务端事件推送；完成、失败、取消和无法查询的未知结果会停止。关闭页面或 dispose 只停止订阅，不取消上游；不得自动重提付费生成。独立 UI 可同时等待多项任务或继续别的操作。

应用决定哪些规则用于本次设计，资源内容始终是业务数据，不能修改平台授权。生图能力 schema 可声明可选 resourcePackId；平台将其记录为快照后从上游参数中移除。切换资源包不会重写历史请求。独立资源包下载/升级市场尚未开放，不把随包资源称为独立分发服务。

## 维护方发布流程

```powershell
node C:\Sitoo-Developer-Kit\sitoo-app.mjs init-market C:\Sitoo-Publisher\app-market C:\Sitoo-Publisher\app-market-private.json
node C:\Sitoo-Developer-Kit\sitoo-app.mjs publish C:\Sitoo-Publisher\app-market C:\Sitoo-Publisher\app-market-private.json C:\Sitoo-Publisher\sitoo-demo.spkg
```

私钥文件必须在公开市场目录之外，不提交仓库。发布工具生成标准 TUF root/targets/snapshot/timestamp 元数据；客户端使用官方 `tuf-js` 验签、检查有效期和回滚。默认元数据 7 天过期，发布者必须定期重新发布；root 为 1 年。当前工具不支持 root 轮换、多人阈值审批、并发发布和撤回管理，因此正式生产发布前仍需运维工具完善与密钥轮换演练。

目录托管复用更新服务器：将 app-market 的 metadata、targets 放到服务器的 `apps/` 下。可信 root.json 通过客户端部署配置随客户端交付，不能从不可信市场自动建立信任。

```json
{
  "packageCatalogUrl": "http://127.0.0.1:18680/packages/catalog.json",
  "appRepository": {
    "url": "http://127.0.0.1:18680/apps/",
    "trustedRoot": "app-market-root.json"
  }
}
```

用 `PI_MARKET_DEPLOYMENT_CONFIG` 指向这个配置文件，trustedRoot 相对该文件解析。上云时将 URL 改为 HTTPS；root 保持可信配置。应用市场刷新即可看到新上架的包，无需更新客户端。

当前安装使用账户独立记录、不可变摘要缓存和原子注册文件；卸载保留用户数据。不同版本可更新，保留上一已验证包，可回滚；有活跃能力调用或未完成生图任务时阻止更新、回滚与卸载。更新不执行数据迁移，只适用于本版静态包。旧包缓存保留，不自动删除；容量回收、崩溃恢复演练和原生业务执行器不在此静态包格式的支持范围内。

SDK 0.0.9 增加 `/capabilities`，仅用于已提供原任务 transport 的宿主；分发与 Desktop 开发窗口见[能力 SDK 手册](/reference/capabilities)。原 spkg 产品入口保持兼容。


## 先本机检查，再发布市场

先按[静态教程](/getting-started/static-app)完成 create → 编辑 payload → pack 到不存在的输出文件 → check。检查成功显示真实应用 ID、版本与文件数；修改任何文件后重新 pack，不能编辑 .spkg 中单个字节沿用旧摘要。

维护方 init-market 仅建立自己的新市场和私钥，publish 只发布已经检查的包；这是 TUF 静态市场，与[共享目录包签名](/publishing/signatures)的 Ed25519 精确发布接口不同。不能把一类 signature.json 用于另一类市场。示例中的 deployment 配置由客户端操作者提供，应用作者不能改客户端 trustedRoot。

首次安装确认应用权限，更新前处理活动任务和不兼容配置；发布完成不表示用户已安装。断开和失败后检查客户端当前版本与原任务，保留上一可信包，不能重新生成收费业务做探针。读取资源与保存配置分别见[附件资源](/guides/resources)、[配置数据](/guides/storage)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
