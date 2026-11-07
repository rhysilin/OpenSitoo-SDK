# 兼容应用浏览器宿主

适用于中心0.8.0、Desktop0.0.39、浏览器宿主0.1.0及Windows x64/Node24。当前提供本机HTTPS验证，尚未开放公网托管。

[文档首页](/) · [下载工具](/downloads) · [版本与支持范围](/getting-started/compatibility) · [中心HTTP](/reference/developer-center)

## 下载与启动

从[下载页](/downloads)获取浏览器宿主ZIP。解压到独立目录，需要已安装Node24，无需Desktop源码、Pi或npm安装。随包README描述配置。目录包含独立server/worker、经典页面客户端、QuickJS、Windows Job和中心静态页；不含数据库、私钥、账户或配置。

当前仅接受HTTPS回环origin、production身份/签名配置及显式 `browserHost.profile: "loopback-browser-rehearsal-v1"`。真实域名、OIDC、容量和生产切换另有门禁，不能把此配置解释为公网生产许可。TLS遵循正常证书校验；本机测试证书的定向信任仅属于验收启动器。

在既有生产中心配置中增加以下对象，实际使用绝对路径；中心须启用catalog、dataManagement并配置生产签名键及邀请名单。秘密保留于静态目录之外，配置不能由应用修改。

```json
{
  "browserHost": {
    "profile": "loopback-browser-rehearsal-v1",
    "dataDirectory": "C:/sitoo-private/browser-data",
    "runtimeDirectory": "C:/sitoo-tools/browser-host"
  }
}
```

```powershell
$env:SITOO_CENTER_CONFIG = 'C:\sitoo-private\center.json'
node C:\sitoo-tools\browser-host\browser-server.mjs
```

配置webRoot指向解压目录admin-web。访问origin下 `/browser`，登录生产中心身份，选择个人/组织范围，检查安装并明确确认。安装不会自动授权；页面、对话、程序分别授权，更新后重新核对版本权限。没有合法会话/当前组织成员资格的请求拒绝。

## 兼容矩阵

| 内容 | 当前支持 |
| --- | --- |
| 签名static-application-v1、经典脚本与随包CSS | 支持，精确安装闭包与opaque iframe |
| quickjs-function-v1及能力任务SDK | 支持，原协议/任务归属/请求ID不变 |
| 页面、手动提案、程序消费 | 同源会话路由；各入口独立授权 |
| 模型规划 | 可选本机兼容接口；模型只生成提案 |
| host-service-v1、任意Node/Pi扩展、设备桥、模块脚本 | 不支持并拒绝 |
| App SDK原生桥、图片/产物Provider | 未配置，不支持；不会虚构URL或结果 |
| Desktop托管视图 | 未打包开发版显式入口；同一签名应用与服务端账本 |
| Desktop本地production安装执行 | 仍保持原门禁，不能据托管视图声称已开放 |
| Safari、其他OS、公网托管 | 未验，不声明支持 |

Desktop托管视图目前仅支持未打包开发客户端，尚未提供独立安装包；它不包含在浏览器宿主ZIP中。浏览器部署无需Desktop源码，普通开发者直接使用 `/browser`。托管窗口没有Node桥，也不会隐式沿用New API账户，中心登录独立完成。

## 页面与程序示例

经典页面随签名应用打包能力SDK；桥由宿主注入。现有兼容字段 `sitooDevelopmentTasks` 是消费通道，不是开发Bearer，也不提供安装或审批权限。

```javascript
const client = SitooCapabilitySdk.createCapabilityClient(window.sitooDevelopmentTasks);
const request = {
  protocolVersion: 1,
  requestId: crypto.randomUUID(), // 保存原ID；网络不确定时不要换ID重发。
  capabilityId: 'publisher/echo',
  input: { text: 'hello' }
};
const accepted = await client.submit(request);
if (accepted.ok) {
  const original = await client.get(accepted.value.taskId);
  console.log(original); // 完成、失败、需确认或unknown均以原任务为准。
}
```

可信同源程序先读取 `/v1/session` 的csrf，再调用 `/v1/browser/open` 选择已授权service入口，随后用返回context调用submit/get。会话Cookie保持HttpOnly；不向iframe转发Cookie、csrf或context。完整路由与示例见[中心HTTP](/reference/developer-center)。

副作用任务返回needs-approval；只由可信父页面读取getConfirmation并明确确认，使用原revision批准一次。模型、iframe消息或程序提案不能替用户作决定。可选planningModel只接受显式127.0.0.1 OpenAI兼容接口；密钥仅存服务端。

## 中断、撤权与更新

页面关闭不取消已接受任务；同一账户的其他会话仍查询原账本。断网后不自动提交新请求。实际进程中断的在途任务恢复为unknown，原版本pin保留，更新/卸载拒绝绕过。unknown不是失败重试许可。已有任务不因新的目录推广自动切换版本。

组织切换、退出、成员撤权、会话到期、数据删除、签名撤销和目录撤回均重新检查；旧页面上下文与旧审批revision不可重用。相同归属撤执行权限后仍能只读原任务。授权拓扑改变可能重启同一应用执行进程并保守记录unknown，其他应用不重启；它不代表其他入口授权被撤销。

## 数据运维

中心schema8，旧二进制不得降级打开。运维工具1.1.0识别schema8；1.0.0旧下载保留。宿主目录按部署及actor/组织散列隔离，owner.json仅供可信运维识别归属。中心自助导出包含本范围安装元数据；删除清除中心browser行、使原身份和独立删除登记拒绝访问，但不等于物理清除独立宿主全部文件。

独立宿主账本、授权、安装、共享配额及保留策略须由可信运维登记，停服窗口完成导出/清理；共享配额不能按单用户直接整库删除。见[数据保护手册](/center/data-recovery)。真实生产删除与恢复切换的最终运维责任、容量和保留测量仍待实际部署验收。
