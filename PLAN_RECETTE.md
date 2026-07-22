# Plan de recette

Précondition : document de recette sans données réelles, comptes U1 utilisateur, U1 gestionnaire, U2 gestionnaire, conformité, chef, BSPS, admin et inactif.

| Domaine | Scénarios | Résultat attendu |
|---|---|---|
| Identité | hors Grist, inconnu, inactif, chaque rôle | démo sans écriture hors Grist ; refus inconnu/inactif ; périmètre exact par rôle |
| Création | brouillon, obligatoires, urgence, pays inactif, catégorie sans délai, double clic | validation française ; une ligne seulement ; unité/entité/catégorie dérivées |
| Workflow | soumission, verrou, retour motivé, correction, resoumission/version, refus, validation, BSPS | transitions autorisées seulement, historique non destructif, terminal BSPS |
| Concurrence | deux décisions sur même révision, perte réseau, erreur API | seconde écriture refusée/rechargée ; message clair ; aucune action orpheline |
| Délais | catégories 21/22/23, calendrier/ouvrés, hors délai | date correcte ; signal texte+icône+couleur ; traitement non bloqué |
| PDF | PDF valide, fausse extension, MIME interdit, trop gros, remplacement | dépôt natif protégé ; rejet avant écriture ; trace de remplacement |
| Confidentialité | U1 tente U2 par table, référence, widget, formulaire, export, URL PJ | aucune donnée ni métadonnée U2 visible |
| Export | chaque rôle, Demandes/Actions/Historique/PJ | vrai XLSX natif, types et ACL conservés |
| Fin période | clôture, non-admin, confirmation, suppression coordonnée | workflow verrouillé ; suppression désactivée par défaut ; aucun orphelin |
| Accessibilité | clavier, focus, lecteur d'écran, contraste, zoom 200 %, 320 px | ordre logique, libellés, focus visible, WCAG AA visé |
| SSI | CSP, absence réseau externe, secrets, XSS, logs | aucune dépendance distante hors Grist interne ; aucun secret/PII journalisé |

Automatisation locale : `npm test`. Recette Grist obligatoire avant production, notamment ACL et pièces jointes. Conserver captures et identifiants fictifs dans un PV séparé.
