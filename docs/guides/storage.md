# 配置与数据

## 项目与草稿存储

| 方法                                       | 返回与行为                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `storage.get(id)`                          | AppDataRecord 或 null；已删除记录返回 deleted=true 的墓碑                 |
| `storage.list({cursor?,limit?})`           | items 元数据列表和可选 nextCursor；默认 50，最多 100，不包含 value 或墓碑 |
| `storage.put({id,revision,version,value})` | 保存完整 JSON 对象并返回新记录；创建 revision=0，修改使用当前 revision    |
| `storage.delete(id,revision)`              | 删除业务值，返回 revision 递增的墓碑                                      |

记录含 id、revision、version、updatedAt、value、deleted。id 为 1–100 位字母/数字/下划线/连字符，首位字母或数字；保留标识 constructor/prototype 不可用。version 为应用数据结构正整数版本，平台不自动转换。列表按 id 字典序，cursor 是上一页最后一个 id，不是快照分页。

单次写入 JSON（含 id/revision/version/value）最多 16 KiB UTF-8；每账户每应用的存储文件最多 8 MiB、1000 个记录（含墓碑）。无需文件权限，但只能访问自身空间。value 必须是 JSON 对象，不支持二进制、循环对象或凭据；较大资源使用平台产物接口。

下面是操作片段，`client` 由本页链接的[初始化模块](/guides/browser-client)建立；在应用页面执行，不是独立 Node.js 脚本。

```ts
const previous = await client.storage.get('project-1');
const saved = await client.storage.put({
  id: 'project-1',
  revision: previous?.revision ?? 0,
  version: 1,
  value: { brief: '电影海报', taskIds: [] },
});
// 下次修改必须使用 saved.revision；不要自动覆盖冲突。
```

修改原子保存、串行并发校验。页面关闭和账户切换使会话失效；已提交的写入可能已经持久化，重新打开后应读取记录确认。卸载保留业务数据，应用应在卸载前提供清除入口。


## 配置与资源

`configuration.get()` 与 `save(revision,values)` 用于应用配置，不能代替项目存储。`resources.list()` 获取随包资源；`read(packId,resourceId)` 获取允许的文本内容与不可变 snapshot（最多 64 KB）。这些接口沿用 SDK 0.0.2 的行为。


## 读取、修改与冲突处理

沿用[页面初始化](/guides/browser-client)。下面是保存既有草稿的片段：`original` 是本次编辑开始时 get 的记录，`editedValue` 是用户修改的完整对象。新建记录 original=null；不要在点击保存时先读最新修订再无条件覆盖用户尚未见过的内容。

```js
import { appErrorDetails } from './client.js';
async function saveEditedDraft(client, original, editedValue) {
  try {
    return await client.storage.put({ id: 'project-1',
      revision: original?.revision ?? 0, version: 1, value: editedValue });
  } catch (error) {
    if (appErrorDetails(error).code !== 'REVISION_CONFLICT') throw error;
    const latest = await client.storage.get('project-1');
    // 将本地编辑与 latest 同时交给界面；用户合并后再以 latest.revision 保存。
    return { conflict: true, latest, local: editedValue };
  }
}
```

成功保存会增加 revision，后续保存使用返回值。删除使用 storage.delete(id, currentRevision)；返回 deleted=true 的墓碑而非物理移除。不存在与已删除应分别展示，墓碑仍计配额。列表只含元数据，按 nextCursor 分页，详情逐项 get；并发变化时列表不是事务快照。

配置 state 包含 appId、version、revision、values 与 credentials 的存在性标记；页面不能获取秘密值。configuration.save(revision, values) 按本包 configuration.schema 检查完整配置，冲突同样提示用户合并。version 是配置格式版本，不是应用 SemVer。未声明配置不能凭页面自行创建凭据槽。

STORAGE_LIMIT 时保留编辑内容并减少数据大小；STORAGE_FAILED 时检查宿主可写空间/数据库，重开后读取原记录，不能断言未写入。卸载保留业务数据，不保证草稿中去掉附件引用就回收附件。数据迁移与代码回滚分离，见[数据迁移](/publishing/migrations)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
