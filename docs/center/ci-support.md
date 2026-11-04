# 本地发布CI、诊断与反馈

[文档首页](/) · [测试发布](/center/publishing) · [目录安装](/center/catalog) · [接口参考](/reference/developer-center)

适用：开发者中心0.4.0、发布工具0.2.0、Node24、npm lockfileVersion2/3。SDK0.0.11与Desktop0.0.33保持。仅本地/受邀测试；需要正常审核与签名，成功CI不等于版本已发布。

## 准备工程与凭据

从下载工具包解压`sitoo-publish.mjs`，不需要平台源码/node_modules。工程包含package.json、已提交的package-lock.json、test.mjs及build.mjs。build.mjs接受一个尚不存在的输出目录，输出现有公共capability-package.json与平铺源码；可使用公开共享工具的项目模板。测试和构建是你信任并主动运行的本地代码，先审查，再运行；服务端不执行上传脚本。不要在测试中调用收费服务来证明发布流程。

先在项目目录提交依赖锁文件；不要把生成锁文件放进CI。例为无第三方依赖的Node24工程：

```json
{"name":"my-core","version":"1.0.0","private":true,"type":"module"}
```

```powershell
# 只在首次准备依赖时运行，然后将package.json/package-lock.json纳入版本管理。
npm install --package-lock-only --ignore-scripts --offline --no-audit --no-fund
```

CI使用Node24同目录的npm；确保Node24完整安装包含npm。正式依赖工程用npm安装并提交完整锁文件；离线CI要求缓存就绪。test.mjs例（按自己的实际输入/输出补业务断言）：

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// 仅用于模板的纯文本函数：本地Node用例，不代替受限QuickJS宿主验收。
const source = await readFile(new URL('./src/main.guest', import.meta.url), 'utf8');
assert.deepEqual(new Function('input', source)({ text: ' hello ci ' }), { text: 'HELLO CI' });
```

在中心当前项目创建7天**项目发布凭据**，配置不含秘密：

```json
{"origin":"http://127.0.0.1:18683","tokenEnv":"SITOO_PUBLISH_TOKEN","offline":true}
```

秘密通过安全环境变量配置；不要写进源码、报告、截图或命令参数。HTTPS或本地HTTP可用，拒绝重定向。`offline:true`让npm仅取本地缓存；省略时按锁文件下载依赖。仅支持npm，其他锁文件不能代替。

## 运行与恢复

```powershell
node tools/sitoo-publish.mjs ci ./my-core <project-id> publish.json ./ci-001.json
node tools/sitoo-publish.mjs status - <project-id> publish.json
```

按install→test→build→validation→submission顺序执行：npm ci禁用安装脚本，测试/构建各60秒上限；每阶段复查package.json和package-lock.json原字节。发布秘密不传给这些子进程；工程脚本仍是开发者主动运行的可信本地代码。构建写入`.sitoo-ci/build-*/package`的新目录，失败不会执行后续提交。将`.sitoo-ci/`、报告及凭据配置加入忽略规则，按你的证据保留策略清理，工具不删除旧记录。

报告独占创建，已存在则在执行前拒绝；每次使用新报告名。报告JSON包含toolVersion、lockSha256、固定阶段状态/代码、HTTP请求号及已接受发布{id,project,version,sha256,state}；不记录子进程stdout/stderr、上传源码或凭据。

| 退出码 | 含义 | 处理 |
| --- | --- | --- |
| 0 | 测试、构建和服务接受提交 | pending等待独立审核/发布；原版本可能已有rejected状态 |
| 1 | 配置/Node/锁文件/报告路径错误 | Node24与同目录npm、已有锁文件、有效项目凭据及新报告路径 |
| 2 | npm冻结安装失败 | 检查声明与锁文件一致；离线时先准备缓存 |
| 3 | 测试失败或测试后锁文件变化 | 修复用例/恢复原锁文件，再重试 |
| 4 | 构建失败或构建后锁文件变化 | 核对build.mjs输出契约，修复后新报告重试 |
| 5 | 包校验失败 | 核对公共包格式、路径、长度与摘要 |
| 6 | HTTP提交失败或中断 | 先status查原记录，再按原字节/版本恢复 |

同版本同字节返回原发布号；修改内容使用新版本，不能替换已提交版本。HTTP超时可能发生在服务已提交之后，先查询而非盲目重建。审核拒绝后重复CI仍返回原rejected，不会自动晋级；修订新版本后仍需独立审核与发布。

## 请求与发布诊断

每次HTTP响应含`X-Request-Id`；错误JSON含`error.code/requestId`。在中心“诊断与反馈”选择当前可访问项目，用请求号或原发布号查询。成功提交关联原发布号，失败包校验可由请求号看到submission.validation与固定错误码；审核/发布看到对应阶段。诊断只含服务元数据，不含业务输入、包源码、URL、堆栈或用户审核理由。只保留最近20000条、每次最近100条；未可信鉴权或不能确定项目的错误没有项目诊断，保留响应中的请求号联系操作者。诊断写失败不撤销业务已提交状态，恢复仍查原发布。

## 反馈闭环

创建工单：标题、最小复现说明，任选该项目已有requestId/release。不要包含令牌、私钥、客户数据或完整业务请求；常见凭据/私钥会被拒绝，这不是对任意文本的全面敏感检测。

组织所有者/管理员开始处理，再填写答复；个人项目由所有者处理。工单创建者或管理者在answered后确认关闭。状态open→processing→answered→closed，允许open直接答复；关闭不重新开启。修改须带当前revision，冲突409时重新查询，不能覆盖他人的处理。项目访问与角色每次实时检查，审核者不能凭审核角色查看其他组织工单。

| 方法 | 路径 | 输入/结果 |
| --- | --- | --- |
| GET | `/v1/projects/:project/diagnostics?requestId=...&release=...` | requests[{id,at,release,stage,status,code}]；筛选项可省略 |
| GET/POST | `/v1/projects/:project/feedback` | tickets摘要；创建{title,description,requestId?,release?}，201 |
| GET | `/v1/projects/:project/feedback/:ticket` | 正文、当前revision和事件 |
| PATCH | `/v1/projects/:project/feedback/:ticket` | {revision,state,reply?}，answered必须提供答复 |

会话Cookie+Origin+X-CSRF-token沿用中心规范；项目CI凭据不能访问诊断、工单或管理接口。404隔离他组织/私有项目；403无处理权限；409修订/状态冲突；400含敏感内容或无效输入；401会话失效。页面显示原请求号，可据此联系支持。
