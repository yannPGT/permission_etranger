# Architecture fonctionnelle et SSI

Le navigateur charge un widget statique interne. Le widget communique uniquement avec l'instance Grist par `grist-plugin-api.js`; Grist applique les ACL avant de retourner ou modifier une ligne. ProConnect authentifie l'utilisateur auprès de l'instance et `user.Email`, normalisé en minuscules, le relie à `Personnel.EmailProConnect`.

## Déploiement recommandé

1. **Serveur HTTPS interne approuvé (recommandé)** : `widget/` est servi comme contenu statique, avec CSP stricte. Facile à auditer et mettre à jour.
2. Fichiers servis par l'instance Grist : acceptable uniquement si la version cible documente ce mécanisme.
3. Application interne séparée : inutile pour le périmètre actuel et augmente la surface d'attaque.

Le widget demande `requiredAccess: 'full'` car il crée et met à jour plusieurs tables. Cette autorisation donne techniquement un large pouvoir au code ; elle n'est acceptable qu'avec hébergement interne, revue de code, intégrité du déploiement et ACL Grist. Aucune ressource GitHub, CDN, police ou API externe n'est utilisée à l'exécution.

## Flux et protections

`Utilisateur → ProConnect/Grist → widget interne → API document Grist → tables/Attachments`. Les écritures doivent être atomiques via une seule action groupée quand plusieurs lignes sont concernées. Les ACL restent l'autorité ; le widget ne fait que réduire les erreurs ergonomiques.

Menaces principales : falsification d'unité (unité dérivée d'une référence Personnel et contrôlée par ACL), élévation de privilège (rôles/règles côté Grist), fuite via références/export/PJ (ACL colonne et ligne, vues filtrées sécurisées), XSS (rendu texte neutralisé), double clic (verrou local et bouton désactivé), concurrence (contrôle de version et action groupée à ajouter/valider sur l'instance), dépendance compromise (zéro dépendance distante), suppression partielle (procédure administrateur coordonnée, désactivée par défaut).

La signature du PDF est hors périmètre : aucun mécanisme cryptographique ne peut être conçu sans certificat, autorité de confiance et exigences SSI. Le processus doit indiquer si le PDF est signé avant dépôt ou manuellement hors widget.
