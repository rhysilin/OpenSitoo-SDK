# 开发宿主HTTP

独立开发宿主只监听127.0.0.1，通过本地开发Bearer令牌绑定消费应用与入口；身份、路径和grants不接受调用者输入。生产网关和登录系统不由该开发令牌提供。

```powershell
node C:/Sitoo/capability-kit/sitoo-capability.mjs init C:/dev/host-example
node C:/Sitoo/capability-kit/sitoo-capability.mjs serve C:/dev/host-example/host.json C:/dev/host-data
```

init用于开发宿主示例；正式共享应用用公开包工具及v3持久授权配置接入。serve不会从包自动加载原生Provider，缺少可信服务实现就拒绝执行。

开发页面入口/development和/development/conversation分别消费已授权应用资源和对话契约。参考[HTTP API](/reference/http)；可信集成参数见[服务宿主](/reference/services)。


## 两种初始化的用途

init 创建源码开发示例 host.json，适合检查 Runtime 与基础请求；init-fixtures 另带无费用引用服务和测试确认。它们不是签名安装的生产身份。共享应用使用[入门示例](/getting-started/quickstart)生成的 `.local/host.json` v3，消费者只含 root、entry 和 token，授权从账本读取。

serve 成功输出本机 url，保持该进程运行；Ctrl+C 关闭服务。调用方从各入口的私有 token 文件取得开发凭据，不能复制其他应用 token。`--parent-pipe` 供可信父进程持有 stdin，父管道关闭时宿主沿原 close 路径退出；不向 stdin 发送业务或身份数据。

开发页面、业务任务和操作者入口是不同路由。消费者 GET 原任务不会批准任务；POST 原核对只查上游；确认需独立操作者凭据。完整路由、头、响应和失败见[HTTP 参考](/reference/http)，自然语言模型须显式配置并可能计费，见[共享对话](/capabilities/conversation)。生产登录、外网监听和跨域网关均不由 serve 提供。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)

## Windows x64受限进程

从[下载页](/downloads)取得共享能力工具包0.39.0，完整解压后运行：

```powershell
# 创建无费用示例；只用自己的新目录，不覆盖现有工程。
node C:/Sitoo/capability-kit/sitoo-capability.mjs init C:/dev/isolated-example
# 相同请求/任务协议，在创建Node时加入Windows Job。
node C:/Sitoo/capability-kit/sitoo-isolated.mjs serve C:/dev/isolated-example/host.json C:/dev/isolated-example/data
```

成功仍输出127.0.0.1的url；消费者沿用自己的token和原HTTP任务协议。保持同版sitoo-job.exe、isolation-manifest.json、process-isolation.mjs、worker.mjs及quickjs.wasm；不要单独复制一个脚本。摘要不符、不是Windows x64、资源策略或内核设置不可用会报PROCESS_ISOLATION_UNAVAILABLE，原任务不重跑，也不回退裸Node。数据目录必须是操作者与子宿主都有写权限的本机私有目录，不能通过关权限校验绕过错误。

该模式使用QuickJS的对象/JSON隔离，再以Windows Job限制进程提交内存512MiB、全机CPU25%、一个进程（允许Worker线程），并跟踪可信父进程退出。提交内存、RSS和Guest分配预算不同；达到内核资源限制可能终止整个应用宿主，其原任务恢复unknown并保留pin。Job本身不隔离文件系统或身份，禁止向Guest开放Node对象、任意原生程序或应用提供的Provider。

旧serve仍用于可信本地协议验收。Desktop纯Guest子宿主使用Job；本地原生产品服务仍是可信主进程实现，不应宣称进入Job。Desktop同一Runtime最多保留8个活动或正在启动的应用宿主；超额暂拒绝启动新应用，原任务可以查询。每Job512MiB独立计量，8个Job理论提交上限4GiB，主进程与可信服务另计。生产业务执行尚未开放，这个入口不是生产网关。

## 本机容量参考

当前可信参考预算如下。消费请求不能改数值或路径。

| 对象 | 活动预算 | 非终态预算 |
| --- | --- | --- |
| 同一指定平台配额文件 | 8 | 64 |
| 每租户 / 环境 | 2 | 16 |
| 每可信账户 / 租户 / 环境 | 2 | 16 |
| 每安装 / 应用作用域 | 1 | 8 |

非终态包括unknown及等待确认；不能靠断网/取消未知任务释放容量。多宿主只有显式使用同一可信SITOO_TASK_QUOTA_PATH才共同计量，不声称全机任意进程、多机或多台服务器统一配额。任务最长本地执行看门狗30秒，上游完成与退款不由此保证。详见[持久任务参考](/reference/tasks)。

这些数值是Windows/Node24本机参考配置，已在1/2/4/8路真实Guest和持久SQLite负载下核对；真实应用CPU、桥调用、服务等待和存储速度会改变延迟。服务器容量、连续运行目标与其他OS须在目标环境测量，不能从本机参数推算生产SLO。
