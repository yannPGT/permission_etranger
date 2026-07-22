# Guide d'installation

1. Créer un document Grist de recette. Créer les tables dans l'ordre de `MODELE_GRIST.md`, puis importer `imports/*.csv` avec séparateur `;` et UTF-8.
2. Compléter rôles, entités, unités, personnel et pays. Normaliser tous les courriels ProConnect en minuscules. Renseigner les trois délais ; ne pas activer le workflow tant qu'ils sont vides.
3. Configurer les références, formules et validations. Ajouter l'attribut utilisateur `p` et les ACL décrites dans `REGLES_ACCES_GRIST.md`. Tester avec deux unités avant données réelles.
4. Héberger le dossier `widget/` sur un serveur HTTPS interne approuvé. Servir `grist-plugin-api.js` depuis l'instance ou un emplacement interne approuvé, puis ajouter sa balise script avant `workflow-core.js` dans `index.html` pour la production. Appliquer au minimum `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://INSTANCE-GRIST; frame-ancestors https://INSTANCE-GRIST`.
5. Dans Grist : ajouter un widget Custom, URL interne, accès **Full document access**. Cette permission est requise pour écrire plusieurs tables ; n'approuver que l'origine interne auditée.
6. Pour les PDF, utiliser la colonne Attachments native sur Demandes/Actions. Le prototype n'appelle aucune méthode de téléversement non confirmée : ajouter/remplacer le PDF dans la vue native, limitée à BROUILLON/A_CORRIGER par ACL.
7. Lancer la migration : `python migration/migrate_resana.py source-resana.csv --out migration/output`, examiner `rapport_anomalies.json`, rapprocher manuellement personnel/pays/unités, puis importer dans l'ordre Demandes, Actions, Historique. Upsert sur les clés de migration, ne pas simplement réimporter en ajout.
8. Exécuter `npm test`, puis toute la recette multi-comptes. Utiliser l'export XLSX natif uniquement après preuve qu'il respecte les ACL.

Mise à jour : versionner et auditer les fichiers, déployer sur une URL de préproduction, recette, puis promotion atomique. Retour arrière : restaurer la version statique précédente ; si le schéma change, restaurer une copie Grist créée avant migration. Ne jamais tenter de revenir en arrière en supprimant uniquement Demandes.

Suppression de fin de période : désactivée (`SUPPRESSION_AUTORISEE=FALSE`). Après export et validation formelle, un administrateur dénombre PJ/Historique/Actions/Demandes, saisit une confirmation explicite, puis supprime dans une opération/procédure contrôlée de l'instance. Le widget livré ne prétend pas garantir cette transaction sans validation de version.
