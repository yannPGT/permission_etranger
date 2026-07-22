const test=require('node:test'),assert=require('node:assert/strict'),W=require('../widget/workflow-core.js');
test('normalise email ProConnect',()=>assert.equal(W.email(' Alice@EXEMPLE.FR '),'alice@exemple.fr'));
test('retour motivé obligatoire',()=>assert.throws(()=>W.applique({Statut:'A_CONTROLER',Version:1},'RETOURNER','')));
test('retour et resoumission versionnés',()=>{let d=W.applique({Statut:'A_CONTROLER',Version:1},'RETOURNER','incomplet');assert.equal(d.Statut,'A_CORRIGER');d=W.applique(d,'RESOUMETTRE');assert.equal(d.Version,2);assert.equal(d.Statut,'A_CONTROLER')});
test('verrouille après soumission',()=>assert.equal(W.peutModifier({Statut:'A_CONTROLER'}),false));
test('validation urgence et dates',()=>assert.ok(W.valide({Urgente:true,PersonnelConcerne:1,PaysDestination:1,DateDebutSejour:'2026-08-10',DateFinSejour:'2026-08-09',MotifDeplacement:'x'}).length===2));
test('calcul jours calendaires',()=>assert.equal(W.dateLimite('2026-08-10',3,'CALENDAIRES').toISOString().slice(0,10),'2026-08-07'));
test('calcul jours ouvrés',()=>assert.equal(W.dateLimite('2026-08-10',1,'OUVRES').toISOString().slice(0,10),'2026-08-07'));
test('transition BSPS terminale',()=>assert.equal(W.applique({Statut:'A_TRANSMETTRE_BSPS'},'TRANSMETTRE').Statut,'TRANSMISE_BSPS'));
