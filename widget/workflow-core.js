(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorkflowCore=api;})(this,function(){
  'use strict';
  const TERMINAUX=new Set(['REFUSEE','TRANSMISE_BSPS','CLOTUREE','ARCHIVEE']);
  function email(v){return String(v||'').trim().toLowerCase();}
  function joursOuvres(date,n){const d=new Date(date);let left=Number(n);while(left>0){d.setDate(d.getDate()-1);if(d.getDay()!==0&&d.getDay()!==6)left--;}return d;}
  function dateLimite(debut,delai,unite){if(!debut||delai===''||delai==null)return null;const d=new Date(debut+'T12:00:00');return unite==='OUVRES'?joursOuvres(d,delai):new Date(d.setDate(d.getDate()-Number(delai)));}
  function transition(statut,decision){const map={
    'BROUILLON:SOUMETTRE':'A_CONTROLER','A_CORRIGER:RESOUMETTRE':'A_CONTROLER',
    'A_CONTROLER:VALIDER':'A_VALIDER_CHEF_CORPS','A_CONTROLER:RETOURNER':'A_CORRIGER','A_CONTROLER:REFUSER':'REFUSEE',
    'A_VALIDER_CHEF_CORPS:VALIDER':'A_TRANSMETTRE_BSPS','A_VALIDER_CHEF_CORPS:RETOURNER':'A_CORRIGER','A_VALIDER_CHEF_CORPS:REFUSER':'REFUSEE',
    'A_TRANSMETTRE_BSPS:TRANSMETTRE':'TRANSMISE_BSPS'};
    return map[statut+':'+decision]||null;
  }
  function valide(d){const e=[];['PersonnelConcerne','PaysDestination','DateDebutSejour','DateFinSejour','MotifDeplacement'].forEach(k=>{if(!d[k])e.push(k+' est obligatoire.');});if(d.Urgente&&!d.JustificationUrgence)e.push("La justification de l’urgence est obligatoire.");if(d.DateDebutSejour&&d.DateFinSejour&&d.DateFinSejour<d.DateDebutSejour)e.push('La date de retour précède le départ.');return e;}
  function peutModifier(d){return d&&['BROUILLON','A_CORRIGER'].includes(d.Statut);}
  function applique(d,decision,motif){if(TERMINAUX.has(d.Statut))throw Error('Dossier terminé.');if(decision==='RETOURNER'&&!String(motif||'').trim())throw Error('Le motif du retour est obligatoire.');const next=transition(d.Statut,decision);if(!next)throw Error('Transition interdite.');return Object.assign({},d,{Statut:next,Version:decision==='RESOUMETTRE'?Number(d.Version||1)+1:Number(d.Version||1)});}
  return {email,dateLimite,transition,valide,peutModifier,applique};
});
