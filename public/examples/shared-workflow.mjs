import {mkdir,cp,writeFile,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {generateKeyPairSync,randomBytes,randomUUID} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';

// 仅用于本机无费用开发：密钥与授权属于本示例环境，不代表平台生产身份。
const [mode,...args]=process.argv.slice(2);
const json=async(path,value)=>writeFile(path,JSON.stringify(value,null,2),{flag:'wx',mode:0o600});
const run=(file,parameters,env={})=>execFileSync(process.execPath,[file,...parameters],{encoding:'utf8',timeout:30000,windowsHide:true,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});
if(mode==='init'&&args.length===3){
 const [kitArgument,packagesArgument,destination]=args;
 const project=resolve(destination),kit=resolve(kitArgument),packages=resolve(packagesArgument);
 // 创建器拒绝已有目录；复制公开工具后，示例不再依赖平台仓库。
 run(join(kit,'sitoo-project.mjs'),['create',project]);
 await cp(kit,join(project,'.tools/capability-kit'),{recursive:true});
 await cp(packages,join(project,'.tools/capability-packages'),{recursive:true});
 const local=join(project,'.local');await mkdir(local);
 await writeFile(join(project,'.gitignore'),'.local/\ndist/\n',{flag:'wx'});
 const cli=join(project,'.tools/capability-packages/capability-packages.mjs');
 const tool=(...params)=>{const reply=JSON.parse(run(cli,params));if(!reply.ok)throw Error(reply.error.code);return reply.value;};
 const namespaces=['starter-core','starter-a','starter-b'],trustedKeys=[];
 const now=Date.now();
 for(const namespace of namespaces){
  const pair=generateKeyPairSync('ed25519');
  // 私钥留在 .local，不进入业务源码或公开发布目录；Windows 还需自己的文件访问控制。
  await writeFile(join(local,namespace+'.pem'),pair.privateKey.export({type:'pkcs8',format:'pem'}),{flag:'wx',mode:0o600});
  trustedKeys.push({keyId:namespace,namespace,environments:['development'],publicKeyPem:pair.publicKey.export({type:'spki',format:'pem'}).toString(),notBefore:now-1000,notAfter:now+86400000,revoked:false});
 }
 const trust=join(local,'trust.json');await json(trust,trustedKeys);
 const releases=join(local,'releases.sqlite'),references=[];
 await mkdir(join(project,'dist'));
 for(const [index,name]of ['core','app-a','app-b'].entries()){
  const output=join(project,'dist',name+'-1.0.0');run(join(project,name,'build.mjs'),[output]);tool('inspect',output);
  const metadata=join(local,name+'-sign.json'),attestation=join(local,name+'-attestation.json');
  await json(metadata,{keyId:namespaces[index],environment:'development',issuedAt:now,expiresAt:now+3600000});
  tool('sign',output,join(local,namespaces[index]+'.pem'),metadata,attestation);
  tool('verify-signed',output,attestation,trust);
  references.push(tool('publish',output,attestation,trust,releases));
 }
 const installation=join(local,'installation.sqlite'),authorization=join(local,'authorizations.sqlite'),consumers=[];
 for(const [index,name]of ['app-a','app-b'].entries()){
  const root={tenantId:'docs-local',accountId:'local-reader',applicationId:namespaces[index+1]+'.product',environment:'development'};
  const rootFile=join(local,name+'-root.json'),requestFile=join(local,name+'-install.json');await json(rootFile,root);
  await json(requestFile,{requestId:'initial-install',roots:[{packageId:namespaces[index+1]+'/application',range:'1.0.0'}],references:[references[0],references[index+1]]});
  tool('install-prepare',installation,rootFile,requestFile,releases,trust);
  tool('install-commit',installation,rootFile,'initial-install',releases,trust);
  // application/conversation 分别授权；两个应用不共享消费令牌。
  const bindings=tool('install-load',installation,rootFile,trust).plan.bindings;
  for(const entry of ['application','conversation']){
   const auth=join(local,name+'-'+entry+'-grant.json');
   await json(auth,{requestId:'initial-grant',expectedRevision:0,status:'active',policy:{entry,grants:['text:read'],bindings}});
   tool('authorization-set',authorization,rootFile,entry,auth);
   const token=randomBytes(32).toString('hex');
   await writeFile(join(local,name+'-'+entry+'.token'),token,{flag:'wx',mode:0o600});
   consumers.push({root,entry,token});
  }
 }
 await json(join(local,'host.json'),{version:3,installationPath:installation,authorizationPath:authorization,trustPath:trust,consumers});
 console.log(JSON.stringify({status:'initialized',project,config:join(local,'host.json'),paidRequests:0}));
}else if((mode==='serve'||mode==='verify')&&args.length===1){
 const project=resolve(args[0]),local=join(project,'.local');
 // parent-pipe 使示例父进程退出时原宿主收到关闭信号，不留下后台业务执行器。
 const host=spawn(process.execPath,[join(project,'.tools/capability-kit/sitoo-capability.mjs'),'serve',join(local,'host.json'),join(local,'tasks'),'--parent-pipe'],{windowsHide:true,stdio:['pipe','pipe','pipe']});
 let errors='';host.stderr.on('data',b=>{errors+=b});
 try{
  const url=await new Promise((res,rej)=>{let output='';const timer=setTimeout(()=>rej(Error('启动超时：'+errors)),10000);host.on('error',rej);host.on('exit',()=>{clearTimeout(timer);rej(Error('宿主退出：'+errors))});host.stdout.on('data',b=>{output+=b;if(output.includes('\n')){clearTimeout(timer);res(JSON.parse(output.split('\n')[0]).url)}})});
  await writeFile(join(local,'running.json'),JSON.stringify({url,project,paidRequests:0},null,2),{mode:0o600});
  console.log(JSON.stringify({url,info:join(local,'running.json'),page:url+'/development',paidRequests:0}));
  if(mode==='verify'){
   const requestId=randomUUID(),checks=[];
   for(const app of ['app-a','app-b'])for(const entry of ['application','conversation']){
    const token=(await readFile(join(local,app+'-'+entry+'.token'),'utf8')).trim();
    // 保存原 requestId；同请求再次查询/提交保持同一输入，不创建第二次业务。
    const id=app==='app-a'&&entry==='application'?requestId:randomUUID();
    const call=()=>JSON.parse(run(join(project,app,'client.mjs'),[url,' hello    docs ',id],{SITOO_CAPABILITY_TOKEN:token}));
    const reply=call();if(!reply.ok||reply.value.status!=='completed'||reply.value.result.value.text!=='HELLO    DOCS')throw Error('结果与预期不符');
    if(call().value.taskId!==reply.value.taskId)throw Error('原请求去重失败');
    checks.push({app,entry,status:reply.value.status,text:reply.value.result.value.text,requestId:id,taskId:reply.value.taskId});
   }
   await writeFile(join(local,'verification.json'),JSON.stringify({checks,paidRequests:0},null,2));
   console.log(JSON.stringify({status:'passed',entries:checks.length,report:join(local,'verification.json'),paidRequests:0}));
  }else{
   // 前台运行直到用户 Ctrl+C；不会自行生成令牌、确认或执行收费请求。
   await new Promise(res=>{process.once('SIGINT',res);process.once('SIGTERM',res);host.once('exit',res)});
  }
 }finally{
  host.stdin.end();
  if(host.exitCode===null)await new Promise(res=>{host.once('exit',res);const timer=setTimeout(()=>{host.kill();res()},5000);timer.unref()});
 }
}else{throw Error('用法：init <kit目录> <包工具目录> <新目录> | serve/verify <已初始化目录>')}
