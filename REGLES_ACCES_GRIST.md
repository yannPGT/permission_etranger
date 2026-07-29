# Règles d'accès Grist

## Matrice

| Rôle | Personnel | Demandes | Écritures |
|---|---|---|---|
| Utilisateur | sa ligne | créées/demandées/concernées par lui | créer brouillon, modifier BROUILLON/A_CORRIGER, resoumettre, annuler ses demandes non terminales |
| Gestionnaire | lui + unité | unité | selon capacités, annuler une demande non terminale de son unité, jamais autre unité |
| Conformité | minimum nécessaire | dossiers assignés | décision conformité |
| Chef de corps | minimum nécessaire | entité, étape chef | décision chef |
| BSPS | minimum nécessaire | dossiers à transmettre/transmis | transmission/clôture |
| Administrateur | tout | tout | administration |

Le responsable conformité peut cumuler son rôle métier avec l'indicateur `Personnel.Administrateur`. Dans ce cas, il conserve les fonctions de contrôle conformité et accède au mode de supervision administrateur. Un administrateur peut traiter une action assignée à un autre acteur ; l'ACL doit donc lui accorder les droits nécessaires sur `Demandes`, `Actions` et `Historique`. Le widget exige alors une justification et enregistre l'administrateur dans `TraiteePar` et `Historique.Utilisateur`, avec la mention « Intervention administrateur ». Les autres rôles restent limités à leurs propres actions.

La file `Gestion > Mes actions` regroupe les demandes de modification du personnel et les demandes de droits. Un gestionnaire peut lire et traiter `DemandeInscription` uniquement lorsque la fiche Personnel actuelle et `UniteDemandee` correspondent toutes deux à `user.p.Unite`. Sur `Personnel`, il peut modifier uniquement `Nom`, `Prenom` et `Matricule` dans cette unité ; `Role`, `Unite`, `Entite`, `Actif`, `Administrateur` et `GestionnaireUnite` restent interdits. Les demandes de droits et les changements d'unité sont réservés à l'administrateur. L'administrateur peut traiter ses propres demandes ; cette auto-validation doit porter la mention explicite « Auto-validation administrateur ». Une décision sur `DemandeInscription` renseigne `VerifiePar` et `DateVerification` ; une décision sur `DemandeDroits` renseigne `TraitePar` et `DateTraitement`. L'historique natif Grist conserve en complément l'identité ProConnect à l'origine de l'écriture. Conserver une règle finale de refus.

## Traduction ACL à adapter dans l'éditeur Grist

Créer un attribut utilisateur `p` depuis la table Personnel avec `EmailProConnect` comme clé et `user.Email` comme valeur. Refuser tout accès métier si `not user.p` ou `not user.p.Actif`. La casse doit être normalisée dans Personnel avant activation.

Principes de conditions (syntaxe exacte à valider sur la version cible) : administrateur `user.p.Administrateur`; propriétaire `rec.CreeePar == user.p.id or rec.Demandeur == user.p.id or rec.PersonnelConcerne == user.p.id`; unité `rec.Unite == user.p.Unite and user.p.GestionnaireUnite`; assigné `rec.ResponsableActuel == user.p.id`; chef `rec.Entite == user.p.Entite and user.p.Role.CodeRole == 'CHEF_CORPS'`; BSPS `rec.Entite.ResponsableBSPS == user.p.id` et statut pertinent.

- Personnel : lecture propre ligne ; gestionnaire seulement `rec.Unite == user.p.Unite`; admin tout. Masquer Matricule et indicateurs administratifs aux non-admin. Interdire aux gestionnaires d'écrire Role, Unite, Entite, Actif, Administrateur.
- ContexteUtilisateur : une ligne par Personnel. Pour `R`, laisser OWNER/admin neutres, autoriser `rec.Personnel == user.p.id`, puis refuser `True`. OWNER/admin peuvent conserver `UCD`. Le widget exige exactement une ligne visible.
- Demandes : autoriser les lectures selon la matrice. Écriture métier de l’auteur uniquement pour `BROUILLON` ou `A_CORRIGER`, en limitant les colonnes à `Objet`, `PaysDestination`, `DateDebutSejour`, `DateFinSejour`, `MotifDeplacement`, `Urgente` et `JustificationUrgence`. Interdire en particulier `PersonnelConcerne`, `Unite`, `Entite`, `CreeePar`, `Demandeur`, `Version`, `Statut` et `EtapeActuelle` en modification ordinaire. `PiecesJointes` est modifiable par l’auteur en brouillon/correction, par l’acteur assigné aux étapes PDF et par l’administrateur. `VersionPDFActive` n’est modifiable que pendant une transition autorisée. L’annulation vers `ANNULEE` est accordée à l’auteur, au gestionnaire de la même unité et à l’administrateur ; elle doit également autoriser la clôture des actions ouvertes et l’ajout dans `Historique`. Les autres transitions sont réservées au rôle responsable.
- Actions : lecture si la demande est visible, y compris l’action retournée nécessaire à l’affichage du `MotifRetour` ; ajout/modification par rôle assigné ou admin. L’auteur, le gestionnaire de la même unité ou l’administrateur peut uniquement neutraliser les actions encore ouvertes lors d’une annulation autorisée (`StatutAction` et `Decision` vers `ANNULEE`, motif, date et auteur). Interdire toute autre modification après traitement. Les colonnes `VersionPDFEntree`, `TraitementPDF`, `VersionPDFSortie`, `CommentairePDF`, `DateValidationPDF` et `ValidationPDFPar` ne sont modifiables que par l’acteur assigné à une action `EN_COURS` ou par l’administrateur agissant en supervision.
- VersionsPDF : lecture uniquement si la demande liée est elle-même visible. Autoriser la création par l’auteur en brouillon/correction, par l’acteur assigné à l’étape en cours ou par l’administrateur ; exiger `newRec.AjoutePar == user.p.id` et une demande appartenant au même périmètre. Après création, le fichier, la demande, le numéro et l’auteur sont immuables ; seule `VersionActive` peut être désactivée par une transition autorisée. Refuser toute suppression ordinaire.
- Historique et HistoriqueParametres : lecture alignée sur la demande / admin ; ajout via transition ; aucune mise à jour ni suppression ordinaire.
- Référentiels : lecture minimale ; écriture admin. Les références Personnel doivent elles-mêmes être filtrées afin d'éviter une fuite par menus.
- Attachments : mêmes règles que la demande ou la version PDF porteuse. Tester le téléchargement direct de chaque version avec un compte sans droit. L’utilisateur doit ajouter une nouvelle pièce jointe sans supprimer les précédentes ; `VersionsPDF` conserve la référence exacte de chaque fichier.
- Export : seulement depuis une vue/table dont les ACL sont identiques ; ne jamais utiliser une clé API partagée.

Test : créer six comptes fictifs (deux unités), activer les ACL, utiliser des sessions séparées et vérifier tables brutes, références, widget, formulaires, export et URL de PJ. Un gestionnaire U1 ne doit retrouver aucun identifiant, nom ou fichier de U2. Les ACL exactes doivent être saisies et validées sur l'instance cible : le dépôt ne peut pas les installer à distance.

## Exception contrôlée pour l'ajout de personnel

L'interdiction de modification des colonnes sensibles par un gestionnaire reste valable pour les lignes existantes. Pour permettre uniquement la création depuis le widget, ajouter une autorisation `C` sur `Personnel` avec une condition équivalente à :

```python
user.p and user.p.Actif and user.p.GestionnaireUnite and newRec.Unite == user.p.Unite and newRec.Entite == user.p.Entite and newRec.Role == 1 and newRec.Actif and not newRec.Administrateur and not newRec.GestionnaireUnite
```

Dans `ContexteUtilisateur`, ajouter les colonnes formule `PersonnelUnite` (`$Personnel.Unite`), `PersonnelEntite` (`$Personnel.Entite`), `PersonnelRole` (`$Personnel.Role`) et `PersonnelActif` (`$Personnel.Actif`). Autoriser ensuite `C` uniquement pour la fiche nouvellement créée dans le périmètre du gestionnaire :

```python
user.p and user.p.Actif and user.p.GestionnaireUnite and newRec.PersonnelUnite == user.p.Unite and newRec.PersonnelEntite == user.p.Entite and newRec.PersonnelRole == 1 and newRec.PersonnelActif
```

Conserver une règle finale `True` refusant les opérations non explicitement autorisées. Le numéro `1` correspond à l'identifiant du rôle `UTILISATEUR` dans le document cible. Les références chaînées ne sont pas utilisées directement dans les ACL : les quatre colonnes formule exposent les valeurs nécessaires. Tester obligatoirement : ajout dans l'unité propre, refus dans une autre unité, refus d'un rôle privilégié et refus des indicateurs administratifs. L'invitation dans « Gérer les utilisateurs » demeure une opération séparée.
