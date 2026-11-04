# 独立页面

## 打开页面

启动已安装开发宿主后，在其 loopback URL 打开 `/development`。输入可信操作者已在 host.json 配置的应用开发令牌，点击“打开应用”。页面容器读取 [GET /v1/application](/capabilities/artifacts)，只打开该消费者的当前签名安装根。令牌只保留在外层容器内存，输入框随后清空，不进入应用 HTML、消息或本地存储。

`GET /development` 与 `GET /development/client.mjs` 无令牌、无查询参数；返回固定容器与可信脚本，不返回配置或用户数据。均 no-store、nosniff，容器带 CSP、no-referrer、设备权限关闭及 frame-ancestors none。应用资源仍需 bearer 与 application 入口的持久授权。

应用运行在 `sandbox="allow-scripts allow-forms"` 的不透明 iframe，没有 allow-same-origin、弹窗、顶层导航或设备权限。allow-forms 仅使应用表单事件可处理，CSP form-action none 阻止实际表单提交。应用不能访问父窗口 DOM、同源存储或直接联网；connect-src、frame-src、worker-src、object-src 均为 none。签名经典脚本通过 nonce 执行，内联事件属性未开放。

父窗口 nonce 策略与子页面仅内联 script-src-elem 策略共同约束脚本；即使应用读取自己的 script nonce，也不能据此加载外部脚本。真实 Chromium 验证报告记录 CSP 阻断而非仅依靠 HTTP 拒绝。

当前支持入口 HTML、相对路径引用的已签名 `.js` 同步经典脚本和 `.css` 样式，以及 HTML 内经典 script/style。容器从签名资源中取内容，不请求未安装资源；拒绝外部脚本/样式、带 query/hash 的引用、缺失资源及 module/async/defer script。移除 base、应用 CSP/refresh meta 和嵌套容器。图片、字体、动态 import、fetch、Worker 与 JSON 文件读取没有开放。此受限开发容器不能替代生产浏览器安全或完整 Web 应用托管。


## 任务桥契约

应用只调用实验性 `window.sitooDevelopmentTasks`。方法返回 `Promise<ProtocolValidation<...>>`，复用 [持久任务](/reference/tasks) 与 [协议](/capabilities/protocol) 的真实输入和结果：

| 方法            | 参数                                                            | 成功 value                         |
| --------------- | --------------------------------------------------------------- | ---------------------------------- |
| submit(request) | CapabilityRequest，protocolVersion/requestId/capabilityId/input | DurableTask                        |
| get(taskId)     | 原任务 ID                                                       | DurableTask                        |
| cancel(taskId)  | 原任务 ID                                                       | DurableTask                        |
| list()          | 无                                                              | 当前消费身份的默认分页任务快照数组 |

没有注册、授权、消费者切换、配置、密钥、收费批准、reconcile 或管理方法。宿主继续检查 schema、入口、精确绑定、grants、任务所有权和租约；页面不得通过 input 提供 session 或更换 scope。业务代码仅由原 QuickJS 能力执行，不在容器复制。

外层容器以已打开应用的清单摘要发送 `X-Sitoo-Application`，服务器每次复核完整应用计划、签名和原授权快照。携带该头但格式/摘要/应用状态不符为 403 FORBIDDEN。v3 任务路由允许精确宿主 Origin；有 Origin 的任务请求必须有有效摘要。null、外部 Origin、外部 Host 仍拒绝；v1/v2 不开放浏览器任务调用，原无 Origin CLI 保持兼容。提交体读取后再复核一次，避免读体期间更新沿用旧页面状态。

消息通道只接受当前 iframe 的 null Origin 与随机 channel；完成握手后使用专有 MessagePort。旧页面关闭/替换即关闭端口、移除 iframe、终止容器的 HTTP 等待，不取消或释放已提交持久任务。更新、撤权、信任失效和卸载后已打开页面不能继续经桥调用；需要可信操作者更新授权并重启宿主，再重新打开页面。原任务及 unknown pin 按原任务服务保留。

每页最多 32 个待答桥请求、单消息最多 65536 个序列化字符；服务器继续限制 HTTP 体为 64 KiB。每页通道最多处理 1024 个不同消息 ID，超过后拒绝，重新打开才建立新通道。桥等待 10 秒超时抛出 Error，不自动重发；父容器传输失败返回 UNAVAILABLE。请保留 requestId/taskId，查询原任务；超时或关闭不代表业务回滚。


## 原任务查询（宿主 0.11.0）


已关闭或重新打开页面后，原任务仍保存在宿主。新的客户端使用 get(taskId)/list 查询自身历史，不自动 submit；任务的原 binding 不因页面更新而替换。撤权或卸载后，新的执行会拒绝，原结果只读查询仍受原身份约束。可读不代表有权再次执行。

## 使用能力 SDK

推荐从下载 SDK 的 capabilities 入口建立客户端；transport 由可信容器提供，应用不自己实现带令牌的 HTTP。旧 sitooDevelopmentTasks 是开发桥，不是生产公共身份管理接口。完整可运行页面已由[共享应用教程](/getting-started/quickstart)生成；接口方法为 submit/get/cancel/list/artifact/dispose，见[能力 SDK](/reference/capabilities)。

页面应保存原 requestId，提交返回 ok=false 时显示安全错误；ok=true 也需检查任务状态及 result.status。get 返回 unknown 时保留原任务，不能改 ID 再提交。页面关闭先停止本地轮询再 dispose；只有可信宿主能核对原上游或批准原任务。

| 页面问题 | 检查 |
| --- | --- |
| 打不开应用 | application 令牌、active 入口授权、唯一静态根及签名有效期 |
| 脚本未执行 | 只支持已签名经典同步脚本，拒绝 module/async/defer 与外链 |
| 更新后旧页拒绝 | 重新核对当前安装和授权，重启宿主后打开新页面 |
| 超时或断开 | 查询原 taskId，不推断取消、不释放 unknown pin |

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
