# Guide utilisateur

La page d'accueil présente vos seules actions autorisées. Les cartes résument urgences, retards et corrections ; recherche et statut filtrent la liste.

La page « Mes actions » présente les actions `A_FAIRE` et `EN_COURS` visibles selon les règles Grist. « Prendre en charge » horodate la réception et la prise en charge. « Traiter » ouvre le dossier et propose uniquement les décisions de l'étape : validation, retour motivé, refus définitif ou transmission BSPS.

Pour créer une demande, choisir « Nouvelle demande », sélectionner le personnel autorisé, le pays et les dates, saisir le motif et justifier toute urgence. L'unité, l'entité et la catégorie sont issues des référentiels et ne sont pas librement modifiables. Enregistrer d'abord le brouillon, puis ajouter le PDF SOFIA dans la colonne native Grist. Vérifier et soumettre.

Après soumission, le dossier est verrouillé. Un retour affiche le motif et rend seulement les champs autorisés modifiables ; décrire les corrections, remplacer le PDF si nécessaire, puis « Soumettre à nouveau ». La version augmente et les décisions précédentes restent dans l'historique. « Refusée » est définitif ; « À corriger » ne l'est pas.

Le responsable conformité peut valider, retourner avec motif ou refuser selon son rôle. Le chef de corps fait de même à son étape. La BSPS transmet et termine le workflow. « ⚠ Hors délai » reste traitable.

L'export s'effectue avec la fonction XLSX native Grist depuis une vue autorisée. Signaler immédiatement toute donnée d'une autre unité visible. Aucun courriel ni notification externe n'est envoyé.

## Ajouter du personnel

Le menu « Gestion > Personnel » est visible uniquement pour un gestionnaire d'unité ou un administrateur. Un gestionnaire ne peut choisir que sa propre unité. Toute fiche créée par cet écran est active, sans privilège administrateur ou gestionnaire, et reçoit le rôle `UTILISATEUR`.

Pour un import groupé, utiliser un CSV UTF-8 avec les colonnes `EmailProConnect;Nom;Prenom;Matricule;CodeUnite`. Le widget contrôle les unités, courriels et doublons, puis affiche un aperçu avant l'import. Le fichier est lu localement et n'est envoyé à aucun serveur tiers. La limite est de 500 lignes et 2 Mo.

L'ajout d'une fiche `Personnel` ne donne pas, à lui seul, accès au document. Chaque personne doit encore être invitée avec son adresse exacte dans « Gérer les utilisateurs » de Grist. Les droits supérieurs restent attribués par l'administrateur via le circuit de demande de droits.
