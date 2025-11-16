# 🎨 Palette de Couleurs Officielle E-Pilot

## 📊 Couleurs par Niveau Scolaire

### 🎓 Maternelle (Préscolaire)
- **Couleur** : Bleu Foncé Institutionnel
- **Hex** : `#1D3557`
- **Tailwind** : `bg-[#1D3557]`
- **Usage** : Représente le sérieux et la confiance institutionnelle

### 📗 Primaire
- **Couleur** : Vert Cité Positive
- **Hex** : `#2A9D8F`
- **Tailwind** : `bg-[#2A9D8F]`
- **Usage** : Évoque la croissance et l'apprentissage

### 🏫 Collège
- **Couleur** : Or Républicain
- **Hex** : `#E9C46A`
- **Tailwind** : `bg-[#E9C46A]`
- **Usage** : Symbolise l'excellence et la valeur

### 🎓 Lycée
- **Couleur** : Rouge Sobre
- **Hex** : `#E63946`
- **Tailwind** : `bg-[#E63946]`
- **Usage** : Représente la passion et l'ambition

---

## 🎨 Couleurs Complémentaires

### Blanc Cassé
- **Hex** : `#F9F9F9`
- **Usage** : Arrière-plans, cartes

### Gris Bleu Clair
- **Hex** : `#DCE3EA`
- **Usage** : Bordures, séparateurs

---

## 📋 Application dans le Code

### Fichier : `loadSchoolLevels.ts`

```typescript
const niveauxMapping = [
  { 
    id: 'maternelle', 
    name: 'Maternelle', 
    color: 'bg-[#1D3557]',  // Bleu Foncé Institutionnel
  },
  { 
    id: 'primaire', 
    name: 'Primaire', 
    color: 'bg-[#2A9D8F]',  // Vert Cité Positive
  },
  { 
    id: 'college', 
    name: 'Collège', 
    color: 'bg-[#E9C46A]',  // Or Républicain
  },
  { 
    id: 'lycee', 
    name: 'Lycée', 
    color: 'bg-[#E63946]',  // Rouge Sobre
  },
];
```

---

## 🎯 Résultat Visuel

### Dashboard Proviseur

```
┌─────────────────────────────────────────────────┐
│ 🎓 MATERNELLE (Bleu #1D3557)                    │
│ 0 élèves • 0 classes • 0 enseignants            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE (Vert #2A9D8F)                      │
│ 0 élèves • 0 classes • 0 enseignants            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏫 COLLÈGE (Or #E9C46A)                         │
│ 0 élèves • 0 classes • 0 enseignants            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🎓 LYCÉE (Rouge #E63946)                        │
│ 0 élèves • 0 classes • 0 enseignants            │
└─────────────────────────────────────────────────┘
```

---

## ✅ Avantages de Cette Palette

1. **Identité Visuelle Forte**
   - Chaque niveau a sa couleur distinctive
   - Reconnaissance immédiate

2. **Cohérence**
   - Palette harmonieuse
   - Couleurs complémentaires

3. **Accessibilité**
   - Bon contraste
   - Lisibilité optimale

4. **Professionnalisme**
   - Couleurs sobres et institutionnelles
   - Adaptées au contexte éducatif

---

## 🔄 Récupération Automatique

**Oui**, les couleurs sont automatiquement appliquées depuis la base de données :

1. **Supabase** → Niveaux actifs (`has_preschool`, `has_primary`, etc.)
2. **Hook** → `loadSchoolLevels()` récupère les niveaux
3. **Mapping** → Associe chaque niveau à sa couleur officielle
4. **Dashboard** → Affiche les cartes avec les bonnes couleurs

**Aucune intervention manuelle nécessaire !** 🎯

---

## 📊 Palette Complète

| Niveau      | Couleur                    | Hex       | RGB           |
|-------------|----------------------------|-----------|---------------|
| Maternelle  | Bleu Foncé Institutionnel  | #1D3557   | 29, 53, 87    |
| Primaire    | Vert Cité Positive         | #2A9D8F   | 42, 157, 143  |
| Collège     | Or Républicain             | #E9C46A   | 233, 196, 106 |
| Lycée       | Rouge Sobre                | #E63946   | 230, 57, 70   |
| Blanc Cassé | Arrière-plan               | #F9F9F9   | 249, 249, 249 |
| Gris Bleu   | Bordures                   | #DCE3EA   | 220, 227, 234 |

---

**Date** : 15 novembre 2025  
**Version** : 2.2.1 - Palette Officielle  
**Statut** : ✅ APPLIQUÉ
