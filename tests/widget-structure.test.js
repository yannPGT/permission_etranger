const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','widget');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const core=fs.readFileSync(path.join(root,'workflow-core.js'),'utf8');

test('les vues principales existent',()=>{
  for(const id of ['dashboard','tasks','form','detail','profile','rights','managementTasks','enrollments','rightsAdmin','personnelAdmin'])assert.match(html,new RegExp(`id="${id}"`));
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
test('ajout de personnel sécurisé et import CSV local',()=>{
  for(const id of ['personnelForm','personnelCsv','importPersonnel','personnelPreviewRows'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/toUpperCase\(\)==='UTILISATEUR'/);
  assert.match(app,/Administrateur:false,GestionnaireUnite:false/);
  assert.match(app,/AddRecord','ContexteUtilisateur'/);
  assert.doesNotMatch(app,/FileReader|XMLHttpRequest|fetch\s*\(/);
});

test('la creation d une demande ne renseigne pas la colonne formule Entite',()=>{
  assert.doesNotMatch(app,/PersonnelConcerne:user\.id,Unite:user\.Unite,Entite:/);
  assert.match(app,/PersonnelConcerne:user\.id,Unite:user\.Unite,DateDemande:/);
});

test('le gestionnaire d unite est affecte avant la conformite',()=>{
  assert.match(core,/VALIDATION_GESTIONNAIRE/);
  assert.match(app,/GestionnairesAdministratifs/);
  assert.match(app,/stepCode==='VALIDATION_GESTIONNAIRE'/);
});

test('un administrateur peut superviser une action avec justification tracee',()=>{
  assert.match(html,/id="adminOverrideNotice"/);
  assert.match(app,/function isWorkflowAdmin/);
  assert.match(app,/override&&!comment/);
  assert.match(app,/Intervention administrateur/);
  assert.match(app,/TraiteePar:actor/);
});

test('les actions de gestion appliquent les modifications dans le perimetre autorise',()=>{
  assert.match(html,/id="managementTasksNav"/);
  assert.match(html,/id="managementTaskRows"/);
  assert.match(app,/const sameUnit=/);
  assert.match(app,/UpdateRecord','Personnel',target\.id,changes/);
  assert.match(app,/Seul un administrateur peut traiter les demandes de droits/);
  assert.match(app,/TraitePar:user\.id,DateTraitement:nowSeconds\(\)/);
});
