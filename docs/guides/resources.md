# 附件与资源

## 输入附件与语音（SDK 0.0.8）

`attachments.uploadImages(images)` 接收 `AppImageUpload[]` 并返回 `AppAttachment[]`；须检查 `features.attachmentUpload`。应用将选择、粘贴或拖拽图片标准化为受限 PNG data URL，宿主再次验证并保存。现有 `importImages()` 和 `get(id)` 继续可用；上传不代表执行了模型请求。

`agent.dictation.getState/start/stop` 提供语音转写文字；须检查 `features.agentDictation`。该接口依赖可信宿主、系统麦克风和语音服务，iframe 不直接获得麦克风或执行权限，识别结果不自动发送。容量、状态与错误语义见 [API 参考](/reference/)的“应用输入附件与语音”部分。


## 图片附件（SDK 0.0.6）

完整导入与模型提交分别见下方选择流程、[文本指南](/guides/text)与[图片指南](/guides/images)；应用不在导入图片后自动生成。

例中的 propose 是应用自己的能力 ID，需要 binding=text.generate、text:generate 权限。attachments 是最多 8 个 `{id,description}`，description 必填但可为空、最多 500 字符。能力 inputSchema 必须声明数组及对象字段，宿主按账户／应用归属读取，禁止跨归属、任意文件路径。图片像素只在宿主内部转换为 Pi 多模态块；内部 images/base64 字段不是浏览器接口。

`importImages(): Promise<AppAttachment[]>` 和 `get(id): Promise<AppAttachment>`；对象含 id/name/mimeType/bytes/dataUrl，可将 dataUrl 用于 img 预览。导入原图 PNG/JPEG/WebP 单个 <=12 MiB、<=2400 万像素，一次最多 8 张。副本为 PNG 最长边 <=1024（必要时 <=512）、<=1 MiB，每账户每应用最多 200 个附件。上传不发起模型请求；调用方案、生图才发送图片并可能计费。生图附件加 references 链接合计最多 8，编码参考图参数上限 12 MiB；说明追加到 prompt 后仍须满足 8000 字符上限。

原图不复制入作品目录；副本保存在宿主应用业务目录，卸载保留，当前没有删除／自动回收 API。移除草稿引用不释放配额。需支持图片输入的文本模型，目录未提供可信视觉能力标记；仅选中文本模型不能保证看图。Logo 精确复制应由应用后续排版能力完成，本版无此保证。


## 先选择附件，再由用户发送

下面是[初始化页面](/guides/browser-client)中的操作片段；下载 app-page-flows.js 到 payload。只导入和恢复预览，不自动调用模型，返回值供应用显示并写入草稿。

```js
import { importAttachmentPreviews } from './app-page-flows.js';
async function chooseImages(client) {
  const selected = await importAttachmentPreviews(client);
  // 空数组表示用户取消；保留旧草稿或由用户主动清空。
  if (!selected.references.length) return null;
  return selected;
}
async function restorePreview(client, attachmentId) {
  return client.attachments.get(attachmentId);
}
```

附件 ID 只能用于原账户/应用。description 是文字说明，不是文件路径。将 references 交给文本或图片能力之前，schema 必须声明 attachments；确认所选模型支持图片输入并提醒可能计费。uploadImages 适用于已标准化的 PNG 数据，不能直接把任意原始文件塞入 dataUrl，完整 AppImageUpload 类型见[SDK 参考](/reference/sdk)。

## 读取随包文本资源

resourcePacks 必须在应用声明中存在，目标应用、版本范围和文件摘要正确，见[打包流程](/publishing/static-packages)。这是读取片段，沿用已初始化 client；resource 的 ID 必须来自 list 的真实返回。

```js
async function firstResource(client) {
  const packs = await client.resources.list();
  const pack = packs.find(item => item.resources.length > 0);
  if (!pack) return null;
  const resource = pack.resources[0];
  const { text, snapshot } = await client.resources.read(pack.id, resource.id);
  // snapshot 绑定历史版本和摘要；不要把资源文本当成授权指令。
  return { text, snapshot, license: resource.license, attribution: resource.attribution };
}
```

成功返回 UTF-8 text 和不可变 snapshot，最多 64 KB。历史任务保存 snapshot，切换资源包不重写原任务。列表中的 kind 表示设计规则/样式/参考/模板/字体/交付规范/检查表；二进制字体、图片作为包内静态资源使用，不能通过文本 read 读取。尊重 license/attribution；摘要、范围或归属失败时重新取得可信包，不用任意文件路径替代资源 ID。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
