# 共享能力对话

共享能力对话让用户发现本应用已授权的工具，填写参数或由模型生成提案，检查提案后再提交原任务。它调用同一已安装能力，不是[App SDK Agent 会话](/guides/agent)，也不让模型取得授权管理权。

## 前置条件

需要开发宿主 v3 配置、已安装且有效的完整应用/能力计划、conversation 入口授权及该入口专属令牌。按[共享应用入门](/getting-started/quickstart)建立本机示例即可练习手动提案，不需要收费模型。application 令牌和 conversation 令牌不同，不能互相代替。

## 在页面中完成一项调用

1. 启动自己的可信宿主，打开其 /development/conversation 页面。
2. 输入宿主地址和本应用 conversation 令牌。令牌只在可信本机测试环境取得，不放入业务包或公开配置。
3. 页面请求 GET /v1/conversation/tools，展示当前可用工具、输入 schema 和完整计划摘要。
4. 在“手动填写工具参数”选择 starter-core/normalize，填写合法 JSON {"text":" hello "}，点击“校验确定性提案”。
5. 宿主通过 POST /v1/conversation/prepare 校验请求和当前授权，返回 request、binding、planSha256；此时没有创建业务任务。
6. 查看能力、参数和绑定，再明确提交。浏览器提交 POST /v1/tasks 时带 X-Sitoo-Conversation=planSha256；编辑参数、切换连接或授权变更后必须重新校验。
7. 保存原 requestId 与返回 taskId，查询任务直到 completed、failed、cancelled 或 unknown。不要反复请求规划来恢复业务。

## 完整 Node.js 手动提案示例

保存为 C:/Sitoo/conversation-request.mjs，在[入门示例](/getting-started/quickstart)的 serve 运行期间执行。这是本机 CLI 请求，不是页面脚本；令牌从私有示例目录读取。正式环境必须使用操作者提供的凭据来源。

```js
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
const [projectArgument, text = ' hello '] = process.argv.slice(2);
if (!projectArgument) throw new Error('请提供已初始化的项目目录');
const local = join(resolve(projectArgument), '.local');
const { url } = JSON.parse(await readFile(join(local, 'running.json'), 'utf8'));
const token = (await readFile(join(local, 'app-a-conversation.token'), 'utf8')).trim();
// 每次用户主动的新提案创建原 ID；不自动重试或调用收费规划模型。
const request = { protocolVersion: 1, requestId: randomUUID(), capabilityId: 'starter-core/normalize', input: { text } };
const pendingFile = join(local, 'conversation-' + request.requestId + '.json');
await writeFile(pendingFile, JSON.stringify({ request }), { flag: 'wx' });
const call = async (path, body, planSha256) => {
  const response = await fetch(url + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json',
      ...(planSha256 ? { 'X-Sitoo-Conversation': planSha256 } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  const reply = await response.json();
  if (!response.ok || !reply.ok) throw new Error(reply.error?.code ?? '请求失败');
  return reply.value;
};
const tools = await call('/v1/conversation/tools');
if (!tools.tools.some(tool => tool.binding.capabilityId === request.capabilityId)) throw new Error('工具未授权');
const prepared = await call('/v1/conversation/prepare', request);
// 这里的参数固定且无副作用，脚本作者明确选择提交；产品界面应让用户先预览。
const task = await call('/v1/tasks', prepared.request, prepared.planSha256);
await writeFile(pendingFile, JSON.stringify({ request: prepared.request, taskId: task.taskId }));
// 查询原任务；queued/running 不是失败，后续可用同一 taskId 继续查询。
const original = await call('/v1/tasks/' + task.taskId);
console.log(JSON.stringify({ requestId: request.requestId, task: original }, null, 2));
```

```powershell
# 第一个窗口保持 shared-workflow.mjs serve 运行；第二个窗口执行本脚本。
node C:/Sitoo/conversation-request.mjs C:/dev/hello-ecosystem ' hello '
```

输出包含原 requestId 和任务快照，最终结果文本为 HELLO。若第一次查询仍 running，请查询原 taskId，不再执行整份新提案脚本。网络失败时先读取脚本保存的 .local/conversation-&lt;requestId&gt;.json 和本身份任务列表，确认是否已有任务；不能凭超时断言未执行。

## 自然语言规划与费用

POST /v1/conversation/plan 接收 {requestId,text}。可信宿主只有显式启用 conversationPlanner 后才提供规划；普通 serve 不启用，返回 503 UNAVAILABLE。规划结果仍是不可信提案，由原 schema、已授权目录与绑定校验后才可返回。

无费用的 serve-conversation-fixture 只识别“请调用 &lt;capabilityId&gt; 处理：&lt;文本&gt;”，不是任意自然语言模型。其示例参数还包含 childRequestId；不要把它直接用于只接受 text 的标准化 schema。可用当前工具的手动 prepare 方式，或由可信宿主实现匹配声明的规划器。

需要真实模型时由可信操作者提供独立 planner.json，并使用 serve-conversation-model。配置包括 version=1、本机 http://127.0.0.1:&lt;端口&gt;/v1/chat/completions、model 和适用的 apiKey；密钥不放进页面、URL、日志或源码。每次规划可能计费，规划本身不持久去重；失败后可手动填写参数，不自动重新请求模型。

## 身份、确认和恢复

工具目录和计划摘要不是执行授权票据，prepare 不签发新权限。带副作用的可信服务仍会进入 needs-approval，由[可信操作者](/guides/permissions)确认原计划；模型和业务页面不能批准自己的请求。

同源浏览器请求必须满足 Host/Origin 和计划 pin 规则；无 Origin CLI 契约不同，不能照抄为开放跨域 API。原 conversation 任务查询不要求新的当前计划摘要，但仍核对原归属。更改参数或授权后原提案失效，旧任务结果仍关联原绑定。

| 失败 | 下一步 |
| --- | --- |
| 401 | 检查本应用/入口令牌 |
| 403 | 检查入口授权、精确计划/签名与来源约束 |
| 400 | 按当前工具 schema 修正参数，重新生成提案，不篡改原任务 |
| 503 UNAVAILABLE（plan） | 检查是否启用了规划器；可改用手动 prepare |
| unknown 或提交超时 | 保留原关联，查询原任务与可信上游，不换 ID 盲目重跑 |

逐路由参数和错误见[HTTP API 参考](/reference/http)，页面接口见[独立页面](/capabilities/pages)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
