# 第一个共享应用

本教程创建两个独立应用和一个共享文本标准化能力，在本机完成真实构建、签名、安装、授权与 SDK 调用。业务只处理输入文本，不访问模型、不产生外部费用。

需要 Windows、Node.js 24，以及已解压到 C:/Sitoo 的共享能力开发工具包和能力包管理工具。工具下载和目录核对见[环境与工具](setup)。下面的签名与授权属于你控制的本地开发环境，不代表生产开发者身份。

## 1. 取得完整示例

保存[共享应用流程脚本](/examples/shared-workflow.mjs)为 C:/Sitoo/shared-workflow.mjs。脚本带中文注释，使用 Node 内置模块和已发布工具，不读取平台源码。

脚本的 init 阶段创建模板、构建三个发布物、生成本机开发密钥、验证签名并发布到 SQLite，再分别安装两个应用根和授权 application/conversation 入口。它把私钥、令牌和数据库保存在 .local；不要公开这个目录。你在本机扮演可信开发宿主操作者，不能把相同信任配置搬去生产。

```powershell
# 两个工具目录必须与解压位置一致；输出目录必须不存在。
node C:/Sitoo/shared-workflow.mjs init C:/Sitoo/capability-kit C:/Sitoo/capability-packages C:/dev/hello-ecosystem

# 自动启动本机宿主，真实运行两个应用、两个入口并验证原请求去重；完成后关闭。
node C:/Sitoo/shared-workflow.mjs verify C:/dev/hello-ecosystem
```

成功时 init 输出 status=initialized，verify 最后输出 status=passed、entries=4、paidRequests=0。实际结果与 taskId/requestId 记录在 .local/verification.json。四入口结果应为 HELLO    DOCS（保留中间四个空格）；这个能力只 trim 两端并转大写，不合并内部空格。

## 2. 看懂生成的工程

| 路径 | 用途 |
| --- | --- |
| core/manifest.json、core/src/main.guest | 能力身份、版本和唯一业务实现 |
| app-a、app-b | 两个独立应用，各有 manifest、页面、SDK 和 client.mjs |
| dist/core-1.0.0、dist/app-a-1.0.0、dist/app-b-1.0.0 | 分别构建的发布物，含 capability-package.json |
| .tools | 复制的公开工具；工程不依赖平台仓库 |
| .local | 开发信任、密钥、精确发布/安装/授权库、入口令牌与任务数据 |

应用调用 starter-core/normalize，输入为 {text}，返回 {text}。manifest 声明身份和依赖，构建时计算原文件大小/摘要；业务文件不持有令牌或提供自己的宿主执行器。字段规则见[应用契约](/guides/contracts)和[应用发布物](/capabilities/artifacts)。

## 3. 启动宿主并手动调用

在第一个 PowerShell 窗口运行，保持前台：

```powershell
# 复用已初始化的安装与授权；输出真实随机端口，不手写固定地址。
node C:/Sitoo/shared-workflow.mjs serve C:/dev/hello-ecosystem
```

第二个 PowerShell 窗口读取启动信息和自己的 application 令牌。令牌由本例可信初始化提供，不从页面或业务参数签发：

```powershell
# 只在本机读取私有配置；不要复制令牌进代码或截图。
$demoInfo = Get-Content C:/dev/hello-ecosystem/.local/running.json -Raw | ConvertFrom-Json
$env:SITOO_CAPABILITY_TOKEN = (Get-Content C:/dev/hello-ecosystem/.local/app-a-application.token -Raw).Trim()

# 提交前保存原请求 ID；超时或重开时用它定位原任务。
$originalRequestId = [guid]::NewGuid().ToString()
node C:/dev/hello-ecosystem/app-a/client.mjs $demoInfo.url ' hello    docs ' $originalRequestId
```

客户端退出 0 且返回 ok=true、value.status=completed、value.result.value.text=HELLO    DOCS。请求被宿主接受与任务完成是不同阶段；模板客户端最多查询约 10 秒，非 completed 时退出非零。再次提交同一 requestId 和完全相同输入应返回原 taskId；不要把换 ID 当恢复。

换用 app-b-application.token 和 app-b/client.mjs 可验证第二个应用；conversation 令牌是另一项独立授权，本例的 CLI 可以提交结构化业务参数，不等于启用了自然语言模型。共享对话的发现和规划见[共享能力对话](/capabilities/conversation)。

## 4. 打开独立页面

浏览器访问启动信息里的 page 地址（实际为宿主 /development）。输入本地对应 application 入口令牌，打开已经签名且安装的页面。两应用页面使用同一个能力；页面只收到受限任务桥，不拥有 .local 密钥或管理库。

关闭页面不取消上游任务。停止示例时在宿主前台按 Ctrl+C；父进程关闭管道后宿主执行自身关闭。任务库保留，重开只查询原结果。示例签名有效期为一小时，过期后重新创建独立示例目录，不通过伪造时钟绕过信任校验。

## 5. 修改和继续学习

先读 core/src/main.guest 的实现，修改业务、提高 core/manifest.json 版本，再构建到一个不存在的新输出目录。正式更新还需要重新签名发布、可信预检和安装授权，不由编辑文件自动生效。更新过程见[更新与回滚](/publishing/lifecycle)，权限变化见[入口授权](/publishing/authorization)。

| 问题 | 处理 |
| --- | --- |
| init 拒绝已有目录 | 选择一个新目录，不覆盖用户工程 |
| FORBIDDEN | 核对签名有效期、入口、应用身份和授权；不替换为另一应用令牌 |
| REQUEST/CONFLICT 类错误 | 检查是否用原 ID 改了参数；不要重复自动生成新的业务请求 |
| 任务未完成或 unknown | 保存原 requestId/taskId，按[恢复规则](/guides/tasks)查询，不把退出非零当作未执行 |
| 存储故障 | 保留现有数据库，检查空间/权限，不创建新库伪装恢复成功 |

本地例子的签名、授权步骤可以阅读脚本逐项学习。把应用接入其他环境时，命名空间、公钥信任、宿主地址及账户授权必须由该环境提供，不能沿用 starter 测试身份。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
