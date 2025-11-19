---
description: PlanFormSize
auto_execution_mode: 1
---

# 🧩 Règles de découpage automatique - Code React

## 📏 Limites strictes
* **Fichier React** : MAX 350 lignes (idéal : 200-300)
* **Hook custom** : MAX 100 lignes
* **Fonction utilitaire** : MAX 50 lignes
* **Composant** : MAX 250 lignes

## 🔹 Découpage obligatoire SI :
1. Fichier > 300 lignes → **STOP & REFACTOR**
2. État local > 5 `useState` → Hook custom
3. Fonction > 30 lignes → Extraire dans `utils/`
4. JSX répété 3+ fois → Composant dédié
5. Logique métier dans composant → Déplacer vers `hooks/`

## 📦 Architecture imposée
```
src/
├── components/
│   └── FeatureName/
│       ├── FeatureName.tsx         # Composition (< 200 lignes)
│       ├── FeatureNameSection.tsx  # Sous-composants
│       └── FeatureName.types.ts    # Types locaux
├── hooks/
│   └── useFeatureName.ts           # Logique réutilisable (< 100 lignes)
├── utils/
│   └── featureName.utils.ts        # Helpers purs (< 50 lignes)
└── types/
    └── featureName.types.ts        # Types partagés
```

## ✅ Checklist avant validation
- [ ] Aucun fichier > 350 lignes
- [ ] Chaque composant a UNE responsabilité
- [ ] Logique métier séparée de l'UI
- [ ] Pas d'imports circulaires
- [ ] Tests possibles sur chaque partie

## 🚨 Refactorisation proactive
À **250 lignes**, propose automatiquement :
1. Les parties extractibles
2. La nouvelle structure de fichiers
3. Le plan de migration des imports

## ⚠️ Exceptions (avec justification) :
* Pages complexes avec sections fortement couplées
* Configuration de routes/schemas > 350 lignes
* Composants de formulaires multi-étapes

## 🎯 Objectif
Code **modulaire**, **testable**, **maintenable** sans compromis.