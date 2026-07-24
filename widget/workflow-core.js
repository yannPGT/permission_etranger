(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorkflowCore=api;})(this,function(){
  'use strict';
  const TERMINAUX=new Set(['REFUSEE','TRANSMISE_BSPS','CLOTUREE','ARCHIVEE']);
  const TRANSITIONS={
    'BROUILLON:SOUMETTRE':{statut:'A_CONTROLER',etape:'CONTROLE_CONFORMITE',event:'SOUMISSION'},
    'A_CONTROLER:VALIDER':{statut:'A_VALIDER_CHEF_CORPS',etape:'VALIDATION_CHEF_CORPS',event:'VALIDATION'},
    'A_CONTROLER:RETOURNER':{statut:'A_CORRIGER',etape:'CONTROLE_CONFORMITE',event:'RETOUR_CORRECTION'},
    'A_CONTROLER:REFUSER':{statut:'REFUSEE',etape:'CONTROLE_CONFORMITE',event:'REFUS'},
    'A_VALIDER_CHEF_CORPS:VALIDER':{statut:'A_TRANSMETTRE_BSPS',etape:'TRANSMISSION_BSPS',event:'VALIDATION'},
    'A_VALIDER_CHEF_CORPS:RETOURNER':{statut:'A_CORRIGER',etape:'VALIDATION_CHEF_CORPS',event:'RETOUR_CORRECTION'},
    'A_VALIDER_CHEF_CORPS:REFUSER':{statut:'REFUSEE',etape:'VALIDATION_CHEF_CORPS',event:'REFUS'},
    'A_TRANSMETTRE_BSPS:TRANSMETTRE':{statut:'TRANSMISE_BSPS',etape:'TRANSMISSION_BSPS',event:'TRANSMISSION_BSPS'}
  };
  const DECISIONS_PAR_ETAPE={
    CONTROLE_CONFORMITE:['VALIDER','RETOURNER','REFUSER'],
    VALIDATION_CHEF_CORPS:['VALIDER','RETOURNER','REFUSER'],
    TRANSMISSION_BSPS:['TRANSMETTRE']
  };
  function email(v){return String(v||'').trim().toLowerCase();}
  function joursOuvres(date,n){const d=new Date(date);let left=Number(n);while(left>0){d.setDate(d.getDate()-1);if(d.getDay()!==0&&d.getDay()!==6)left--;}return d;}
  function dateLimite(debut,delai,unite){if(!debut||delai===''||delai==null)return null;const d=new Date(debut+'T12:00:00');return unite==='OUVRES'?joursOuvres(d,delai):new Date(d.setDate(d.getDate()-Number(delai)));}
  function transition(statut,decision){return TRANSITIONS[statut+':'+decision]||null;}
  function decisionsPour(etape){return DECISIONS_PAR_ETAPE[etape]||[];}
  function cibleSoumission(statut,etape){
    if(statut==='BROUILLON')return {statut:'A_CONTROLER',etape:'CONTROLE_CONFORMITE',event:'SOUMISSION',incrementVersion:false};
    if(statut==='A_CORRIGER'&&etape==='CONTROLE_CONFORMITE')return {statut:'A_CONTROLER',etape,event:'RESOUMISSION',incrementVersion:true};
    if(statut==='A_CORRIGER'&&etape==='VALIDATION_CHEF_CORPS')return {statut:'A_VALIDER_CHEF_CORPS',etape,event:'RESOUMISSION',incrementVersion:true};
    throw Error('Cette demande ne peut pas être soumise dans son état actuel.');
  }
  function valide(d){const e=[];['PersonnelConcerne','PaysDestination','DateDebutSejour','DateFinSejour','MotifDeplacement'].forEach(k=>{if(!d[k])e.push(k+' est obligatoire.');});if(d.Urgente&&!d.JustificationUrgence)e.push("La justification de l’urgence est obligatoire.");if(d.DateDebutSejour&&d.DateFinSejour&&d.DateFinSejour<d.DateDebutSejour)e.push('La date de retour précède le départ.');return e;}
  function peutModifier(d){return d&&['BROUILLON','A_CORRIGER'].includes(d.Statut);}
  function verifieDecision(statut,etape,decision,motif){const allowed=decisionsPour(etape);if(!allowed.includes(decision))throw Error('Décision interdite pour cette étape.');if(decision==='RETOURNER'&&!String(motif||'').trim())throw Error('Le motif du retour est obligatoire.');const next=transition(statut,decision);if(!next)throw Error('Transition interdite depuis le statut actuel.');return next;}
  function applique(d,decision,motif,etape){if(TERMINAUX.has(d.Statut))throw Error('Dossier terminé.');const next=decision==='RESOUMETTRE'?cibleSoumission(d.Statut,etape):(etape?verifieDecision(d.Statut,etape,decision,motif):transition(d.Statut,decision));if(!next)throw Error('Transition interdite.');return Object.assign({},d,{Statut:next.statut,EtapeActuelle:next.etape,Version:next.incrementVersion?Number(d.Version||1)+1:Number(d.Version||1)});}
  return {email,dateLimite,transition,decisionsPour,cibleSoumission,valide,peutModifier,verifieDecision,applique,TERMINAUX};
});
