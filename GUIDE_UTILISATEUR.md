# Guide utilisateur

La page d'accueil présente vos seules actions autorisées. Les cartes résument urgences, retards et corrections ; recherche et statut filtrent la liste.

La page « Mes actions » présente les actions `A_FAIRE` et `EN_COURS` visibles selon les règles Grist. « Prendre en charge » horodate la réception et la prise en charge. « Traiter » ouvre le dossier et propose uniquement les décisions de l'étape : validation, retour motivé, refus définitif ou transmission BSPS.

Pour créer une demande, choisir « Nouvelle demande », sélectionner le personnel autorisé, le pays et les dates, saisir le motif et justifier toute urgence. Après l'enregistrement du brouillon, le widget ouvre la fiche native Grist : ajouter le PDF SOFIA dans `PiecesJointes`, puis fermer la fiche. Depuis le détail du brouillon, le bouton « Ajouter ou remplacer le PDF SOFIA » permet de rouvrir cette fiche. L'unité, l'entité et la catégorie sont issues des référentiels et ne sont pas librement modifiables. La soumission relit automatiquement la demande et reste impossible tant qu'aucune pièce jointe n'est présente.

Après soumission, le dossier est verrouillé. En cas de retour, un encadré rouge affiche clairement le motif, l’étape, l’auteur et la date du retour. Le bouton « Modifier les informations » permet alors de corriger l’objet, le pays, les dates, le motif et l’urgence. Le personnel concerné, l’unité et l’entité restent verrouillés. Remplacer le PDF si nécessaire, puis choisir « Soumettre à nouveau ». La version augmente et les décisions précédentes restent dans l'historique. « Refusée » est définitif ; « À corriger » ne l'est pas.

Le bouton « Annuler la demande » est proposé sur toute demande non terminale à son auteur, au gestionnaire de l’unité concernée et à l’administrateur. Le motif est obligatoire. Après confirmation, le statut devient `ANNULEE`, les actions encore ouvertes sont neutralisées et l’auteur, la date et le motif sont conservés dans l’historique. Cette opération est définitive et ne remplace pas le retour pour correction.

Aux étapes « Contrôle conformité » et « Validation chef de corps », choisir explicitement « Valider le PDF sans modification » ou « Déposer une nouvelle version ». Dans le second cas, ouvrir la fiche Grist depuis le bouton proposé et ajouter le PDF modifié à la suite des pièces jointes existantes, sans supprimer l’ancienne pièce. Le widget crée alors une ligne `VersionsPDF`, désactive la version précédente, relie les versions d’entrée et de sortie à l’action et trace l’auteur, la date et le commentaire. Une validation sans modification conserve la même version d’entrée et de sortie tout en enregistrant la décision.

Le responsable conformité peut valider, retourner avec motif ou refuser selon son rôle. Le chef de corps fait de même à son étape. La BSPS transmet et termine le workflow. « ⚠ Hors délai » reste traitable.

L'export s'effectue avec la fonction XLSX native Grist depuis une vue autorisée. Signaler immédiatement toute donnée d'une autre unité visible. Aucun courriel ni notification externe n'est envoyé.

## Ajouter du personnel

Le menu « Gestion > Personnel » est visible uniquement pour un gestionnaire d'unité ou un administrateur. Un gestionnaire ne peut choisir que sa propre unité. Toute fiche créée par cet écran est active, sans privilège administrateur ou gestionnaire, et reçoit le rôle `UTILISATEUR`.

Pour un import groupé, utiliser un CSV UTF-8 avec les colonnes `EmailProConnect;Nom;Prenom;Matricule;CodeUnite`. Le widget contrôle les unités, courriels et doublons, puis affiche un aperçu avant l'import. Le fichier est lu localement et n'est envoyé à aucun serveur tiers. La limite est de 500 lignes et 2 Mo.

L'ajout d'une fiche `Personnel` ne donne pas, à lui seul, accès au document. Chaque personne doit encore être invitée avec son adresse exacte dans « Gérer les utilisateurs » de Grist. Les droits supérieurs restent attribués par l'administrateur via le circuit de demande de droits.
