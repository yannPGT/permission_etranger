# Workflow BSPP — permissions à l'étranger

Widget personnalisé pour la demande et le suivi des permissions à l'étranger dans Grist.

Le document Grist héberge toutes les tables métier, les référentiels, l'historique et les règles d'accès. Le dossier `widget/` contient l'interface HTML, CSS et JavaScript à servir depuis un hébergement HTTPS approuvé.

## Vérification locale

```powershell
npm test
python migration/migrate_resana.py source-resana.csv --out migration/output
```

Lire `HYPOTHESES.md` et `GUIDE_INSTALLATION.md` avant tout déploiement. Les données historiques RESANA, les URL de pièces jointes et les fichiers générés par la migration sont exclus du dépôt.
