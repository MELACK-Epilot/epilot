# ✅ Checklist - Vérification Dashboard Proviseur

## 🎯 Objectif
Vérifier que le Dashboard Proviseur affiche correctement les niveaux scolaires après la mise à jour.

---

## 📋 Étapes de Vérification

### Étape 1 : Connexion
- [ ] Déconnectez-vous du compte Admin de Groupe
- [ ] Connectez-vous en tant que **Proviseur**
- [ ] Vous êtes redirigé vers `/user`

### Étape 2 : Ouvrir la Console
- [ ] Appuyez sur **F12** pour ouvrir les outils développeur
- [ ] Allez dans l'onglet **Console**
- [ ] Rafraîchissez la page (F5)

### Étape 3 : Vérifier les Logs

Vous devriez voir ces logs dans l'ordre :

#### 1. Logs du Hook `useDirectorDashboard`
```javascript
🔄 Chargement dashboard pour école: [school_id]
🏫 Niveaux actifs de l'école: {
  has_preschool: false,
  has_primary: true,
  has_middle: true,
  has_high: false
}
✅ 2 niveau(x) actif(s): Primaire, Collège
✅ Niveaux chargés: 2
📈 Tendances chargées: 6 mois
🔊 Activation des écoutes temps réel pour l'école: [school_id]
```

#### 2. Logs du Composant `DirectorDashboard`
```javascript
🔍 DirectorDashboard - schoolLevels reçus: [
  {
    id: "primaire",
    name: "Primaire",
    students_count: X,
    classes_count: X,
    // ...
  },
  {
    id: "college",
    name: "Collège",
    students_count: X,
    classes_count: X,
    // ...
  }
]
🔍 DirectorDashboard - Nombre de niveaux: 2
✅ DirectorDashboard - niveauxEducatifs convertis: [...]
```

---

## 🎨 Vérification Visuelle

### Section "Détail par Niveau Éducatif"

#### Header de Section
```
┌─────────────────────────────────────────────────┐
│  📄 Détail par Niveau Éducatif    [2 niveaux]  │
└─────────────────────────────────────────────────┘
```
- [ ] Badge affiche "2 niveaux" (ou le nombre correct)
- [ ] Pas de message "Aucun niveau scolaire actif"

#### Carte Primaire (si activé)
```
┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE              💰 0.00M  [✓ Performant]│
│ X élèves • X classes • X enseignants            │
│                            [Voir Détails]        │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │👥 Élèves│ │📚 Classes│ │👨‍🏫 Profs│ │🎯 Taux  ││
│ │    X    │ │    X    │ │    X    │ │  85%   ││
│ │  ↗️ +X% │ │  ↗️ +X  │ │  → 0    │ │ ↗️ +X% ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────────────────┘
```

Vérifications :
- [ ] Icône 📗 visible
- [ ] Titre "PRIMAIRE" en gras
- [ ] Badge de revenus 💰 visible
- [ ] Badge de performance (✓ Performant ou ⚠ À surveiller)
- [ ] Résumé (X élèves • X classes • X enseignants)
- [ ] Bouton "Voir Détails" présent
- [ ] **4 cartes KPI toujours visibles** (pas besoin de cliquer)
- [ ] Chaque carte affiche : icône, valeur, tendance

#### Carte Collège (si activé)
```
┌─────────────────────────────────────────────────┐
│ 🏫 COLLÈGE               💰 0.00M  [✓ Performant]│
│ X élèves • X classes • X enseignants            │
│                            [Voir Détails]        │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │👥 Élèves│ │📚 Classes│ │👨‍🏫 Profs│ │🎯 Taux  ││
│ │    X    │ │    X    │ │    X    │ │  82%   ││
│ │  ↗️ +X% │ │  ↗️ +X  │ │  → 0    │ │ ↗️ +X% ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────────────────┘
```

Vérifications :
- [ ] Icône 🏫 visible
- [ ] Titre "COLLÈGE" en gras
- [ ] Badge de revenus 💰 visible
- [ ] Badge de performance visible
- [ ] Résumé visible
- [ ] Bouton "Voir Détails" présent
- [ ] **4 cartes KPI toujours visibles**

---

## 🔍 Si les KPIs Sont à 0

C'est **normal** si vous n'avez pas encore ajouté de données. Vous verrez :

```
┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE              💰 0.00M  [✓ Performant]│
│ 0 élèves • 0 classes • 0 enseignants            │
├─────────────────────────────────────────────────┤
│ [👥 0] [📚 0] [👨‍🏫 0] [🎯 85%]                   │
└─────────────────────────────────────────────────┘
```

**C'est correct !** Les niveaux sont affichés, il faut maintenant ajouter :
- Des élèves
- Des classes
- Des enseignants

---

## 🚨 Problèmes Possibles

### Problème 1 : "Aucun niveau scolaire actif"

**Symptôme** : Message d'erreur au lieu des cartes

**Cause** : Les niveaux ne sont toujours pas activés en BDD

**Solution** :
```sql
-- Vérifier les niveaux
SELECT name, has_preschool, has_primary, has_middle, has_high
FROM schools 
WHERE id = (SELECT school_id FROM users WHERE email = 'proviseur@email.com');

-- Si tous à false, activer
UPDATE schools 
SET has_primary = true, has_middle = true
WHERE id = 'school-id';
```

### Problème 2 : Logs "0 niveau(x) actif(s)"

**Symptôme** : Console affiche "0 niveau(x) actif(s)"

**Cause** : La mise à jour n'a pas fonctionné

**Solution** :
1. Retourner en Admin de Groupe
2. Modifier à nouveau l'école
3. Vérifier que les checkboxes sont cochées
4. Regarder les logs console lors de l'enregistrement
5. Vérifier le message "École mise à jour avec succès"

### Problème 3 : Erreur dans la Console

**Symptôme** : Erreurs rouges dans la console

**Cause** : Problème de permissions RLS ou données manquantes

**Solution** :
```sql
-- Vérifier l'accès proviseur
SELECT * FROM schools WHERE id = (
  SELECT school_id FROM users WHERE email = 'proviseur@email.com'
);

-- Si erreur, vérifier les politiques RLS
```

---

## 📊 Données de Test (Optionnel)

Si vous voulez voir des vraies statistiques, ajoutez des données de test :

### Ajouter des Élèves
```sql
-- Remplacer 'YOUR_SCHOOL_ID' par votre ID d'école

INSERT INTO students (school_id, first_name, last_name, level, status, enrollment_date, date_of_birth, gender, academic_year)
VALUES 
  -- Primaire
  ('YOUR_SCHOOL_ID', 'Jean', 'Dupont', 'primaire', 'active', NOW(), '2014-05-15', 'M', '2024-2025'),
  ('YOUR_SCHOOL_ID', 'Marie', 'Martin', 'primaire', 'active', NOW(), '2014-08-20', 'F', '2024-2025'),
  ('YOUR_SCHOOL_ID', 'Paul', 'Bernard', 'primaire', 'active', NOW(), '2014-03-10', 'M', '2024-2025'),
  
  -- Collège
  ('YOUR_SCHOOL_ID', 'Sophie', 'Dubois', 'college', 'active', NOW(), '2011-09-25', 'F', '2024-2025'),
  ('YOUR_SCHOOL_ID', 'Lucas', 'Petit', 'college', 'active', NOW(), '2011-12-05', 'M', '2024-2025');
```

### Ajouter des Classes
```sql
INSERT INTO classes (school_id, name, level, status, capacity, academic_year)
VALUES 
  ('YOUR_SCHOOL_ID', 'CM2 A', 'primaire', 'active', 30, '2024-2025'),
  ('YOUR_SCHOOL_ID', '6ème A', 'college', 'active', 35, '2024-2025');
```

### Ajouter des Enseignants
```sql
INSERT INTO users (email, first_name, last_name, role, school_id, status)
VALUES 
  ('prof.primaire@test.com', 'Professeur', 'Primaire', 'enseignant', 'YOUR_SCHOOL_ID', 'active'),
  ('prof.college@test.com', 'Professeur', 'Collège', 'enseignant', 'YOUR_SCHOOL_ID', 'active');
```

### Ajouter des Paiements
```sql
INSERT INTO fee_payments (school_id, amount, status, created_at)
VALUES 
  ('YOUR_SCHOOL_ID', 50000, 'paid', NOW()),
  ('YOUR_SCHOOL_ID', 75000, 'paid', NOW()),
  ('YOUR_SCHOOL_ID', 60000, 'paid', NOW());
```

Après ajout, rafraîchissez le Dashboard (F5) et vous verrez :
```
┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE              💰 0.19M  [✓ Performant]│
│ 3 élèves • 1 classes • 1 enseignants            │
├─────────────────────────────────────────────────┤
│ [👥 3↗️] [📚 1↗️] [👨‍🏫 1→] [🎯 85%↗️]           │
└─────────────────────────────────────────────────┘
```

---

## ✅ Résultat Final Attendu

### Dashboard Complet
```
┌─────────────────────────────────────────────────┐
│  🏫 École Charles Zackama                       │
│  Sembé, Congo • 15 novembre 2025                │
│  [En temps réel]                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         📊 Vue d'Ensemble École                 │
│  8 élèves | 2 classes | 2 profs | 85%          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📄 Détail par Niveau Éducatif    [2 niveaux]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE              💰 0.19M  [✓ Performant]│
│ 3 élèves • 1 classes • 1 enseignants            │
├─────────────────────────────────────────────────┤
│ [👥 3↗️] [📚 1↗️] [👨‍🏫 1→] [🎯 85%↗️]           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏫 COLLÈGE               💰 0.14M  [✓ Performant]│
│ 2 élèves • 1 classes • 1 enseignants            │
├─────────────────────────────────────────────────┤
│ [👥 2↗️] [📚 1↗️] [👨‍🏫 1→] [🎯 82%↗️]           │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Checklist Finale

- [ ] Connecté en tant que Proviseur
- [ ] Console ouverte (F12)
- [ ] Logs "X niveau(x) actif(s)" > 0
- [ ] Badge "X niveaux" visible
- [ ] Cartes de niveaux affichées
- [ ] 4 KPI par niveau toujours visibles
- [ ] Pas de message d'erreur
- [ ] Temps réel activé (badge "En temps réel")

---

**Si tout est coché, le Dashboard Proviseur fonctionne parfaitement ! 🎉**

---

**Date**: 15 novembre 2025  
**Version**: 2.1.1  
**Statut**: Checklist de Vérification
