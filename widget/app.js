(() => {
  'use strict';
  const W = window.WorkflowCore;
  const TABLES = ['Demandes','Pays','Actions','Personnel','Roles','Statuts','EtapesWorkflow','Entites','Unites','CategoriesPays','ContexteUtilisateur','DemandeInscription','DemandeDroits'];
  const state = {data:{}, index:{}, grist:false, busy:false, currentAction:null, currentUser:null, personnelImport:[]};
  const $ = (s) => document.querySelector(s);
  const nowSeconds = () => Date.now() / 1000;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function notice(message, kind='info') {
    const box=$('#alert'); box.textContent=message||''; box.dataset.kind=kind;
    if(message) box.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function rows(table) {
    return (table.id || []).map((id,i) => Object.fromEntries(Object.keys(table).map(k => [k,table[k][i]])));
  }
  function makeIndex(name, key) {
    state.index[name+'ById']=new Map((state.data[name]||[]).map(r=>[Number(r.id),r]));
    if(key) state.index[name+'ByCode']=new Map((state.data[name]||[]).map(r=>[String(r[key]),r]));
  }
  function ref(name,id){return state.index[name+'ById']?.get(Number(id))||null;}
  function code(name,id,key='Code'){return ref(name,id)?.[key]||'';}
  function label(name,id,key){return ref(name,id)?.[key]||'';}
  function dateText(value,withTime=false){if(!value)return '—';const d=typeof value==='number'?new Date(value*1000):new Date(value);if(Number.isNaN(d.getTime()))return String(value);return new Intl.DateTimeFormat('fr-FR',withTime?{dateStyle:'short',timeStyle:'short'}:{dateStyle:'short'}).format(d);}
  function show(view){document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==view);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-current',b.dataset.view===view?'page':'false'));notice('');}

  function demandeView(d){
    const personnel=ref('Personnel',d.PersonnelConcerne), pays=ref('Pays',d.PaysDestination), statut=ref('Statuts',d.Statut), etape=ref('EtapesWorkflow',d.EtapeActuelle);
    return {...d, PersonnelNom:personnel?.NomComplet||'', PaysNom:pays?.NomPays||'', StatutCode:statut?.Code||'', StatutLibelle:statut?.Libelle||'', EtapeCode:etape?.Code||'', EtapeLibelle:etape?.Libelle||''};
  }
  function actionView(a){
    const d=ref('Demandes',a.Demande), dv=d?demandeView(d):null, etape=ref('EtapesWorkflow',a.Etape);
    return {...a, demande:d, demandeView:dv, EtapeCode:etape?.Code||'', EtapeLibelle:etape?.Libelle||''};
  }
  function requireCurrentUser(){
    if(!state.currentUser)throw Error('Utilisateur Grist non reconnu ou contexte utilisateur ambigu.');
    return state.currentUser;
  }
  function resolveCurrentUser(){
    const contexts=state.data.ContexteUtilisateur||[];
    if(contexts.length!==1)throw Error(`ContexteUtilisateur doit retourner exactement une ligne (reçu : ${contexts.length}).`);
    const personnel=ref('Personnel',contexts[0].Personnel);
    if(!personnel)throw Error('La ligne ContexteUtilisateur ne référence aucune fiche Personnel accessible.');
    if(personnel.Actif===false)throw Error('La fiche Personnel de l\'utilisateur est inactive.');
    state.currentUser=personnel;
  }
  function pendingActions(){const user=state.currentUser;return (state.data.Actions||[]).filter(a=>user&&Number(a.AssigneeA)===Number(user.id)&&['A_FAIRE','EN_COURS'].includes(a.StatutAction)).map(actionView).filter(a=>a.demande);}

  function render(){
    const demandes=(state.data.Demandes||[]).map(demandeView), tasks=pendingActions(), today=new Date();today.setHours(0,0,0,0);
    const late=demandes.filter(d=>d.HorsDelai===true||(!d.StatutCode.match(/TRANSMISE|CLOTUREE|ARCHIVEE|REFUSEE/)&&d.DateLimiteTraitement&&new Date(d.DateLimiteTraitement*1000)<today)).length;
    $('#cards').innerHTML=[['Actions à traiter',tasks.length,'tasks'],['Demandes urgentes',demandes.filter(d=>d.Urgente).length,'dashboard'],['⚠ Hors délai',late,'dashboard'],['À corriger',demandes.filter(d=>d.StatutCode==='A_CORRIGER').length,'dashboard']].map(([t,n,v])=>`<button class="card" data-card-view="${v}"><strong>${n}</strong>${esc(t)}</button>`).join('');
    document.querySelectorAll('[data-card-view]').forEach(b=>b.onclick=()=>show(b.dataset.cardView));
    $('#taskBadge').textContent=tasks.length;
    const statuses=[...new Set(demandes.map(d=>d.StatutLibelle).filter(Boolean))];
    $('#filter').innerHTML='<option value="">Tous</option>'+statuses.map(s=>`<option>${esc(s)}</option>`).join('');
    renderRequests(); renderTasks(); renderFormOptions(); renderAccessRequests();
  }
  function renderRequests(){
    const q=$('#search').value.toLowerCase(), f=$('#filter').value, today=Date.now()/1000;
    const list=(state.data.Demandes||[]).map(demandeView).filter(d=>(!f||d.StatutLibelle===f)&&JSON.stringify(d).toLowerCase().includes(q));
    $('#requestRows').innerHTML=list.map(d=>{const late=d.HorsDelai===true||(d.DateLimiteTraitement&&d.DateLimiteTraitement<today&&!W.TERMINAUX.has(d.StatutCode));return `<tr><td>${esc(d.Reference)}</td><td>${esc(d.PersonnelNom)}</td><td>${esc(d.PaysNom)}</td><td>${esc(d.StatutLibelle)}</td><td class="${late?'late':''}">${late?'⚠ Hors délai — ':''}${dateText(d.DateLimiteTraitement)}</td><td><button data-request-id="${d.id}">Ouvrir</button></td></tr>`}).join('')||'<tr><td colspan="6">Aucun dossier correspondant.</td></tr>';
    document.querySelectorAll('[data-request-id]').forEach(b=>b.onclick=()=>openRequest(Number(b.dataset.requestId)));
  }
  function renderTasks(){
    const tasks=pendingActions();
    $('#taskRows').innerHTML=tasks.map(a=>`<tr><td>${esc(a.demandeView.Reference)}</td><td>${esc(a.EtapeLibelle)}</td><td>${esc(a.demandeView.PersonnelNom)}</td><td>${dateText(a.DateTransmission,true)}</td><td>${a.demande.Urgente?'⚑ Urgente':'Normale'}</td><td><button class="primary" data-action-id="${a.id}" data-action-status="${a.StatutAction}">${a.StatutAction==='A_FAIRE'?'Prendre en charge':'Traiter'}</button></td></tr>`).join('')||'<tr><td colspan="6">Aucune action en attente dans votre périmètre.</td></tr>';
    document.querySelectorAll('[data-action-id]').forEach(b=>b.onclick=()=>b.dataset.actionStatus==='A_FAIRE'?takeAction(Number(b.dataset.actionId)):openAction(Number(b.dataset.actionId)));
  }
  function renderFormOptions(){
    const personnel=state.currentUser?[state.currentUser]:[], pays=(state.data.Pays||[]).filter(p=>p.Actif!==false);
    $('[name=PersonnelConcerne]').innerHTML='<option value="">Choisir</option>'+personnel.map(p=>`<option value="${p.id}" data-unit="${p.Unite||''}">${esc(p.NomComplet)}</option>`).join('');
    $('[name=PaysDestination]').innerHTML='<option value="">Choisir</option>'+pays.map(p=>`<option value="${p.id}">${esc(p.NomPays)}</option>`).join('');
  }
  function currentRoleCode(){return code('Roles',state.currentUser?.Role,'CodeRole');}
  function personnelAccess(){
    const user=requireCurrentUser(),role=currentRoleCode();
    return {user,isAdmin:user.Administrateur===true||role==='ADMIN',isManager:user.GestionnaireUnite===true||role==='GESTIONNAIRE'};
  }
  function allowedPersonnelUnits(){
    const {user,isAdmin}=personnelAccess();
    return (state.data.Unites||[]).filter(u=>u.Active!==false&&(isAdmin||Number(u.id)===Number(user.Unite)));
  }
  function latestOwn(table){return (state.data[table]||[]).filter(r=>Number(r.Personnel)===Number(state.currentUser?.id)).sort((a,b)=>Number(b.id)-Number(a.id))[0]||null;}
  function openOwn(table){return (state.data[table]||[]).find(r=>Number(r.Personnel)===Number(state.currentUser?.id)&&['EN_ATTENTE','A_COMPLETER'].includes(r.Statut))||null;}
  function renderAccessRequests(){
    const {user,isAdmin,isManager}=personnelAccess();
    const units=(state.data.Unites||[]).filter(u=>u.Active!==false),roles=(state.data.Roles||[]);
    const enrollment=latestOwn('DemandeInscription'),rights=latestOwn('DemandeDroits');
    const pf=$('#profileForm');pf.elements.Nom.value=enrollment?.Nom||user.Nom||'';pf.elements.Prenom.value=enrollment?.Prenom||user.Prenom||'';pf.elements.Matricule.value=enrollment?.Matricule||user.Matricule||'';
    pf.elements.UniteDemandee.innerHTML='<option value="">Choisir</option>'+units.map(u=>`<option value="${u.id}">${esc(u.LibelleUnite||u.CodeUnite)}</option>`).join('');
    pf.elements.UniteDemandee.value=String(enrollment?.UniteDemandee||user.Unite||'');pf.elements.CommentaireDemandeur.value=enrollment?.CommentaireDemandeur||'';
    $('#profileStatus').textContent=enrollment?`Dernière demande : ${enrollment.Statut}${enrollment.CommentaireGestionnaire?'\nCommentaire : '+enrollment.CommentaireGestionnaire:''}`:'Aucune demande de profil en cours.';
    const rf=$('#rightsForm');rf.elements.RoleDemande.innerHTML='<option value="">Aucun changement de rôle</option>'+roles.map(r=>`<option value="${r.id}">${esc(r.Libelle||r.CodeRole)}</option>`).join('');
    rf.elements.RoleDemande.value=String(rights?.RoleDemande||'');rf.elements.GestionnaireUniteDemande.checked=rights?.GestionnaireUniteDemande===true;rf.elements.AdministrateurDemande.checked=rights?.AdministrateurDemande===true;rf.elements.Motif.value=rights?.Motif||'';
    $('#rightsStatus').textContent=rights?`Dernière demande : ${rights.Statut}${rights.CommentaireAdministrateur?'\nCommentaire : '+rights.CommentaireAdministrateur:''}`:'Aucune demande de droits en cours.';
    const enrollmentTasks=(state.data.DemandeInscription||[]).filter(r=>Number(r.Personnel)!==Number(user.id)&&r.Statut==='EN_ATTENTE');
    $('#enrollmentNav').hidden=!(isManager||isAdmin||enrollmentTasks.length);
    $('#enrollmentRows').innerHTML=enrollmentTasks.map(r=>`<tr><td>${esc(label('Personnel',r.Personnel,'NomComplet'))}</td><td>${esc(`${r.Prenom||''} ${r.Nom||''}`.trim())}</td><td>${esc(label('Unites',r.UniteDemandee,'LibelleUnite'))}</td><td>${esc(r.Statut)}</td><td>${esc(r.CommentaireDemandeur||'')}</td><td class="row-actions"><button data-enrollment-id="${r.id}" data-enrollment-status="VERIFIEE" class="primary">Vérifier</button><button data-enrollment-id="${r.id}" data-enrollment-status="A_COMPLETER">Complément</button><button data-enrollment-id="${r.id}" data-enrollment-status="REFUSEE">Refuser</button></td></tr>`).join('')||'<tr><td colspan="6">Aucune inscription en attente.</td></tr>';
    document.querySelectorAll('[data-enrollment-id]').forEach(b=>b.onclick=()=>reviewEnrollment(Number(b.dataset.enrollmentId),b.dataset.enrollmentStatus));
    const rightTasks=(state.data.DemandeDroits||[]).filter(r=>Number(r.Personnel)!==Number(user.id)&&['EN_ATTENTE','APPROUVEE'].includes(r.Statut));
    $('#rightsAdminNav').hidden=!(isAdmin||rightTasks.length);
    $('#rightsAdminRows').innerHTML=rightTasks.map(r=>{const options=[r.GestionnaireUniteDemande?'Gestionnaire':'',r.AdministrateurDemande?'Administrateur':''].filter(Boolean).join(', ')||'—';const buttons=r.Statut==='APPROUVEE'?`<button class="primary" data-right-id="${r.id}" data-right-action="APPLIQUER">Appliquer</button>`:`<button class="primary" data-right-id="${r.id}" data-right-action="APPROUVEE">Approuver</button><button data-right-id="${r.id}" data-right-action="A_COMPLETER">Complément</button><button data-right-id="${r.id}" data-right-action="REFUSEE">Refuser</button>`;return `<tr><td>${esc(label('Personnel',r.Personnel,'NomComplet'))}</td><td>${esc(label('Roles',r.RoleDemande,'Libelle')||'—')}</td><td>${esc(options)}</td><td>${esc(r.Motif||'')}</td><td>${esc(r.Statut)}</td><td class="row-actions">${buttons}</td></tr>`}).join('')||'<tr><td colspan="6">Aucune demande de droits en attente.</td></tr>';
    document.querySelectorAll('[data-right-id]').forEach(b=>b.onclick=()=>reviewRights(Number(b.dataset.rightId),b.dataset.rightAction));
    const canAddPersonnel=isAdmin||isManager;
    $('#managementNavGroup').hidden=!canAddPersonnel&&!enrollmentTasks.length&&!rightTasks.length;
    $('#personnelNav').hidden=!canAddPersonnel;
    const personnelUnit=$('#personnelForm').elements.Unite;
    personnelUnit.innerHTML='<option value="">Choisir</option>'+allowedPersonnelUnits().map(u=>`<option value="${u.id}">${esc(u.LibelleUnite||u.CodeUnite)}</option>`).join('');
    if(isManager&&!isAdmin&&user.Unite)personnelUnit.value=String(user.Unite);
    renderPersonnelPreview();
  }

  function normalizeEmail(value){return String(value||'').trim().toLowerCase();}
  function roleUtilisateur(){return (state.data.Roles||[]).find(r=>String(r.CodeRole||'').toUpperCase()==='UTILISATEUR');}
  function validatePersonnel(input,seen=new Set()){
    const email=normalizeEmail(input.EmailProConnect),unit=allowedPersonnelUnits().find(u=>String(u.id)===String(input.Unite)||String(u.CodeUnite||'').toUpperCase()===String(input.CodeUnite||'').trim().toUpperCase());
    const errors=[];
    if(!email||!/^\S+@\S+\.\S+$/.test(email))errors.push('courriel invalide');
    if(!String(input.Nom||'').trim())errors.push('nom manquant');
    if(!String(input.Prenom||'').trim())errors.push('prénom manquant');
    if(!unit)errors.push('unité inconnue ou non autorisée');
    if(seen.has(email))errors.push('doublon dans le fichier');
    if((state.data.Personnel||[]).some(p=>normalizeEmail(p.EmailProConnect)===email))errors.push('personnel déjà présent');
    if(email)seen.add(email);
    if(!roleUtilisateur())errors.push('rôle UTILISATEUR introuvable');
    return {...input,EmailProConnect:email,Nom:String(input.Nom||'').trim(),Prenom:String(input.Prenom||'').trim(),Matricule:String(input.Matricule||'').trim(),Unite:unit?.id||null,Entite:unit?.Entite||null,errors,valid:errors.length===0};
  }
  function parseCsv(text){
    const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim());
    if(!lines.length)return [];
    const delimiter=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',';
    const parse=line=>{const out=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){out.push(value.trim());value='';}else value+=c;}out.push(value.trim());return out;};
    const headers=parse(lines.shift()).map(h=>h.trim());
    const required=['EmailProConnect','Nom','Prenom','Matricule','CodeUnite'];
    if(required.some(h=>!headers.includes(h)))throw Error(`En-têtes attendus : ${required.join(';')}`);
    return lines.map(line=>Object.fromEntries(headers.map((h,i)=>[h,parse(line)[i]||''])));
  }
  function renderPersonnelPreview(){
    const rows=state.personnelImport||[];
    $('#personnelPreviewRows').innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.EmailProConnect)}</td><td>${esc(r.Nom)}</td><td>${esc(r.Prenom)}</td><td>${esc(label('Unites',r.Unite,'LibelleUnite')||r.CodeUnite)}</td><td class="${r.valid?'valid':'late'}">${r.valid?'Prêt':esc(r.errors.join(', '))}</td></tr>`).join('')||'<tr><td colspan="6">Aucun fichier chargé.</td></tr>';
    $('#importPersonnel').disabled=!rows.some(r=>r.valid)||state.busy;
  }
  async function createPersonnel(input){
    const checked=validatePersonnel(input);if(!checked.valid)throw Error(checked.errors.join(', '));
    const role=roleUtilisateur(),fields={EmailProConnect:checked.EmailProConnect,Nom:checked.Nom,Prenom:checked.Prenom,Matricule:checked.Matricule,Unite:checked.Unite,Entite:checked.Entite,Role:role.id,Actif:true,Administrateur:false,GestionnaireUnite:false};
    await grist.docApi.applyUserActions([['AddRecord','Personnel',null,fields]]);
    const personnel=rows(await grist.docApi.fetchTable('Personnel')).find(p=>normalizeEmail(p.EmailProConnect)===checked.EmailProConnect);
    if(!personnel)throw Error('fiche créée mais impossible à relire');
    const contexts=rows(await grist.docApi.fetchTable('ContexteUtilisateur'));
    if(!contexts.some(c=>Number(c.Personnel)===Number(personnel.id)))await grist.docApi.applyUserActions([['AddRecord','ContexteUtilisateur',null,{Personnel:personnel.id}]]);
  }
  async function submitPersonnel(form,submit){
    if(state.busy)return;const fd=new FormData(form),input=Object.fromEntries(fd),checked=validatePersonnel(input);if(!checked.valid){notice(checked.errors.join('. ')+'.','error');return;}
    if(!confirm(`Ajouter ${checked.Prenom} ${checked.Nom} comme utilisateur standard ?`))return;
    state.busy=true;submit.disabled=true;try{await createPersonnel(checked);form.reset();await refresh();show('personnelAdmin');notice('Personnel ajouté. Pensez à l’inviter dans « Gérer les utilisateurs » de Grist.','success');}catch(e){notice('Ajout impossible : '+e.message,'error');}finally{state.busy=false;submit.disabled=false;}
  }
  async function loadPersonnelCsv(file){
    try{if(!file)return;if(file.size>2*1024*1024)throw Error('Le fichier dépasse 2 Mo.');const raw=parseCsv(await file.text());if(raw.length>500)throw Error('Le fichier est limité à 500 lignes par import.');const seen=new Set();state.personnelImport=raw.map(r=>validatePersonnel(r,seen));renderPersonnelPreview();notice(`${state.personnelImport.filter(r=>r.valid).length} ligne(s) prête(s) à importer.`,'success');}catch(e){state.personnelImport=[];renderPersonnelPreview();notice('Lecture CSV impossible : '+e.message,'error');}
  }
  async function importPersonnel(){
    const valid=(state.personnelImport||[]).filter(r=>r.valid);if(state.busy||!valid.length)return;if(!confirm(`Importer ${valid.length} personne(s) ?`))return;
    state.busy=true;renderPersonnelPreview();let added=0;const failures=[];
    for(const row of valid){try{await createPersonnel(row);added++;}catch(e){failures.push(`${row.EmailProConnect}: ${e.message}`);}}
    try{await refresh();show('personnelAdmin');state.personnelImport=[];renderPersonnelPreview();notice(`${added} personne(s) ajoutée(s).${failures.length?' Échecs : '+failures.join(' | '):' N’oubliez pas de les inviter dans Grist.'}`,failures.length?'error':'success');}catch(e){notice(`Import partiellement terminé (${added} ajout(s)) : ${e.message}`,'error');}finally{state.busy=false;renderPersonnelPreview();}
  }
  function detailMarkup(d){
    const unit=ref('Unites',d.Unite), entity=ref('Entites',d.Entite), category=ref('CategoriesPays',d.CategoriePays);
    return [['Personnel',d.PersonnelNom],['Unité',unit?.LibelleUnite],['Entité',entity?.LibelleEntite],['Pays',d.PaysNom],['Catégorie',category?.Libelle],['Séjour',dateText(d.DateDebutSejour)+' → '+dateText(d.DateFinSejour)],['Statut',d.StatutLibelle],['Étape',d.EtapeLibelle],['Urgence',d.Urgente?'Oui — '+(d.JustificationUrgence||'justification absente'):'Non'],['Motif',d.MotifDeplacement],['Date limite',dateText(d.DateLimiteTraitement)]].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||'—')}</dd></div>`).join('');
  }
  function openRequest(id){const d=demandeView(ref('Demandes',id));if(!d)return;const user=requireCurrentUser();state.currentAction=null;state.currentRequest=d;$('#detailRef').textContent=d.Reference||('#'+id);$('#detailBody').innerHTML=detailMarkup(d);$('#decisionForm').hidden=true;const isAuthor=[d.CreeePar,d.Demandeur].some(x=>Number(x)===Number(user.id));const canSubmit=isAuthor&&['BROUILLON','A_CORRIGER'].includes(d.StatutCode);$('#requestWorkflowActions').hidden=!canSubmit;if(canSubmit){$('#submitRequest').textContent=d.StatutCode==='A_CORRIGER'?'Soumettre à nouveau':'Soumettre la demande';$('#submitRequestHint').textContent='Le PDF SOFIA doit être présent dans la colonne Pièces jointes Grist.';}show('detail');}
  function openAction(id){const user=requireCurrentUser(),raw=ref('Actions',id),a=raw&&actionView(raw);if(!a||Number(a.AssigneeA)!==Number(user.id)){notice('Cette action ne vous est pas assignée.','error');return;}state.currentAction=a;state.currentRequest=a.demandeView;$('#requestWorkflowActions').hidden=true;$('#detailRef').textContent=a.demandeView.Reference||('#'+a.Demande);$('#detailBody').innerHTML=detailMarkup(a.demandeView);const decisions=W.decisionsPour(a.EtapeCode),labels={VALIDER:a.EtapeCode==='VALIDATION_CHEF_CORPS'?'Avis favorable':'Valider',RETOURNER:'Retourner pour correction',REFUSER:'Refuser définitivement',TRANSMETTRE:'Transmettre à la BSPS'};const select=$('#decisionForm [name=Decision]');select.innerHTML='<option value="">Choisir</option>'+decisions.map(x=>`<option value="${x}">${esc(labels[x])}</option>`).join('');$('#decisionForm').hidden=false;show('detail');}

  function rowByCode(table,codeValue){const r=state.index[table+'ByCode']?.get(codeValue);if(!r)throw Error(`${table} : code ${codeValue} introuvable.`);return r;}
  function effectiveResponsible(d,stepCode){
    const unit=ref('Unites',d.Unite), entity=ref('Entites',d.Entite);
    if(stepCode==='CONTROLE_CONFORMITE') return unit?.ResponsableConformite||entity?.ResponsableConformite||null;
    if(stepCode==='VALIDATION_CHEF_CORPS') return unit?.ChefDeCorps||entity?.ChefDeCorps||null;
    if(stepCode==='TRANSMISSION_BSPS') return entity?.ResponsableBSPS||null;
    return d.Demandeur||d.CreeePar||null;
  }
  async function takeAction(id){
    if(state.busy)return;if(!state.grist){openAction(id);notice('Prise en charge simulée : aucune écriture réelle.');return;}state.busy=true;
    try{
      const user=requireCurrentUser(),action=ref('Actions',id);if(!action||Number(action.AssigneeA)!==Number(user.id)||action.StatutAction!=='A_FAIRE')throw Error('Cette action ne vous est pas assignée ou n’est plus disponible.');
      await grist.docApi.applyUserActions([['UpdateRecord','Actions',id,{StatutAction:'EN_COURS',DateAccuseReception:action.DateAccuseReception||nowSeconds(),DatePriseEnCharge:nowSeconds()}]]);
      await refresh();openAction(id);notice('Action prise en charge. Vous pouvez maintenant enregistrer votre décision.','success');
    }catch(e){notice('Prise en charge impossible : '+e.message,'error');}
    finally{state.busy=false;}
  }
  async function refresh(){
    if(!state.grist){demo();return;}
    const fetched=await Promise.all(TABLES.map(t=>grist.docApi.fetchTable(t)));
    TABLES.forEach((t,i)=>state.data[t]=rows(fetched[i]));
    makeIndex('Demandes');makeIndex('Pays','CodePays');makeIndex('Actions');makeIndex('Personnel');makeIndex('Roles','CodeRole');makeIndex('Statuts','Code');makeIndex('EtapesWorkflow','Code');makeIndex('Entites','CodeEntite');makeIndex('Unites','CodeUnite');makeIndex('CategoriesPays','CodeCategorie');makeIndex('DemandeInscription');makeIndex('DemandeDroits');
    resolveCurrentUser();
    render();
  }
  async function decide(form){
    if(state.busy||!state.currentAction)return;
    const fd=new FormData(form), decision=fd.get('Decision'), motif=String(fd.get('MotifRetour')||'').trim(), comment=String(fd.get('Commentaire')||'').trim(), action=state.currentAction, d=action.demande, oldStatus=code('Statuts',d.Statut), oldStep=action.EtapeCode;
    const next=W.verifieDecision(oldStatus,oldStep,decision,motif);
    if(!state.grist){notice('Décision simulée : aucune écriture réelle.');return;}
    if(!confirm('Confirmer cette décision ? Elle sera inscrite dans l’historique.'))return;
    state.busy=true;const submit=form.querySelector('[type=submit]');submit.disabled=true;
    try{
      const user=requireCurrentUser(),fresh=rows(await grist.docApi.fetchTable('Actions')).find(x=>Number(x.id)===Number(action.id));
      if(!fresh||Number(fresh.AssigneeA)!==Number(user.id)||fresh.StatutAction!=='EN_COURS')throw Error('Cette action ne vous est pas assignée, n’a pas été prise en charge ou a déjà été traitée.');
      const nextStatus=rowByCode('Statuts',next.statut), nextStep=rowByCode('EtapesWorkflow',next.etape), isReturn=decision==='RETOURNER', isTerminal=W.TERMINAUX.has(next.statut), actor=user.id, nextResponsible=isReturn?(d.Demandeur||d.CreeePar||null):effectiveResponsible(d,next.etape);
      if(!isReturn&&!isTerminal&&!nextResponsible)throw Error('Aucun responsable actif n’est configuré pour l’étape suivante.');
      const actionStatus=isReturn?'RETOURNEE':'TRAITEE', normalized={VALIDER:'VALIDEE',RETOURNER:'RETOUR_CORRECTION',REFUSER:'REFUSEE',TRANSMETTRE:'TRANSMISE_BSPS'}[decision];
      const actions=[
        ['UpdateRecord','Actions',action.id,{StatutAction:actionStatus,Decision:normalized,MotifRetour:motif,Commentaire:comment,DateTraitement:nowSeconds(),TraiteePar:actor}],
        ['UpdateRecord','Demandes',d.id,{Statut:nextStatus.id,EtapeActuelle:nextStep.id,ResponsableActuel:nextResponsible,DateDerniereAction:nowSeconds(),Revision:Number(d.Revision||0)+1,...(isTerminal?{DateCloture:nowSeconds()}:{})}],
        ['AddRecord','Historique',null,{Demande:d.id,Version:Number(d.Version||1),DateHeure:nowSeconds(),Utilisateur:actor,TypeEvenement:next.event,AncienStatut:d.Statut,NouveauStatut:nextStatus.id,AncienneEtape:action.Etape,NouvelleEtape:nextStep.id,Commentaire:motif||comment,ResumeModification:`Décision ${normalized} sur l’action ${action.id}`}]
      ];
      if(!isReturn&&!isTerminal){const role=ref('Roles',nextStep.RoleResponsable);if(!role)throw Error('Le rôle responsable de l’étape suivante n’est pas configuré.');actions.push(['AddRecord','Actions',null,{Demande:d.id,Etape:nextStep.id,VersionDemande:Number(d.Version||1),AssigneeA:nextResponsible,RoleAssigne:role.id,StatutAction:'A_FAIRE',DateTransmission:nowSeconds()}]);}
      await grist.docApi.applyUserActions(actions);
      form.reset();state.currentAction=null;await refresh();show('tasks');notice('Décision enregistrée et workflow mis à jour.','success');
    }catch(e){notice('Décision non enregistrée : '+e.message,'error');}
    finally{state.busy=false;submit.disabled=false;}
  }
  function hasAttachment(value){return Array.isArray(value)?value.filter(x=>x!=='L').length>0:Boolean(value);}
  async function submitCurrentRequest(){
    if(state.busy||!state.currentRequest)return;const d=state.currentRequest;
    try{
      const target=W.cibleSoumission(d.StatutCode,d.EtapeCode),errors=W.valide(d);
      if(errors.length)throw Error(errors.join(' '));
      if(!state.grist){notice(`Soumission simulée vers ${target.etape} : aucune écriture réelle.`);return;}
      if(!hasAttachment(d.PiecesJointes))throw Error('Ajoutez le PDF SOFIA dans la colonne Pièces jointes Grist avant la soumission.');
      const duplicate=(state.data.Actions||[]).some(a=>Number(a.Demande)===Number(d.id)&&['A_FAIRE','EN_COURS'].includes(a.StatutAction));
      if(duplicate)throw Error('Une action est déjà en attente pour cette demande.');
      const step=rowByCode('EtapesWorkflow',target.etape),status=rowByCode('Statuts',target.statut),role=ref('Roles',step.RoleResponsable),responsible=effectiveResponsible(d,target.etape);
      if(!role)throw Error('Le rôle responsable de l’étape cible n’est pas configuré.');
      if(!responsible)throw Error('Aucun responsable n’est configuré pour l’étape cible.');
      if(!confirm(target.incrementVersion?'Soumettre à nouveau cette demande ?':'Soumettre cette demande ?'))return;
      state.busy=true;$('#submitRequest').disabled=true;
      const user=requireCurrentUser();
      if(![d.CreeePar,d.Demandeur].some(x=>Number(x)===Number(user.id)))throw Error('Vous n’êtes pas l\'auteur de cette demande.');
      const version=Number(d.Version||1)+(target.incrementVersion?1:0),actor=user.id;
      await grist.docApi.applyUserActions([
        ['UpdateRecord','Demandes',d.id,{Version:version,Statut:status.id,EtapeActuelle:step.id,ResponsableActuel:responsible,DateSoumission:nowSeconds(),DateDerniereAction:nowSeconds(),Revision:Number(d.Revision||0)+1}],
        ['AddRecord','Actions',null,{Demande:d.id,Etape:step.id,VersionDemande:version,AssigneeA:responsible,RoleAssigne:role.id,StatutAction:'A_FAIRE',DateTransmission:nowSeconds()}],
        ['AddRecord','Historique',null,{Demande:d.id,Version:version,DateHeure:nowSeconds(),Utilisateur:actor,TypeEvenement:target.event,AncienStatut:d.Statut,NouveauStatut:status.id,AncienneEtape:d.EtapeActuelle,NouvelleEtape:step.id,Commentaire:target.incrementVersion?'Demande corrigée et soumise à nouveau.':'Première soumission.',ResumeModification:`Création d’une action ${target.etape}`}]
      ]);
      await refresh();show('dashboard');notice(target.incrementVersion?'Demande soumise à nouveau.':'Demande soumise au contrôle de conformité.','success');
    }catch(e){notice('Soumission impossible : '+e.message,'error');}
    finally{state.busy=false;$('#submitRequest').disabled=false;}
  }
  async function createDraft(form,submit){
    if(state.busy)return;const fd=new FormData(form),d=Object.fromEntries(fd);d.Urgente=fd.has('Urgente');const errors=W.valide(d),file=fd.get('Pdf');if(file&&file.size&&(!file.name.toLowerCase().endsWith('.pdf')||(file.type&&file.type!=='application/pdf')))errors.push('Seuls les fichiers PDF sont autorisés.');if(errors.length){notice(errors.join(' '),'error');return;}if(!confirm('Enregistrer ce brouillon ?'))return;
    state.busy=true;submit.disabled=true;
    try{if(!state.grist){notice('Brouillon simulé : aucune écriture effectuée.');return;}const user=requireCurrentUser(),status=rowByCode('Statuts','BROUILLON'),step=rowByCode('EtapesWorkflow','DEMANDE_INITIALE'),reference=`DPE-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`,createdAt=nowSeconds();if(!user.Unite||!user.Entite)throw Error('Votre fiche Personnel doit contenir une unité et une entité.');await grist.docApi.applyUserActions([['AddRecord','Demandes',null,{Reference:reference,ReferenceHistorique:reference,Version:1,Revision:0,CreeePar:user.id,Demandeur:user.id,PersonnelConcerne:user.id,Unite:user.Unite,Entite:user.Entite,DateDemande:createdAt,PaysDestination:Number(d.PaysDestination),Objet:d.Objet||'',DateDebutSejour:new Date(d.DateDebutSejour+'T12:00:00').getTime()/1000,DateFinSejour:new Date(d.DateFinSejour+'T12:00:00').getTime()/1000,MotifDeplacement:d.MotifDeplacement,Urgente:d.Urgente,JustificationUrgence:d.JustificationUrgence||'',Statut:status.id,EtapeActuelle:step.id,Archivee:false}]]);form.reset();await refresh();show('dashboard');notice(`Brouillon ${reference} créé. Ajoutez le PDF dans Grist avant soumission.`,'success');}catch(e){notice('Écriture refusée par Grist : '+e.message,'error');}finally{state.busy=false;submit.disabled=false;}
  }
  async function submitProfile(form,submit){
    if(state.busy)return;const user=requireCurrentUser(),fd=new FormData(form),existing=openOwn('DemandeInscription');
    const fields={Nom:String(fd.get('Nom')||'').trim(),Prenom:String(fd.get('Prenom')||'').trim(),Matricule:String(fd.get('Matricule')||'').trim(),UniteDemandee:Number(fd.get('UniteDemandee')),CommentaireDemandeur:String(fd.get('CommentaireDemandeur')||'').trim()};
    if(!fields.Nom||!fields.Prenom||!fields.UniteDemandee){notice('Nom, prénom et unité sont obligatoires.','error');return;}if(existing&&!['EN_ATTENTE','A_COMPLETER'].includes(existing.Statut)){notice('Votre dernière demande ne peut plus être modifiée.','error');return;}
    state.busy=true;submit.disabled=true;try{const action=existing?['UpdateRecord','DemandeInscription',existing.id,{...fields,...(existing.Statut==='A_COMPLETER'?{Statut:'EN_ATTENTE'}:{})}]:['AddRecord','DemandeInscription',null,{Personnel:user.id,...fields}];await grist.docApi.applyUserActions([action]);await refresh();notice('Demande de profil enregistrée.','success');}catch(e){notice('Demande de profil refusée : '+e.message,'error');}finally{state.busy=false;submit.disabled=false;}
  }
  async function submitRights(form,submit){
    if(state.busy)return;const user=requireCurrentUser(),fd=new FormData(form),existing=openOwn('DemandeDroits');
    const fields={RoleDemande:Number(fd.get('RoleDemande'))||null,GestionnaireUniteDemande:fd.has('GestionnaireUniteDemande'),AdministrateurDemande:fd.has('AdministrateurDemande'),Motif:String(fd.get('Motif')||'').trim()};
    if(!fields.Motif||(!fields.RoleDemande&&!fields.GestionnaireUniteDemande&&!fields.AdministrateurDemande)){notice('Indiquez au moins un droit et son motif.','error');return;}if(existing&&!['EN_ATTENTE','A_COMPLETER'].includes(existing.Statut)){notice('Votre dernière demande ne peut plus être modifiée.','error');return;}
    state.busy=true;submit.disabled=true;try{const action=existing?['UpdateRecord','DemandeDroits',existing.id,{...fields,...(existing.Statut==='A_COMPLETER'?{Statut:'EN_ATTENTE'}:{})}]:['AddRecord','DemandeDroits',null,{Personnel:user.id,...fields}];await grist.docApi.applyUserActions([action]);await refresh();notice('Demande de droits enregistrée.','success');}catch(e){notice('Demande de droits refusée : '+e.message,'error');}finally{state.busy=false;submit.disabled=false;}
  }
  async function reviewEnrollment(id,status){
    if(state.busy)return;const row=ref('DemandeInscription',id);if(!row||row.Statut!=='EN_ATTENTE')return;const comment=status==='VERIFIEE'?'':String(prompt(status==='A_COMPLETER'?'Précisez les informations manquantes :':'Précisez le motif du refus :')||'').trim();if(status!=='VERIFIEE'&&!comment)return;
    state.busy=true;try{await grist.docApi.applyUserActions([['UpdateRecord','DemandeInscription',id,{Statut:status,CommentaireGestionnaire:comment}]]);await refresh();notice('Décision d\'inscription enregistrée.','success');}catch(e){notice('Décision refusée : '+e.message,'error');}finally{state.busy=false;}
  }
  async function reviewRights(id,action){
    if(state.busy)return;const row=ref('DemandeDroits',id);if(!row)return;let actions=[];
    if(action==='APPLIQUER'){if(row.Statut!=='APPROUVEE')return;const changes={};if(row.RoleDemande)changes.Role=row.RoleDemande;if(row.GestionnaireUniteDemande)changes.GestionnaireUnite=true;if(row.AdministrateurDemande)changes.Administrateur=true;actions=[['UpdateRecord','Personnel',row.Personnel,changes],['UpdateRecord','DemandeDroits',id,{Statut:'TRAITEE'}]];}
    else{if(row.Statut!=='EN_ATTENTE')return;const comment=action==='APPROUVEE'?'':String(prompt(action==='A_COMPLETER'?'Précisez les informations manquantes :':'Précisez le motif du refus :')||'').trim();if(action!=='APPROUVEE'&&!comment)return;actions=[['UpdateRecord','DemandeDroits',id,{Statut:action,CommentaireAdministrateur:comment}]];}
    state.busy=true;try{await grist.docApi.applyUserActions(actions);await refresh();notice(action==='APPLIQUER'?'Droits appliqués au personnel.':'Décision administrative enregistrée.','success');}catch(e){notice('Traitement refusé : '+e.message,'error');}finally{state.busy=false;}
  }
  function demo(){
    state.data={Statuts:[{id:1,Code:'A_CONTROLER',Libelle:'À contrôler'},{id:2,Code:'A_CORRIGER',Libelle:'À corriger'}],EtapesWorkflow:[{id:1,Code:'CONTROLE_CONFORMITE',Libelle:'Contrôle de conformité'}],Personnel:[{id:1,NomComplet:'Camille Martin',Nom:'Martin',Prenom:'Camille',Actif:true}],ContexteUtilisateur:[{id:1,Personnel:1}],DemandeInscription:[],DemandeDroits:[],Pays:[{id:1,NomPays:'Albanie',Actif:true}],Roles:[],Entites:[],Unites:[],CategoriesPays:[],Demandes:[{id:1,Reference:'DPE-DEMO-0001',CreeePar:1,Demandeur:1,PersonnelConcerne:1,PaysDestination:1,Statut:1,EtapeActuelle:1,Urgente:true,DateLimiteTraitement:Date.now()/1000-86400,MotifDeplacement:'Démonstration'}],Actions:[{id:1,Demande:1,Etape:1,AssigneeA:1,StatutAction:'A_FAIRE',DateTransmission:Date.now()/1000}]};
    ['Demandes','Pays','Actions','Personnel','Roles','Statuts','EtapesWorkflow','Entites','Unites','CategoriesPays','DemandeInscription','DemandeDroits'].forEach(t=>makeIndex(t,t==='Roles'?'CodeRole':t==='Statuts'||t==='EtapesWorkflow'?'Code':null));resolveCurrentUser();
    $('#mode').textContent='Mode démonstration — aucune écriture réelle';render();
  }
  async function init(){
    if(!window.grist){demo();notice('API Grist indisponible : mode démonstration.','error');return;}
    state.grist=true;grist.ready({requiredAccess:'full'});
    try{await refresh();$('#mode').textContent='Connecté à Grist';}catch(e){$('#mode').textContent='Configuration Grist incomplète';notice('Chargement impossible : '+e.message+'. Vérifiez les noms des tables et l’accès complet.','error');}
  }

  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view));
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>show('dashboard'));
  $('#search').oninput=renderRequests;$('#filter').onchange=renderRequests;$('#refreshTasks').onclick=()=>refresh().catch(e=>notice(e.message,'error'));
  $('[name=PersonnelConcerne]').onchange=e=>{const p=ref('Personnel',e.target.value),u=p&&ref('Unites',p.Unite);$('[name=Unite]').value=u?.LibelleUnite||'';};
  $('#decisionForm [name=Decision]').onchange=e=>{$('#returnReason').hidden=e.target.value!=='RETOURNER';$('#decisionForm [name=MotifRetour]').required=e.target.value==='RETOURNER';};
  $('#decisionForm').onsubmit=e=>{e.preventDefault();decide(e.target);};
  $('#requestForm').onsubmit=e=>{e.preventDefault();createDraft(e.target,e.submitter);};
  $('#profileForm').onsubmit=e=>{e.preventDefault();submitProfile(e.target,e.submitter);};
  $('#rightsForm').onsubmit=e=>{e.preventDefault();submitRights(e.target,e.submitter);};
  $('#personnelForm').onsubmit=e=>{e.preventDefault();submitPersonnel(e.target,e.submitter);};
  $('#personnelCsv').onchange=e=>loadPersonnelCsv(e.target.files[0]);
  $('#importPersonnel').onclick=importPersonnel;
  $('#submitRequest').onclick=submitCurrentRequest;
  init();
})();
