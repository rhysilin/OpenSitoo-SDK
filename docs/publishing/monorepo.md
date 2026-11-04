# 多应用仓库

一个仓库可管理多个应用，各应用与能力保留独立manifest、版本、权限和签名。

```powershell
node C:/Sitoo/capability-kit/monorepo-template/init.mjs C:/dev/my-apps C:/Sitoo/capability-kit C:/Sitoo/capability-packages
cd C:/dev/my-apps
node tooling/build.mjs
node tooling/build.mjs apps/text-normalizer-a
pwsh -NoProfile -File .ci/verify.ps1
```

目标目录必须存在，已有同名输出拒绝覆盖。apps放应用、capabilities放共享能力、tooling放构建、vendor固定公开工具。私钥/令牌/数据库放.local且不提交；dist为不可覆盖的生成物，不提交。

vendor文件应保持原始字节，避免Git自动换行破坏发布摘要。新应用继续用同一仓库，不合并安装身份。


## 目录、版本与日常操作

```text
my-apps/
  apps/text-normalizer-a/        应用 A 声明和页面
  apps/text-normalizer-b/        应用 B 独立身份与版本
  capabilities/text-normalizer/  共享业务实现与契约
  tooling/                      统一构建和检查
  vendor/sitoo/                 固定字节的公开工具及许可证
  .ci/verify.ps1                本地 CI
  .local/                       私钥、令牌、账本，忽略提交
  dist/                         版本化构建产物，忽略提交
```

初始化前创建目标目录，取得[下载工具](/downloads)的完整 capability-kit 和 capability-packages。init 不覆盖同名项目；全量 build 先构建能力再构建应用，单应用 build 仅选择指定路径，输出位置与应用实际版本一致。输出已存在时改版本或使用新工作目录，不删除未确认的产物。

新应用在 apps 下建立独立目录，修改 manifest 的 packageId/applicationId/依赖、页面和客户端中的能力 ID，再用构建入口选择该路径；不要只复制目录而沿用另一应用身份。Git 保留 .gitattributes，vendor 不格式化或转换换行，CI 以 kit-manifest 核对原字节。更新 vendor 使用完整同版公开分发，不混用侧车。

首次全量构建后运行本地 CI，逐项看输出；失败停止发布。远端可以存多个应用源码，但不放私有状态或 dist，不要求付费托管流水线。更多验证与报告判定见[测试与诊断](/publishing/testing)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
