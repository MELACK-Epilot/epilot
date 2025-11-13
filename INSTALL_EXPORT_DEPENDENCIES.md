# Installation des dépendances d'export

## Dépendances nécessaires

Pour que les fonctions d'export (CSV, Excel, PDF) fonctionnent, installez les packages suivants :

```bash
npm install xlsx jspdf jspdf-autotable
```

## Types TypeScript

```bash
npm install --save-dev @types/jspdf
```

## Commande complète

```bash
npm install xlsx jspdf jspdf-autotable && npm install --save-dev @types/jspdf
```

## Packages installés

1. **xlsx** : Export Excel (.xlsx)
2. **jspdf** : Génération de PDF
3. **jspdf-autotable** : Tableaux automatiques dans PDF
4. **@types/jspdf** : Types TypeScript pour jsPDF

## Vérification

Après installation, vérifiez dans `package.json` :

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/jspdf": "^2.0.0"
  }
}
```

## Utilisation

Les fonctions d'export sont maintenant disponibles :

- **CSV** : Export texte séparé par virgules
- **Excel** : Export classeur Microsoft Excel
- **PDF** : Export document portable avec tableau

Le menu d'export apparaît dans la card verte avec 3 options.
