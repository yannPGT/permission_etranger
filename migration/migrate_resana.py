#!/usr/bin/env python3
"""Convertit l'export RESANA en CSV Grist normalisés, sans accès réseau.
Idempotence: ReferenceHistorique est la clé stable; les actions ont la clé historique+étape.
"""
import argparse,csv,json,re,sys
from datetime import datetime
from pathlib import Path

STEPS=[('DEMANDE_INITIALE','Etape 1 - Demande initiale'),('CONTROLE_CONFORMITE','Etape 2 - Conformité'),('VALIDATION_CHEF_CORPS','Etape 3 - Validation chef de corps'),('TRANSMISSION_BSPS','Etape 4 - Transmission BSPS')]
def decode(path):
 b=path.read_bytes()
 for enc in ('utf-8-sig','utf-8','cp1252'):
  try:return b.decode(enc),enc
  except UnicodeDecodeError:pass
 raise ValueError('Encodage non reconnu')
def dt(v):
 v=v.strip()
 for f in ('%d/%m/%Y %H:%M','%d/%m/%Y'):
  try:return datetime.strptime(v,f).isoformat(sep=' ')
  except ValueError:pass
 return ''
def field(row,prefix,suffix): return row.get(prefix+' -  '+suffix,'').strip()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('source');ap.add_argument('--out',default='migration/output');a=ap.parse_args();out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 text,enc=decode(Path(a.source)); reader=csv.DictReader(text.splitlines(),delimiter=';'); rows=list(reader); anomalies=[]; demandes={};actions={};hist=[]
 for n,r in enumerate(rows,2):
  ref=r['Identifiant unique'].strip(); auteur=r['Auteur de la demande'].strip(); date=dt(r['Date de la demande'])
  if not ref: anomalies.append({'ligne':n,'type':'REFERENCE_MANQUANTE'});continue
  if ref in demandes: anomalies.append({'ligne':n,'type':'DOUBLON','reference':ref});continue
  comment=field(r,STEPS[0][1],'commentaire'); url=field(r,STEPS[0][1],'PJ')
  demandes[ref]={'ReferenceHistorique':ref,'Reference':'HIST-'+re.sub(r'\D','',ref)[-2:],'Version':1,'CreeeParTexteHistorique':auteur,'DateDemande':date,'Urgente':r['Demande urgente'].strip().lower()=='oui','Statut':'BROUILLON','EtapeActuelle':'DEMANDE_INITIALE','CommentaireSource':comment,'UrlResanaHistorique':url}
  reached='DEMANDE_INITIALE'
  for order,(code,prefix) in enumerate(STEPS,1):
   responsable=field(r,prefix,"Responsable de l'étape"); ar=field(r,prefix,"Date d'accusé réception"); tx=field(r,prefix,'Date de transmission'); pj=field(r,prefix,'PJ'); com=field(r,prefix,'commentaire')
   present=any((responsable,ar,tx,pj,com))
   if not present: continue
   key=f'{ref}|{code}'; reached=code
   decision='VALIDEE' if code!='TRANSMISSION_BSPS' else 'TRANSMISE_BSPS'
   actions[key]={'CleMigration':key,'ReferenceHistoriqueDemande':ref,'EtapeCode':code,'VersionDemande':1,'AssigneeTexteHistorique':responsable,'DateAccuseReception':dt(ar),'DateTransmission':dt(tx),'DecisionNormalisee':decision,'DecisionTexteOriginal':com,'Commentaire':com,'UrlResanaHistorique':pj}
   if tx and not dt(tx): anomalies.append({'ligne':n,'type':'DATE_INVALIDE','valeur':tx})
  demandes[ref]['EtapeActuelle']=reached
  demandes[ref]['Statut']={'DEMANDE_INITIALE':'BROUILLON','CONTROLE_CONFORMITE':'A_VALIDER_CHEF_CORPS','VALIDATION_CHEF_CORPS':'A_TRANSMETTRE_BSPS','TRANSMISSION_BSPS':'TRANSMISE_BSPS'}[reached]
  hist.append({'ReferenceHistoriqueDemande':ref,'Version':1,'DateHeure':date,'UtilisateurTexteHistorique':auteur,'TypeEvenement':'MIGRATION','NouveauStatut':demandes[ref]['Statut'],'NouvelleEtape':reached,'Commentaire':'Import RESANA sans téléchargement de pièces jointes'})
 def write(name,data):
  vals=list(data); keys=list(vals[0]) if vals else [];p=out/name
  with p.open('w',encoding='utf-8-sig',newline='') as f:w=csv.DictWriter(f,keys,delimiter=';');w.writeheader();w.writerows(vals)
 write('Demandes_migration.csv',demandes.values());write('Actions_migration.csv',actions.values());write('Historique_migration.csv',hist)
 (out/'rapport_anomalies.json').write_text(json.dumps({'encodage':enc,'lignes':len(rows),'demandes':len(demandes),'actions':len(actions),'anomalies':anomalies},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'demandes':len(demandes),'actions':len(actions),'anomalies':len(anomalies)}))
if __name__=='__main__':main()
