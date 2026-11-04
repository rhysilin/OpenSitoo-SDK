# 测试与诊断

独立项目执行公开包inspect和本机CI，验证构建、签名、安装、两个入口、更新以及原任务保留。monorepo可运行pwsh -NoProfile -File .ci/verify.ps1，无需平台源码或安装平台依赖。

逐项保存失败原因，失败后停止发布。只有命令实际完成且返回成功才计通过；源码声明或示例存在不能代替行为测试。费用服务测试需要明确账户与成本授权，不用生产密钥跑无费用示例。

开发日志不能包含令牌、私钥、用户资料或完整数据库。遇到unknown保留原任务、上游关联和包摘要，用原请求查询定位，避免重复生成。


## 显式业务健康检查

health 会真实提交已授权能力并比较业务结果，不是只读 ping，也不自动批准更新。仅对已知无副作用的能力使用；每次用新的健康数据目录和原请求 ID，最多 8 个用例，每项等待最多 10 秒。宿主 v2/v3 的签名安装、当前信任和授权必须有效；该 CLI 不注入原生收费 Provider。

在[共享应用示例](/getting-started/quickstart)中，将下面保存为 `.local/health-cases.json`。consumerIndex=0 对应其 host.json 的第一个应用入口，不是任意账户 ID。

```json
{"formatVersion":1,"cases":[{"consumerIndex":0,"request":{"protocolVersion":1,"requestId":"019c7714-3b77-74d1-9866-e1f484aae2ab","capabilityId":"starter-core/normalize","input":{"text":" hello "}},"expected":{"text":"HELLO"}}]}
```

```powershell
# 先按教程 init，签名须在有效期内；数据目录使用未使用过的 health-run-1。
node C:/Sitoo/capability-kit/sitoo-capability.mjs health C:/dev/hello-ecosystem/.local/host.json C:/dev/hello-ecosystem/.local/health-cases.json C:/dev/hello-ecosystem/.local/health-run-1
```

成功封装 ok=true 的 value 包含 formatVersion/runId/passed/checks；检查结果另存为 `health-<runId>.json`，任务在 health-tasks.sqlite。只有 value.passed=true 且退出码 0 才全部通过。expected 按 JSON 值规范比较，对象键序无影响、数组顺序保留；不把字符串 HELLO 与对象 {text:HELLO} 混淆。

| check.status | 含义与处理 |
| --- | --- |
| passed | completed/success 且业务值等于 expected |
| mismatch | 有真实成功值但不匹配；检查契约与用例，停止发布 |
| failed | 查询、授权或业务明确失败；按安全 error 定位 |
| unresolved | 超过等待窗口或任务非确定终态；保存 taskId/binding，不自动重跑 |

健康报告只含安全关联和状态，不包含 token。不得用 health 再次耗尽实体磁盘或触发收费模型。进程退出也不保证上游取消，unknown/pin 必须保留。

## 本地 CI 与最小交付证据

按[多应用仓库](/publishing/monorepo)初始化后，根目录运行 pwsh -NoProfile -File .ci/verify.ps1；前置为 Node 24 和完整固定 vendor。构建、真实公开 CLI、签名/安装/授权及页面/对话流程以脚本逐项输出为准，不靠文件存在计通过。保留命令、版本、退出码、各项结果及原请求恢复结果；日志脱敏，不公开 .local。

测试失败先定位第一个错误，修复后在新输出目录重验；本地 CI 完成不代表生产账号、真实上游、外网网关或远端 CI 已通过。实用验证器入口见[完整示例](/support/examples)，相关命令见[CLI 参考](/reference/cli)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
