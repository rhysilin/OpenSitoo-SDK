// 这些流程只操作传入的公开客户端；不读取宿主密钥、不注册 Provider、不自动重放。
export async function discover(client) {
  return client.platform.getCapabilities();
}
export async function saveDraft(client, id, value, previous) {
  // 传入编辑开始时读取的记录；新建时传 null，不能在保存前重读掩盖冲突。
  // revision 是宿主并发修订；version 是应用自己的数据格式版本，二者不能混用。
  return client.storage.put({ id, revision: previous?.revision ?? 0, version: 1, value });
}
export async function listAllDrafts(client) {
  const items = []; let cursor;
  do {
    const page = await client.storage.list({ limit: 50, ...(cursor ? { cursor } : {}) });
    items.push(...page.items); cursor = page.nextCursor;
  } while (cursor);
  return items;
}
export async function saveConfiguration(client, values, original) {
  // original 必须是编辑开始时读取的配置快照。
  // 必须保留读到的 revision；冲突抛给界面处理，不循环覆盖。
  return client.configuration.save(original.revision, values);
}
export async function readResource(client, packId, resourceId) {
  return client.resources.read(packId, resourceId);
}
export async function importAttachmentPreviews(client) {
  const features = (await discover(client)).features;
  if (!features.attachments) throw new Error('宿主没有开放图片导入');
  const imported = await client.attachments.importImages();
  // 取消选择返回空数组；只保存 ID，不把 dataUrl 写进草稿。
  return { references: imported.map(item => ({ id: item.id, description: '用户选择的图片' })), previews: imported };
}
export async function pollText(client, requestId, signal) {
  let task;
  for (let index = 0; index < 40; index++) {
    // AbortSignal 仅停止本例查询等待，不取消上游或证明任务未执行。
    if (signal?.aborted) return task;
    task = await client.text.getTask(requestId);
    if (task.status !== 'running') return task;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return task;
}
export async function submitText(client, capability, input, requestId) {
  if (!(await discover(client)).features.textInference) throw new Error('文本接口未开放');
  const models = await client.text.listModels();
  if (!models.some(model => model.id === input.model)) throw new Error('请选择宿主已启用的模型');
  // requestId 应在调用本函数前写入草稿；调用由用户主动触发，可能计费。
  const accepted = await client.invoke(capability, input, requestId);
  return { accepted, current: await pollText(client, requestId) };
}
export async function submitImage(client, capability, input, requestId) {
  const availability = await client.images.getCapabilities();
  if (!availability.enabled || !availability.configured) throw new Error('图像服务尚未配置');
  // 只在用户明确操作时调用；审批由可信宿主执行。
  return client.invoke(capability, input, requestId);
}
export function watchImage(client, taskId, onTask, onError) {
  // 返回停止订阅函数；停止订阅不取消上游生成。
  return client.images.watchTask(taskId, onTask, onError);
}
export async function readImage(client, taskId) {
  const task = await client.images.getTask(taskId);
  if (task.status !== 'completed') throw new Error('原任务尚未成功完成');
  return client.images.getArtifact(taskId);
}
export async function sendAgentTurn(client, configuration, input) {
  if (!(await discover(client)).features.agentConversations) throw new Error('会话接口未开放');
  await client.agent.open(configuration);
  // send 返回已接受快照，不代表助手回复完成。
  let state = await client.agent.send(input);
  for (let index = 0; index < 20 && state.status === 'running'; index++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    state = await client.agent.getState();
  }
  return state;
}
