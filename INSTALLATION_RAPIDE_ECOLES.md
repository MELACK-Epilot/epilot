# 🚀 Installation Rapide - Page Écoles Premium

## Méthode Simple (Copier-Coller)

### Étape 1 : Ouvrir les fichiers

1. Ouvrir `Schools.PREMIUM.tsx`
2. Ouvrir `Schools.tsx`

### Étape 2 : Copier-Coller

1. **Sélectionner TOUT** le contenu de `Schools.PREMIUM.tsx` (Ctrl+A)
2. **Copier** (Ctrl+C)
3. Aller dans `Schools.tsx`
4. **Sélectionner TOUT** (Ctrl+A)
5. **Coller** (Ctrl+V)
6. **Sauvegarder** (Ctrl+S)

### Étape 3 : Changer le nom de la fonction

Dans `Schools.tsx`, ligne 49, changer :
```typescript
// AVANT
export default function SchoolsPremium() {

// APRÈS
export default function Schools() {
```

### Étape 4 : Recharger

Appuyer sur **Ctrl+R** dans le navigateur

---

## ✅ Résultat Attendu

Vous devriez voir :
- ✅ 8 stats cards animées
- ✅ Barre de recherche et filtres
- ✅ Toggle vue cartes/tableau
- ✅ Vue cartes avec les écoles
- ✅ 4 graphiques en bas

---

## 🐛 Si Erreur

### Erreur : Cannot find module '../components/schools'

**Solution** : Vérifier que le dossier existe :
```
src/features/dashboard/components/schools/
├── SchoolsStats.tsx
├── SchoolsCharts.tsx
├── SchoolsGridView.tsx
├── SchoolDetailsDialog.tsx
└── index.ts
```

### Erreur : schools is undefined

**Solution** : Vérifier que vous avez des écoles dans la base de données

---

**Installation simple en 4 étapes !** ⚡
