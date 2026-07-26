const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','widget');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const core=fs.readFileSync(path.join(root,'workflow-core.js'),'utf8');

test('les vues principales existent',()=>{
  for(const id of ['dashboard','tasks','form','detail','profile','rights','enrollments','rightsAdmin'])assert.match(html,new RegExp(`id="${id}"`));
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
test('identité Grist obligatoire et utilisée pour les actions',()=>{
  assert.match(app,/ContexteUtilisateur/);
  assert.match(app,/contexts\.length!==1/);
  assert.match(app,/TraiteePar:actor/);
  assert.match(app,/actor=user\.id/);
  assert.match(app,/CreeePar:user\.id/);
  assert.match(app,/Number\(fresh\.AssigneeA\)!==Number\(user\.id\)/);
});
test('demandes de profil et de droits soumises à Grist',()=>{
  for(const table of ['DemandeInscription','DemandeDroits'])assert.match(app,new RegExp(table));
  assert.match(app,/submitProfile/);
  assert.match(app,/submitRights/);
  assert.match(app,/reviewEnrollment/);
  assert.match(app,/reviewRights/);
});
