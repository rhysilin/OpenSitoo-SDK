# 发布版本

当前文档版本1.0.0，SDK0.0.11、能力工具包0.39.0、Desktop0.0.37。

不同组件分别版本化，不用文档版本代替客户端或协议版本。更新时检查sdkRange、能力依赖范围、精确安装摘要及权限变化。需要增加权限时重新确认；回滚代码不等于回滚业务数据。

版本选择和平台边界见[兼容说明](/getting-started/compatibility)。


## 当前组件与版本职责

| 组件 | 当前版本 | 更新关注点 |
| --- | --- | --- |
| App SDK | 0.0.11 | 五入口、sdkRange、页面功能发现和显式共享服务绑定 |
| Desktop | 0.0.37 | 实际提供的功能、平台登录和已安装包兼容 |
| capability-kit | 0.39.0 | 独立构建/示例/本地 CI，保持完整目录与侧车 |
| 开发宿主 | 0.23.0 | 本机开发服务，v3 持久授权与完整计划复核 |
| 包工具 CLI | 0.12.0源码 / 0.10.0既有公开ZIP | 签名、原子事务、权限预检、迁移与租约 |
| 持久引用模块 | 0.5.1 | 原归属、Provider 修订和原结果查询 |

wire protocolVersion、manifest formatVersion 与各数据库 schema 独立版本化；不能把 SDK 0.0.11 写成协议 11。下载摘要及实际尺寸见[工具下载](/downloads)，具体环境见[支持范围](/getting-started/compatibility)。

## SDK 已发布变化

| SDK | 对开发者的实际变化 | 迁移方式 |
| --- | --- | --- |
| 0.0.11 | 静态绑定 capabilities.text-request、capabilities.image-request、capabilities.call | 新包声明支持 >=0.0.11，可信宿主需对应签名安装及独立入口授权；旧 text.generate/images.generate/text.echo 保留。新链路拒绝不回退收费 |
| 0.0.10 | /capabilities 可选 artifact 原任务产物读取，AppCapabilityArtifact | 原 transport 四方法兼容；需要读取时实现可选 artifact，不能重新生成 |
| 0.0.9 | 能力 SDK /capabilities 原任务 submit/get/cancel/list/dispose | 用宿主提供的 transport，输入/输出校验，不混入身份或批准权 |
| 0.0.8 | 标准化附件上传、可选推理强度、语音转写 | 使用前检查可选 features 与实际 reasoningLevels；转写不自动发送 |
| 0.0.7 | 无工具应用 Agent 会话 | text:generate 权限与已启用模型；单次文本任务仍保留 |
| 0.0.6 | 原生图片导入和归属隔离的附件预览 | 草稿仅保存 ID，支持图像的模型需自行核对 |
| 0.0.5 | 文本输出预算/结束原因/安全错误与部分失败文本 | 只有 completed 使用 value，未知结果不重试，旧记录不推断缺失原因 |
| 0.0.4 | 静态 text.generate 与文本任务查询 | 声明 text:generate；调用模型可能收费，不提供任意网络或执行工具 |
| 0.0.3 | 功能发现、JSON 业务存储、图像列表、安全错误 | 使用宿主支持的 sdkRange，旧单字符串错误应兼容 AppSdkError |

历史包名 @pi-market/sdk 已迁移为 @sitoo/sdk；新工程更新依赖/import，旧已打包静态应用无需只为包名重新安装。文档只承诺当前支持范围，不把某个界面可选开关当成新增公共 API。

## 升级与回退检查

先记录现行包/依赖/SDK 版本与摘要，核对目标 sdkRange 和新权限；代码与资源重新构建签名，保持原版本字节不可变。处理原活动任务后按[更新预检](/publishing/lifecycle)明确确认，再采用新授权/启动新宿主。旧任务仍绑定原版本，unknown 不释放。数据格式变化按[显式迁移](/publishing/migrations)单独实施；代码回退不会恢复旧数据、密钥或任务结果。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)

## 开发者中心0.1.0

新增本地邀请测试的统一身份登录、组织/角色/命名空间、开发与测试只读凭据及审计。环境由平台操作者提供，不是公开生产注册服务；App SDK0.0.11与Desktop0.0.31兼容范围保持。用法见[身份与组织](/center/identity)，准确契约见[中心HTTP](/reference/developer-center)。

## 开发者中心测试发布0.2.0

支持受邀项目创建、只读目录包提交、独立审核与Ed25519测试发布；发布工具0.1.0独立运行于Node24。只兼容SDK0.0.11，原Desktop0.0.31与三种旧开发工具保持；测试服务不代表生产开放。见[教程](/center/publishing)、[公共HTTP](/reference/developer-center)与[下载](/downloads)。

共享工具包0.36.0 / 宿主0.20.0 / Tasks0.4.1 / Desktop0.0.32：新增已签名、持久授权v3的test安装路径与目录适配，修复Windows深层任务账本路径；默认development与原schema保持。旧v1/v2及production边界保持。详见[目录与测试安装](/center/catalog)。

## 开发者中心0.4.0与发布工具0.2.0

新增Node24/npm冻结锁文件本地CI、项目范围诊断与反馈工单；请求号与固定阶段错误用于原发布恢复。仍需独立审核/签名，不提供托管CI或生产支持。SDK0.0.11、Desktop0.0.32保持。详见[教程](/center/ci-support)。

Desktop0.0.33：原图片生成完成而缓存尚未保存时，共享请求等待同一原任务的缓存，不重新生图；SDK/数据格式不变。

共享工具包0.39.0、宿主0.23.0、Tasks0.6.1、Desktop0.0.37：本机Windows Job/QuickJS资源与生命周期控制、可信实时分派预检、存储故障下关闭和原任务恢复。旧工具包不覆盖，协议/SDK和schema1/2读取保持。生产业务执行仍未开放，详见[宿主说明](/capabilities/host)与[任务参考](/reference/tasks)。
