# 开发 HTTP API

适用：开发宿主 0.19.0，Node 24，可信操作者启动的本机 loopback 服务。普通产品的登录、安装管理、私有 IPC 与第三方网关不是本页接口。先按[共享应用教程](/getting-started/quickstart)取得自己入口的开发凭据和实际宿主 URL，再使用本页操作。

## 鉴权、来源与预算

业务请求使用 `Authorization: Bearer <token>`，token 为 host.json 中独立分配的 64 位小写十六进制凭据，绑定应用与 application/conversation/service 入口；禁止把真实 token 写入源码、页面、URL、公开日志。Host 必须精确匹配启动 URL 的主机和端口，无开放 CORS。配置 v1/v2 不提供业务浏览器跨域通道；v3 仅允许精确宿主 Origin，null/外部 Origin 拒绝。

| 头 | 适用与意义 |
| --- | --- |
| Content-Type: application/json | 有 JSON 请求体时使用；请求体不超过 64 KiB，UTF-8 JSON |
| X-Sitoo-Application | application 浏览器任务调用必须携带已打开应用 sha256；原查询允许启动时原页面摘要，写操作复核当前完整计划 |
| X-Sitoo-Conversation | conversation 浏览器 POST /v1/tasks 必需，为 prepare/plan 的 planSha256；手动 CLI 无 Origin 契约不要求此头 |
| X-Fixture-Confirmation | GET/POST 原确认路由的独立操作者凭据；历史开发头名，不是生产审批 API |

GET 原 conversation 任务不要求新的当前计划摘要；主动带过期 X-Sitoo-Conversation 仍会拒绝。所有查询仍核对原身份。开发 server 连接最多 32，headers/request timeout 为 5000 毫秒；HTTP 等待结束不证明上游未执行。

成功响应：`{ok:true,value:...}`；失败：`{ok:false,error:{code,message}}`。code/message 为固定安全协议错误，不包含数据库路径、用户数据、上游秘密或堆栈。HTTP 状态与业务任务状态分开：202 仅表示任务被接受。

## POST /v1/tasks：提交原请求

无路径/查询参数。请求体是[CapabilityRequest](/capabilities/protocol)，严格四字段；先持久化原 requestId，input 必须符合当前能力 schema。

```json
{"protocolVersion":1,"requestId":"019c7714-3b77-74d1-9866-e1f484aae2ab","capabilityId":"starter-core/normalize","input":{"text":" hello "}}
```

成功 202，value 为 DurableTask：taskId、requestId、capabilityId、status、binding、revision、createdAt、updatedAt；可选 result/upstreamTask。queued/running/needs-approval 不是完成。binding 是原 capabilityId/packageId/version/sha256；结果完成时 `result.status=success`，`result.value` 为原 schema 业务值，例如 `{"text":"HELLO"}`。同身份同 ID 同规范请求复用原任务；改参数或原绑定 CONFLICT。当前授权、签名或浏览器 pin 不符 403；输入/schema/任务预算等校验失败 400。提交超时先查询原关联，不换 ID 重试。

## GET /v1/tasks：列出原任务

查询仅允许 limit/offset：limit 默认 50，整数 1–100；offset 默认 0，非负安全整数。成功 200，value 为本消费身份的 DurableTask[]；不是包含总数或 nextCursor 的分页对象。追加任务时分页不是快照。非法参数/额外查询字段 400，身份越权不会返回别人的任务。例子见下方完整脚本。

## GET /v1/tasks/:taskId：查询原任务

taskId 为服务实际返回的原 UUID；无查询参数、无请求体。成功 200 返回原 DurableTask；不存在或其他身份 403 FORBIDDEN，其他任务校验错误 400。它不启动执行、恢复授权或释放 pin。completed 时仍检查 result.status；unknown 保留原绑定交给可信核对。

## POST /v1/tasks/:taskId/cancel：请求取消

原 taskId UUID，无查询参数、无必需请求体。成功 200 返回取消后的 DurableTask；原 owner/状态检查失败按 403/400 返回。取消未派发任务与已派发任务不同，后者无法保证外部副作用回滚，保留原关联和适用租约。不要将 HTTP 200 当成上游未收费的证明。

## POST /v1/tasks/:taskId/reconcile：核对原上游

原 taskId UUID，无查询参数、无必需请求体。仅可信宿主配置了 taskQuery 的能力能核对；成功 200 返回原 DurableTask，任务查询错误 400。服务仅调用原 query，绝不 generate/infer/submit。上游不可查询或结果不确定时返回 RESULT_UNKNOWN，保留 unknown/pin，不制造终态；查询不重新批准已撤销执行权。消费者 Bearer 是原 owner，不是管理身份。

## GET /v1/confirmations/:taskId：读取原确认计划

原 taskId UUID，无查询参数；同时携带消费 Bearer 与独立 X-Fixture-Confirmation。未配置确认或独立 token 不匹配 403。成功 200，value 为 `{taskId,revision,request,binding}`，原任务/状态检查失败 400。读取只是预览，不执行、不签发给模型的权限。

## POST /v1/confirmations/:taskId：批准原修订

同一原任务、同一双凭据、无查询参数。体严格为一个字段：

```json
{"revision":1}
```

revision 必须来自刚读取的真实计划，此处 1 仅为格式例子。成功 200 返回新 DurableTask；任务修订变化或错误状态 400，独立凭据不符 403。批准只能由可信操作者在明确展示原参数、包摘要和费用后发起，不能让页面或规划模型获得操作者 token。

## GET /v1/tasks/:taskId/artifact：读取已完成图片

原图像任务 UUID，无查询参数、无请求体。需宿主提供 taskArtifact，原任务 completed 且 capabilityId 是 platform/generate-image 或 platform/image-request，当前身份有 resource:read，安装/授权/页面 pin 有效。失败 403；成功 200：

```json
{"ok":true,"value":{"mimeType":"image/png","dataUrl":"data:image/png;base64,..."}}
```

dataUrl 中省略号只是展示占位，不能当真实 PNG。实际返回校验 PNG data URL，解码内容上限 16 MiB。读取不会生成、重提或取消图片；缓存失败仅重试读取原产物。

## GET /v1/application：读取签名应用资源

无参数/体。仅 v3 已安装 application 身份可读；成功 200，value 包含 applicationId/packageId/version/sha256/entry/files，files 每项为 path/bytes/sha256/source。source 为校验后的 UTF-8 原页面资源，作为数据返回，不在宿主执行。conversation/能力根/不匹配信任与授权 403。格式、复核和执行容器见[发布物](/capabilities/artifacts)及[独立页面](/capabilities/pages)。

## GET /v1/conversation/tools：发现当前工具

无参数/体，仅 v3 conversation 身份。成功 200：value 为 `{planSha256,tools}`，tools 是已授权 CapabilityDeclaration[]，每项包含 binding、interfaceVersion、inputSchema/outputSchema、permissions、allowedEntries、delegates 和 effects。planSha256 绑定完整安装计划，不签发执行权。不适用入口或授权/计划失效 403。application 令牌不能用于此路由。

## POST /v1/conversation/prepare：校验手动提案

无查询参数。体为严格 CapabilityRequest，例子与 POST /v1/tasks 相同。仅校验当前已授权工具、schema、binding/effects，不创建业务任务。成功 200，value 为 `{request,binding,planSha256}`；参数校验失败 400，入口/计划/授权失败 403。用户查看后才可提交该 request；浏览器提交带原 planSha256。编辑参数后重新 prepare，不修改旧任务。

## POST /v1/conversation/plan：规划自然语言提案

无查询参数。体严格为 requestId/text：requestId 必须小写 UUID（版本位 1–8、RFC 变体）；text 长度 1–8192 字符。

```json
{"requestId":"019c7714-3b77-74d1-9866-e1f484aae2ab","text":"请将 hello 规范化"}
```

只有可信宿主显式启用 conversationPlanner 才提供模型/夹具；未启用 503 UNAVAILABLE。成功 200，结构与 prepare 相同，模型提案仍经过当前工具 schema 校验；格式/非法能力提案 400，规划期间计划/授权变化 403，规划异常/等待失败 503。规划不持久去重，每次可能计费；失败可改手动 prepare，不自动重复调用。夹具只支持固定语法并有特定参数，见[共享对话](/capabilities/conversation)，不能以任意自然语言示例冒充它支持。

## 固定开发页面

以下 GET 路径无需令牌、无查询参数，返回固定容器或可信脚本：/development、/development/client.mjs、/development/conversation、/development/conversation.mjs、/development/operator、/development/operator.mjs。容器无需令牌不意味着业务数据公开。operator 页面需消费令牌和独立确认凭据才能操作原任务。来源、CSP、iframe 边界见[页面指南](/capabilities/pages)。

## 可执行 Node.js 请求例子

保存为 C:/Sitoo/query-task.mjs；参数是已初始化的共享示例目录。从它的私有 .local 文件取得运行 URL 与本应用 application token。此脚本无 Origin，不是供网页跨域使用的 fetch。只有本机无费用 normalize，明确新请求才执行；查询恢复不再次运行脚本创建新 UUID。

```js
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
const project = process.argv[2];
if (!project) throw new Error('请提供已启动的示例目录');
const local = join(resolve(project), '.local');
const { url } = JSON.parse(await readFile(join(local, 'running.json'), 'utf8'));
const token = (await readFile(join(local, 'app-a-application.token'), 'utf8')).trim();
async function call(path, body) {
  const response = await fetch(url + path, { method: body ? 'POST' : 'GET',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(5000) });
  const reply = await response.json();
  if (!response.ok || !reply.ok) throw new Error(reply.error?.code ?? '传输失败');
  return reply.value;
}
const request = { protocolVersion: 1, requestId: randomUUID(),
  capabilityId: 'starter-core/normalize', input: { text: ' hello ' } };
// 先存原请求，断开后从此文件与原身份任务列表恢复，不能换 ID 重发。
const pending = join(local, 'http-' + request.requestId + '.json');
await writeFile(pending, JSON.stringify({ request }), { flag: 'wx' });
const submitted = await call('/v1/tasks', request);
await writeFile(pending, JSON.stringify({ request, taskId: submitted.taskId }));
const original = await call('/v1/tasks/' + submitted.taskId);
const page = await call('/v1/tasks?limit=20&offset=0');
console.log(JSON.stringify({ original, page }, null, 2));
```

执行 `node C:/Sitoo/query-task.mjs C:/dev/hello-ecosystem`。预期原任务最终 completed，result.value.text=HELLO；初次查询可能仍 running，用原 taskId 继续 GET。手动对话的完整 tools→prepare→submit→get 例子见[共享对话](/capabilities/conversation)。

## 状态码与下一步

| HTTP | code / 行动 |
| --- | --- |
| 200/202 | 仍判断 ok 与任务 status/result；不当成业务交付证明 |
| 400 | INVALID_INPUT、CONFLICT、LIMIT_EXCEEDED 等操作错误，按各路由原参数修复/查询 |
| 401 | UNAUTHENTICATED，检查本应用/入口的开发 token，不泄露内容 |
| 403 | FORBIDDEN，核对 owner、信任、授权、精确计划、Origin/Host/pin 与操作者凭据 |
| 404 | 未匹配路由返回安全 UNAVAILABLE；核对方法、路径、UUID 与禁止的查询参数 |
| 503 | UNAVAILABLE，存储/规划/可信依赖异常；原写入结果可能未知，先查原 ID |

不接受 account/grants/session/providerUrl 等自报身份或执行参数。错误恢复以原关联为准，不删除数据库、journal 或租约来绕过保护。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
