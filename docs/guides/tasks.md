# 任务与恢复

提交前保存requestId。相同请求标识与参数用于去重；更换参数或包身份可能被拒绝，不能把重新生成ID当成恢复。

| 状态 | 应用应做什么 |
| --- | --- |
| needs-approval | 等待可信确认，展示原任务计划 |
| queued/running | 查询原任务，不重复提交 |
| completed | 读取经过验证的原结果/产物 |
| failed/cancelled | 展示明确失败或取消，不声称上游已回滚 |
| unknown | 保留原任务与关联，交由可信宿主核对原结果 |

任务状态集合以各服务返回类型为准。页面关闭只停止监听，不取消已执行的上游。网络超时或进程退出不证明服务未执行、未计费。能力租约pin保持原依赖可用；结果未知时不得擅自释放或回收。


## 不同任务不能共用一套状态推断

| 接口 | 原关联 | 查询/完成判定 |
| --- | --- | --- |
| 静态文本 | requestId 等于文本 task.id | text.getTask；completed 才使用 text/value |
| 静态图片 | 提交前 requestId；返回后 task.id | images.getTask/listTasks；completed 后读产物 |
| 应用 Agent | send.requestId 与当前 sessionId | agent.getState/messages；ready/error 结束本次等待 |
| 共享能力 | 原 requestId 与宿主 taskId、精确 binding | 能力客户端的 get(taskId) 或开发 HTTP 原任务查询，检查 outcome |

状态表是概念对照，不表示每个接口都存在这些枚举。共享协议还有[持久任务类型](/reference/tasks)，文本/图片以[App SDK 类型](/reference/sdk)为准。

## 中断后按原记录恢复

1. 提交之前保存 requestId、业务参数；成功响应后补存 taskId 与原绑定信息。
2. 页面关闭、超时或账户切换后，重新登录并打开原应用；读取原草稿和本应用任务列表。
3. 有 taskId 就查原任务；文本可以用原 requestId 直查。图片没有此直查接口，先使用列表与可信宿主确认关联。
4. queued/running/needs-approval 继续等待或原任务确认；不要提交新业务。unknown 交给可信宿主核对原上游，查询失败继续保留 unknown。
5. 只有用户理解原结果与费用后，明确选择“新生成”，才创建新 requestId；这不是恢复原任务。

取消要区分：停止页面订阅、停止应用 Agent 回复、取消共享任务、取消上游请求是不同操作。共享任务已派发取消也可能保留执行租约；画像服务 cancellation=false。旧任务保留包摘要和依赖 pin，可信宿主不得借回收代码绕过活动任务保护。

成功、失败、unknown 都应提供原关联给可信排错，日志仅记录安全 ID/状态/错误码，不包含令牌或完整用户输入。查询是只读动作；即使原宿主 unavailable，也不要通过再次生成来“检查服务是否恢复”。完整原任务示例见[共享应用教程](/getting-started/quickstart)和[HTTP 参考](/reference/http)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)

## 断网、存储满与宿主退出

网络请求发出后丢失响应，可能已经产生上游副作用。保持原requestId/taskId，查询原记录；unknown不是失败，不换编号重新收费调用。原任务会继续占非终态预算并保留原版本pin，影响更新/卸载时应先核对原任务，不能删账本释放容量。

SQLite写满时宿主停止新执行；close即使无法写下unknown也会中止本地信号并关闭库。重启按最后持久running/queued保守恢复原任务，不能从“未看到结果”推断未执行。共享任务库与配额库必须一致保留，缺表/换协调实例拒绝恢复；不要复制单库后继续生成。资源限制终止进程也遵循这些规则。参见[可信任务接口](/reference/tasks)、[宿主资源边界](/capabilities/host)。
