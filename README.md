# Workflow BSPP — permissions à l'étranger

Widget personnalisé pour la demande et le suivi des permissions à l'étranger dans Grist.

Le document Grist héberge toutes les tables métier, les référentiels, l'historique et les règles d'accès. Le dossier `widget/` contient l'interface HTML, CSS et JavaScript. La version GitHub Pages est destinée à la recette et charge l'API officielle depuis `docs.getgrist.com`. Pour un déploiement SSI, cette dépendance doit être remplacée par le script fourni par l'instance Grist ou une copie interne approuvée.

Le widget comporte trois parcours : tableau de bord, création/soumission d'une demande et « Mes actions » pour la conformité, le chef de corps et la BSPS. Les décisions mettent à jour `Demandes`, `Actions` et `Historique` dans un appel groupé.

## Vérification locale

```powershell
npm test
python migration/migrate_resana.py source-resana.csv --out migration/output
```

Lire `HYPOTHESES.md` et `GUIDE_INSTALLATION.md` avant tout déploiement. Les données historiques RESANA, les URL de pièces jointes et les fichiers générés par la migration sont exclus du dépôt.
