# Règles d'accès Grist

## Matrice

| Rôle | Personnel | Demandes | Écritures |
|---|---|---|---|
| Utilisateur | sa ligne | créées/demandées/concernées par lui | créer brouillon, modifier BROUILLON/A_CORRIGER, resoumettre |
| Gestionnaire | lui + unité | unité | selon capacités, jamais autre unité |
| Conformité | minimum nécessaire | dossiers assignés | décision conformité |
| Chef de corps | minimum nécessaire | entité, étape chef | décision chef |
| BSPS | minimum nécessaire | dossiers à transmettre/transmis | transmission/clôture |
| Administrateur | tout | tout | administration |

## Traduction ACL à adapter dans l'éditeur Grist

Créer un attribut utilisateur `p` depuis la table Personnel avec `EmailProConnect` comme clé et `user.Email` comme valeur. Refuser tout accès métier si `not user.p` ou `not user.p.Actif`. La casse doit être normalisée dans Personnel avant activation.

Principes de conditions (syntaxe exacte à valider sur la version cible) : administrateur `user.p.Administrateur`; propriétaire `rec.CreeePar == user.p.id or rec.Demandeur == user.p.id or rec.PersonnelConcerne == user.p.id`; unité `rec.Unite == user.p.Unite and user.p.GestionnaireUnite`; assigné `rec.ResponsableActuel == user.p.id`; chef `rec.Entite == user.p.Entite and user.p.Role.CodeRole == 'CHEF_CORPS'`; BSPS `rec.Entite.ResponsableBSPS == user.p.id` et statut pertinent.

- Personnel : lecture propre ligne ; gestionnaire seulement `rec.Unite == user.p.Unite`; admin tout. Masquer Matricule et indicateurs administratifs aux non-admin. Interdire aux gestionnaires d'écrire Role, Unite, Entite, Actif, Administrateur.
- Demandes : autoriser les lectures selon la matrice. Écriture auteur uniquement pour `BROUILLON` ou `A_CORRIGER`, et interdire Unite/Entite/CreeePar/Version/Statut en écriture directe. Les transitions sont réservées au rôle responsable.
- Actions : lecture si la demande est visible ; ajout/modification par rôle assigné ou admin. Interdire la modification après traitement.
- Historique et HistoriqueParametres : lecture alignée sur la demande / admin ; ajout via transition ; aucune mise à jour ni suppression ordinaire.
- Référentiels : lecture minimale ; écriture admin. Les références Personnel doivent elles-mêmes être filtrées afin d'éviter une fuite par menus.
- Attachments : mêmes règles que la demande/action porteuse. Tester téléchargement direct avec un compte sans droit.
- Export : seulement depuis une vue/table dont les ACL sont identiques ; ne jamais utiliser une clé API partagée.

Test : créer six comptes fictifs (deux unités), activer les ACL, utiliser des sessions séparées et vérifier tables brutes, références, widget, formulaires, export et URL de PJ. Un gestionnaire U1 ne doit retrouver aucun identifiant, nom ou fichier de U2. Les ACL exactes doivent être saisies et validées sur l'instance cible : le dépôt ne peut pas les installer à distance.
