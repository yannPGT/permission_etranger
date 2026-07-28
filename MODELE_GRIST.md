# Modèle Grist normalisé

Convention : noms techniques ASCII stables. `Ref:X` = référence vers X, `RefList:X` = liste de références. Les champs de sécurité ne sont jamais fournis librement par le navigateur.

## Tables principales

| Table | Colonnes (type ; obligation/défaut ; contrôle) |
|---|---|
| Demandes | Reference Text unique ; ReferenceHistorique Text unique ; Version Int requis/1 ; CreeePar Ref:Personnel requis ; Demandeur Ref:Personnel requis ; PersonnelConcerne Ref:Personnel requis ; Unite Ref:Unites requis/dérivé ; Entite Ref:Entites requis/dérivé ; DateDemande Date requis ; DateSoumission DateTime ; Urgente Bool/false ; JustificationUrgence Text conditionnelle ; Objet Text ; MotifDeplacement Text requis ; PaysDestination Ref:Pays requis/actif ; CategoriePays Ref:CategoriesPays dérivée ; DateDebutSejour Date requis ; DateFinSejour Date requis et >= début ; DateLimiteTraitement Date formule ; HorsDelai Bool formule ; Statut Ref:Statuts requis/BROUILLON ; EtapeActuelle Ref:EtapesWorkflow ; ResponsableActuel Ref:Personnel ; DateDerniereAction DateTime ; DateCloture DateTime ; Archivee Bool/false ; PiecesJointes Attachments ; VersionPDFActive Ref:VersionsPDF ; CommentaireRetard Text ; Revision Int/0 |
| Actions | Demande Ref:Demandes requis ; Etape Ref:EtapesWorkflow requis ; VersionDemande Int requis ; AssigneeA Ref:Personnel ; RoleAssigne Ref:Roles ; StatutAction Choice ; DateTransmission/DateAccuseReception/DatePriseEnCharge/DateTraitement DateTime ; Decision Choice ; MotifRetour Text obligatoire pour RETOUR ; Commentaire Text ; PiecesJointes Attachments ; TraiteePar Ref:Personnel ; VersionPDFEntree Ref:VersionsPDF ; TraitementPDF Choice `SANS_MODIFICATION`/`NOUVELLE_VERSION` ; VersionPDFSortie Ref:VersionsPDF ; CommentairePDF Text ; DateValidationPDF DateTime ; ValidationPDFPar Ref:Personnel ; PDFPretPourDecision Bool formule ; CleMigration Text unique ; UrlResanaHistorique Text sensible |
| Historique | Demande Ref:Demandes requis ; Version Int ; DateHeure DateTime requis ; Utilisateur Ref:Personnel ; TypeEvenement Choice requis ; AncienStatut/NouveauStatut Ref:Statuts ; AncienneEtape/NouvelleEtape Ref:EtapesWorkflow ; Commentaire Text ; ResumeModification Text. Ajout seul, aucune modification/suppression hors procédure administrateur. |
| VersionsPDF | Demande Ref:Demandes requis ; Action Ref:Actions optionnelle ; Etape Ref:EtapesWorkflow ; NumeroVersion Int requis, minimum logique 1 ; VersionPrecedente Ref:VersionsPDF ; Fichier Attachments requis ; AjoutePar Ref:Personnel requis ; DateAjout DateTime requis ; Commentaire Text ; VersionActive Bool/true ; LibelleVersion Text formule. Une ligne représente une version immuable du PDF. |

## Référentiels et administration

| Table | Colonnes |
|---|---|
| Personnel | EmailProConnect Text unique/minuscule requis ; Nom, Prenom Text ; Matricule Text sensible ; Unite Ref:Unites ; Entite Ref:Entites ; Role Ref:Roles ; Actif Bool/true ; Administrateur Bool/false ; GestionnaireUnite Bool/false |
| ContexteUtilisateur | Personnel Ref:Personnel requis et unique ; PersonnelUnite Ref:Unites formule `$Personnel.Unite` ; PersonnelEntite Ref:Entites formule `$Personnel.Entite` ; PersonnelRole Ref:Roles formule `$Personnel.Role` ; PersonnelActif Bool formule `$Personnel.Actif`. Une ligne par personnel autorisé ; les ACL ne rendent visible que la ligne correspondant à `user.p.id`. |
| Unites | CodeUnite Text unique ; LibelleUnite Text ; Entite Ref:Entites ; GestionnairesAdministratifs RefList:Personnel ; ChefDeCorps Ref:Personnel ; ResponsableConformite Ref:Personnel ; Active Bool |
| Entites | CodeEntite, LibelleEntite ; ChefDeCorps, ResponsableConformite, ResponsableBSPS Ref:Personnel ; Active Bool |
| Pays | CodePays Text unique ; NomPays Text ; Categorie Ref:CategoriesPays ; Actif Bool |
| CategoriesPays | CodeCategorie Text unique (21/22/23) ; Libelle Text ; DelaiTraitement Int nullable ; UniteDelai Choice CALENDAIRES/OUVRES ; Active Bool |
| EtapesWorkflow | Ordre Int ; Code Text unique ; Libelle Text ; RoleResponsable Ref:Roles ; DelaiEventuel Int ; EtapeSuivante Ref:self ; Active Bool |
| Roles | CodeRole, Libelle et dix booléens de capacité fournis dans `imports/Roles.csv` |
| Parametres | Cle Text unique ; Valeur Text ; TypeValeur Choice ; Description Text ; ModifieLe DateTime ; ModifiePar Ref:Personnel |
| HistoriqueParametres | Parametre Ref:Parametres ; AncienneValeur/NouvelleValeur Text ; DateHeure DateTime ; Administrateur Ref:Personnel. Ajout seul. |
| DemandeInscription | Personnel Ref:Personnel ; EmailConnexion Text auteur ; Nom/Prenom/Matricule ; UniteDemandee Ref:Unites ; DateDemande DateTime ; Statut Choice normale, sans formule, valeurs `EN_ATTENTE`/`A_COMPLETER`/`VERIFIEE`/`REFUSEE` ; commentaires ; VerifiePar Ref:Personnel ; DateVerification DateTime. |
| DemandeDroits | Personnel Ref:Personnel ; EmailConnexion Text auteur ; RoleActuel formule ; RoleDemande Ref:Roles ; GestionnaireUniteDemande/AdministrateurDemande Bool ; Motif ; DateDemande DateTime ; Statut Choice ; CommentaireAdministrateur ; TraitePar Ref:Personnel ; DateTraitement DateTime. |
| Statuts | Code Text unique ; Libelle Text ; Terminal Bool |

Formules indicatives : `CategoriePays=$PaysDestination.Categorie`; unité/entité depuis `$PersonnelConcerne`; `HorsDelai=bool($DateLimiteTraitement and TODAY()>$DateLimiteTraitement and not $Statut.Terminal)`. Pour `VersionsPDF.LibelleVersion`, utiliser par exemple `"V%s - %s" % ($NumeroVersion, $DateAjout.strftime("%d/%m/%Y %H:%M") if $DateAjout else "")`. Pour `Actions.PDFPretPourDecision`, vérifier au minimum la présence de `$VersionPDFEntree`. Le calcul ouvré configurable est préférable dans une colonne formule testée sur la version cible ou lors d'une transition serveur/document, pas dans une donnée libre du formulaire.

Ordre de création : Roles, Statuts, CategoriesPays, EtapesWorkflow, Entites, Unites, Personnel, ContexteUtilisateur, Pays, Parametres, Demandes, Actions, VersionsPDF, Historique, HistoriqueParametres, DemandeInscription, DemandeDroits. Comme `Actions` et `VersionsPDF` se référencent mutuellement, créer d’abord les deux tables puis configurer `Actions.VersionPDFEntree`, `Actions.VersionPDFSortie` et `VersionsPDF.Action`. Les CSV `imports/` initialisent les valeurs non sensibles ; responsables, délais et pays restent à renseigner.
