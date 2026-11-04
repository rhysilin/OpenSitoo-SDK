import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
const [kitArgument, outputArgument] = process.argv.slice(2);
if (!kitArgument || !outputArgument) throw new Error('用法：node trusted-host-example.mjs <capability-kit目录> <新数据目录>');
const kit = resolve(kitArgument), output = resolve(outputArgument);
// 只在新可丢弃目录运行，避免覆盖既有业务库；不安装收费 Provider。
await mkdir(output);
const { CapabilityBroker, CapabilityRuntime, CapabilityTasks } = await import(pathToFileURL(join(kit, 'service-host.mjs')));
const source = 'return { text: input.text.trim().toUpperCase() };';
const sha256 = createHash('sha256').update(source).digest('hex');
const binding = { capabilityId: 'example/normalize', packageId: 'example/text', version: '1.0.0', sha256 };
const declaration = { binding, interfaceVersion: 1,
  inputSchema: { type: 'object', required: ['text'], additionalProperties: false, properties: { text: { type: 'string', maxLength: 100 } } },
  outputSchema: { type: 'object', required: ['text'], additionalProperties: false, properties: { text: { type: 'string' } } },
  permissions: [], allowedEntries: ['application'], delegates: [], effects: { billable: false, externalWrite: false } };
const runtime = new CapabilityRuntime();
const compiled = await runtime.checkSource({ source, sourceSha256: sha256 });
if (!compiled.ok) throw new Error(compiled.error.code);
const broker = new CapabilityBroker();
broker.register(declaration, runtime.createExecutor({ source, sourceSha256: sha256 }));
// 本地教学身份由这段可信初始化固定，不能把同样 API 暴露给业务页面。
const session = broker.createSession({ tenantId: 'example', environment: 'development', installationId: 'local',
  consumerAppId: 'example.app', entry: 'application', grants: [], bindings: [binding] });
const tasks = new CapabilityTasks({ path: join(output, 'tasks.sqlite'), broker });
const request = { protocolVersion: 1, requestId: randomUUID(), capabilityId: binding.capabilityId, input: { text: ' hello ' } };
await writeFile(join(output, 'original-request.json'), JSON.stringify(request), { flag: 'wx' });
try {
  const submitted = tasks.submit(session, request);
  if (!submitted.ok) throw new Error(submitted.error.code);
  let current = submitted;
  // 查询原 taskId，不重复调用业务；超出教学等待时间也保留原库供诊断。
  for (let count = 0; count < 100; count++) {
    current = tasks.get(session, submitted.value.taskId);
    if (!current.ok || !['queued', 'running'].includes(current.value.status)) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (!current.ok || current.value.status !== 'completed' || current.value.result?.status !== 'success') throw new Error('原任务尚未成功');
  const repeated = tasks.submit(session, request);
  if (!repeated.ok || repeated.value.taskId !== current.value.taskId) throw new Error('原请求去重失败');
  console.log(JSON.stringify({ task: current.value, deduplicated: true, paidRequests: 0 }, null, 2));
} finally {
  // 先关闭协调器，保留不确定任务，再撤销会话；没有删除数据库或强行释放 pin。
  tasks.close();
  broker.revokeSession(session);
}
