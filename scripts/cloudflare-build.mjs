import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
// 沿用既有 Pages 输出目录，正式本地构建产物仍位于 artifacts/site。
execFileSync(process.execPath, [join(root, 'scripts/check-docs.mjs')], {cwd:root,stdio:'inherit'});
execFileSync(process.execPath, [join(root, 'node_modules/vitepress/bin/vitepress.js'), 'build', 'docs'], {cwd:root,stdio:'inherit'});
const source = join(root, 'artifacts/site');
const destination = resolve(root, 'docs/.vitepress/dist');
if (destination !== join(root, 'docs', '.vitepress', 'dist') || (existsSync(destination) && lstatSync(destination).isSymbolicLink())) throw Error('Unsafe generated output directory.');
const revision = process.env.CF_PAGES_COMMIT_SHA || execFileSync('git', ['rev-parse','HEAD'], {cwd:root,encoding:'utf8'}).trim();
writeFileSync(join(source,'deployment.json'), JSON.stringify({version:1,revision,sdkVersion:'0.0.11',capabilityKitVersion:'0.39.0',builtAt:new Date().toISOString()},null,2)+'\n');
if (existsSync(destination)) rmSync(destination,{recursive:true});
cpSync(source,destination,{recursive:true});
if (readFileSync(join(source,'index.html'),'utf8') !== readFileSync(join(destination,'index.html'),'utf8')) throw Error('Cloudflare staging mismatch.');
console.log(JSON.stringify({output:'docs/.vitepress/dist',revision}));
