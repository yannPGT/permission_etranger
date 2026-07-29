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
  assert.doesNotMatch(app,/FileReader|XMLHttpRequest/);
});

test('le PDF SOFIA utilise la fiche native Grist et reste obligatoire avant soumission',()=>{
  for(const id of ['managePdf','pdfDecisionFields','editActionPdf','pdfDecisionHint'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/grist\.setCursorPos\(\{rowId:Number\(requestId\)\}\)/);
  assert.match(app,/grist\.commandApi\.run\('viewAsCard'\)/);
  assert.match(app,/fetchTable\('Demandes'\)/);
  assert.match(app,/Promise\.all\(\[grist\.docApi\.fetchTable\('Demandes'\),grist\.docApi\.fetchTable\('VersionsPDF'\)\]\)/);
  assert.match(app,/if\(!hasRequestPdf\(d\)\)throw Error/);
  assert.doesNotMatch(app,/getAccessToken|\/attachments\?auth=|fetch\s*\(/);
});

test('les versions PDF sont reliées aux demandes et aux actions de validation',()=>{
  assert.match(app,/TABLES = \[[^\]]*'VersionsPDF'/);
  assert.match(app,/PDF_DECISION_STEPS = new Set\(\['CONTROLE_CONFORMITE','VALIDATION_CHEF_CORPS'\]\)/);
  assert.match(html,/value="SANS_MODIFICATION"/);
  assert.match(html,/value="NOUVELLE_VERSION"/);
  assert.match(app,/AddRecord','VersionsPDF'/);
  assert.match(app,/fetchTable\('VersionsPDF'\)/);
  assert.match(app,/latestAttachmentId\(d\.PiecesJointes\)\|\|latestAttachmentId\(activePdfVersion\(d\)\?\.Fichier\)/);
  assert.match(app,/VersionPrecedente/);
  assert.match(app,/VersionPDFActive:versionId/);
  assert.match(app,/VersionPDFEntree:pdfVersionId/);
  for(const field of ['TraitementPDF','VersionPDFSortie','CommentairePDF','DateValidationPDF','ValidationPDFPar'])assert.match(app,new RegExp(`${field}:`));
  assert.match(app,/tracksPdfDecision=acceptsPdf&&PDF_DECISION_STEPS\.has\(oldStep\)/);
});

test('la creation d une demande ne renseigne pas les colonnes formule Unite et Entite',()=>{
  assert.doesNotMatch(app,/PersonnelConcerne:user\.id,[^}]*\b(?:Unite|Entite):/);
  assert.match(app,/PersonnelConcerne:user\.id,DateDemande:/);
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
  assert.match(app,/VerifiePar:user\.id,DateVerification:nowSeconds\(\)/);
  assert.match(app,/TraitePar:user\.id,DateTraitement:nowSeconds\(\)/);
  assert.match(app,/data-enrollment-status="VERIFIEE"/);
  assert.match(app,/Statut:'EN_ATTENTE'/);
  assert.match(app,/saved\.Statut!==status/);
});

test('un administrateur voit et trace l auto validation de ses demandes',()=>{
  assert.match(app,/if\(isAdmin\)return true;/);
  assert.match(app,/Auto-validation administrateur/);
  assert.match(app,/CommentaireGestionnaire:\[comment,selfAudit\]/);
  assert.match(app,/CommentaireAdministrateur:\[comment,selfAudit\]/);
});

test('une demande retournee est modifiable sans toucher au personnel',()=>{
  for(const id of ['editRequest','requestFormTitle','requestFormSubmit','correctionReason'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/function openRequestEditor/);
  assert.match(app,/function updateRequest/);
  assert.match(app,/PersonnelConcerne\.disabled=true/);
  assert.match(app,/Modification des informations métier ; personnel, unité et entité conservés/);
  assert.doesNotMatch(app,/const changes=\{[^}]*PersonnelConcerne:/);
  assert.match(app,/TypeEvenement:'MODIFICATION_DEMANDE'/);
});

test('le motif de retour est affiche clairement depuis l action',()=>{
  assert.match(app,/function latestReturnAction/);
  assert.match(app,/a\.Decision==='RETOUR_CORRECTION'/);
  assert.match(app,/Motif de la demande de correction/);
  assert.match(app,/action\.MotifRetour/);
});

test('annulation motivee et historisee selon le role',()=>{
  assert.match(html,/id="cancelRequest"/);
  assert.match(app,/function canCancelRequest/);
  assert.match(app,/isManager&&Number\(d\.Unite\)===Number\(user\.Unite\)/);
  assert.match(app,/rowByCode\('Statuts','ANNULEE'\)/);
  assert.match(app,/StatutAction:'ANNULEE',Decision:'ANNULEE'/);
  assert.match(app,/TypeEvenement:'ANNULATION'/);
  assert.match(app,/DateCloture:timestamp/);
});

test('le detail affiche l etape et reserve le traitement aux actions workflow',()=>{
  assert.match(html,/id="detailStage"/);
  assert.match(app,/function requestProgressLabel/);
  assert.match(app,/En cours de validation par le gestionnaire d’unité/);
  assert.match(app,/En cours de contrôle par le responsable conformité/);
  assert.match(app,/\$\('#decisionForm'\)\.hidden=true/);
  assert.match(app,/\$\('#decisionForm'\)\.hidden=false/);
  assert.match(html,/\[hidden\]\{display:none!important\}/);
});

test('le bandeau identifie la version beta',()=>{
  assert.match(html,/class="beta-badge"/);
  assert.match(html,/>Bêta<\/span>/);
  assert.match(html,/build=20260729-2/);
});
