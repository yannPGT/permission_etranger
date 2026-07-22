# Workflow BSPP — permissions à l'étranger

Prototype installable et documenté pour Grist, sans dépendance d'exécution distante. Ouvrir `widget/index.html` pour le mode démonstration. En production, servir `widget/` en HTTPS interne et charger l'API plugin depuis l'instance Grist approuvée.

Commandes :

```powershell
npm test
python migration/migrate_resana.py source-resana.csv --out migration/output
```

Lire d'abord `HYPOTHESES.md` et `GUIDE_INSTALLATION.md`. Ce dépôt est une base fonctionnelle de recette, pas une preuve d'homologation SSI ni une configuration ACL déjà installée sur une instance.
