const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','widget');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const core=fs.readFileSync(path.join(root,'workflow-core.js'),'utf8');

test('les trois vues principales existent',()=>{
  for(const id of ['dashboard','tasks','form','detail'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/data-view="tasks"/);
});
test('tous les identifiants DOM directs utilisés par le script existent',()=>{
  const ids=[...app.matchAll(/\$\('#([A-Za-z][\w-]*)'\)/g)].map(m=>m[1]);
  for(const id of new Set(ids))assert.match(html,new RegExp(`id="${id}"`),`#${id} absent du HTML`);
});
test('API Grist chargée avant le code du widget',()=>{
  assert.ok(html.indexOf('grist-plugin-api.js')<html.indexOf('workflow-core.js'));
  assert.ok(html.indexOf('workflow-core.js')<html.indexOf('app.js'));
});
test('aucun stockage local, eval ou texte mal encodé',()=>{
  const all=html+app+core;
  assert.doesNotMatch(all,/localStorage|sessionStorage|\beval\s*\(/);
  assert.doesNotMatch(all,/Ã|â€™|â€¦|Â/);
});
