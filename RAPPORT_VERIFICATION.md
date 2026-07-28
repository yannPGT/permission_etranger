# Rapport de vérification

## Vérifications exécutées localement

- Analyse intégrale du CSV : UTF-8 BOM, `;`, 19 lignes, 22 colonnes métier + terminaison vide, références uniques.
- Migration hors réseau : génération déterministe Demandes/Actions/Historique, conservation des URL sans téléchargement, rapport JSON.
- Tests unitaires du moteur : normalisation d'adresse, champs obligatoires, urgence, dates, jours calendaires/ouvrés, verrouillage, retour motivé, resoumission vers l'étape d'origine, version et terminal BSPS.
- Tests structurels : présence des vues Tableau de bord, Mes actions, formulaire et dossier ; cohérence des identifiants DOM ; ordre de chargement de l'API Grist ; absence de stockage local, `eval` et caractères mal encodés.
- Inspection statique : aucune URL GitHub/CDN applicative, aucun `eval`, aucun secret, aucune donnée personnelle en localStorage, neutralisation du rendu utilisateur. Le PDF est géré par la fiche native Grist ouverte avec `setCursorPos` et `viewAsCard` ; le widget n'effectue aucun POST binaire inter-origines.
- Mode hors Grist : démonstration explicite et sans écriture.
- Suivi PDF : version initiale créée à la soumission, propagation de `VersionPDFEntree`, choix explicite sans modification/nouvelle version aux étapes conformité et chef de corps, sortie et validateur tracés dans l’action.

## Limites restantes

Impossible sans instance cible : ouverture réelle dans Grist, authentification ProConnect, installation/validation des ACL, concurrence multi-session, ouverture effective de la fiche native et dépôt Attachments, export XLSX natif, suppression transactionnelle et test réseau/CSP. Ces points ne sont pas déclarés réussis et sont listés dans la recette.

Le widget actuel couvre tableau de bord, filtres, formulaire de brouillon et validations essentielles. Les écrans complets de décision/admin et la transaction multi-table doivent être achevés après validation du schéma/ACL sur l'instance ; les règles métier réutilisables sont présentes dans `workflow-core.js`. La signature électronique reste expressément hors périmètre.
