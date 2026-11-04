import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,posix} from 'node:path';
const root=resolve(import.meta.dirname,'..'),docs=join(root,'docs'),errors=[];
async function walk(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.'))continue;out.push(...(e.isDirectory()?await walk(join(dir,e.name)):[join(dir,e.name)]));}return out;}
const files=(await walk(docs)).filter(p=>p.endsWith('.md')),pages=new Map();
for(const file of files)pages.set(file.slice(docs.length+1).replaceAll('\\','/').replace(/\.md$/,''),(await readFile(file,'utf8')).replaceAll('\r\n','\n'));
const navigation=JSON.parse(await readFile(join(root,'maintenance/navigation.json'),'utf8'));
for(const [,folder,items] of navigation)for(const [slug]of items)if(!pages.has(folder?folder+'/'+slug:slug))errors.push('Navigation missing '+folder+'/'+slug);
for(const [page,text]of pages){
 if(page!=='index'&&!text.includes('[文档首页](/)'))errors.push('Missing return navigation '+page);
 if(/E3[-\s]|R0[1-7]|本批|交接|\.cache[\\/]|E:[\\/]syslocal/.test(text))errors.push('Internal wording '+page);
 const prose=text.replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g,'');
 for(const match of prose.matchAll(/\]\(([^)]+)\)/g)){let link=match[1];if(/^(https?:|mailto:)/.test(link))continue;let path=link.split('#')[0];if(!path)continue;if(path.startsWith('/downloads/')||path.startsWith('/examples/')){try{await readFile(join(root,'public',path.slice(1)))}catch{errors.push('Missing download '+link)}continue;}path=path.startsWith('/')?path.slice(1):posix.join(posix.dirname(page),path);path=path.replace(/\.md$/,'').replace(/\/$/,'/index');if(!path)path='index';if(!pages.has(path))errors.push('Broken link '+page+' -> '+link);}
}
const coverage=JSON.parse(await readFile(join(root,'maintenance/api-coverage.json'),'utf8'));
for(const mod of coverage)for(const symbol of mod.symbols)if(!pages.get(mod.page)?.includes('\n## '+symbol+'\n'))errors.push('Missing export '+mod.page+' '+symbol);
const downloads=JSON.parse(await readFile(join(root,'maintenance/downloads.json'),'utf8'));
for(const tool of [...downloads.tools,...(downloads.previousTools??[])]){const bytes=await readFile(join(root,'public/downloads',tool.file));if(bytes.length!==tool.bytes||createHash('sha256').update(bytes).digest('hex')!==tool.sha256)errors.push('Download integrity '+tool.file);}

// 标题存在不证明正文完整；拒绝只有标题而没有说明的章节。
for(const [page,content] of pages){
 const prose=content.replace(/```[\s\S]*?```/g, block => block.trim() ? '代码示例' : '');
 const sections=prose.split(/\n(?=#{1,6} )/);
 for(const section of sections){
  if(!/^#{2,6} /.test(section))continue;
  const lines=section.split('\n');
  const body=lines.slice(1).join('\n').replace(/---[\s\S]*$/,'').trim();
  if(!body)errors.push('Empty section '+page+' '+lines[0]);
 }
}
// 维护语义与真实导出同时闭合，新增接口不能仅生成类型标题。
const semantics=JSON.parse(await readFile(join(root,'maintenance/reference-semantics.json'),'utf8'));
for(const mod of coverage){const entry=semantics[mod.page.split('/').at(-1)];
 for(const symbol of mod.symbols)if(!entry?.symbols[symbol]||!pages.get(mod.page)?.includes(entry.symbols[symbol]))errors.push('Missing export explanation '+mod.page+' '+symbol);
}
const routes=['POST /v1/tasks','GET /v1/tasks','GET /v1/tasks/:taskId','POST /v1/tasks/:taskId/cancel','POST /v1/tasks/:taskId/reconcile','GET /v1/confirmations/:taskId','POST /v1/confirmations/:taskId','GET /v1/tasks/:taskId/artifact','GET /v1/application','GET /v1/conversation/tools','POST /v1/conversation/prepare','POST /v1/conversation/plan'];
for(const route of routes)if(!pages.get('reference/http')?.includes('## '+route+'：'))errors.push('Missing HTTP operation '+route);
// 维护记录也检查本地链接，避免只修正式正文、遗留失效的进度索引。
for(const file of (await walk(join(root,'maintenance'))).filter(file=>file.endsWith('.md'))){
 const content=(await readFile(file,'utf8')).replace(/```[\s\S]*?```/g,'');
 for(const [,link]of content.matchAll(/\]\(([^)]+)\)/g)){
  if(/^(https?:|mailto:|\/)/.test(link))continue;
  const target=link.split('#')[0];if(!target)continue;
  try{await readFile(resolve(file,'..',target))}catch{errors.push('Broken maintenance link '+file+' -> '+link)}
 }
}

if(errors.length)throw Error(errors.join('\n'));
console.log(JSON.stringify({pages:pages.size,modules:coverage.length,exports:coverage.reduce((n,m)=>n+m.symbols.length,0),links:'passed',semanticCoverage:'passed',httpOperations:routes.length,emptySections:0}));
