# ✅ Solution - Activer les Niveaux Scolaires d'une École

## 🎯 Problème Identifié

Votre école n'a **aucun niveau scolaire activé**, c'est pourquoi le Dashboard Proviseur affiche :
```
⚠️ Aucun niveau scolaire actif
```

---

## 📋 Cause

Lors de la création de l'école par l'Admin de Groupe, **les niveaux scolaires n'ont pas été cochés** dans le formulaire.

Le formulaire contient bien les champs (ils existent déjà !) :
- 🎓 Maternelle (Préscolaire)
- 📚 Primaire
- 🏫 Collège
- 🎓 Lycée

Mais si aucun n'est coché, l'école est créée sans niveaux actifs.

---

## ✅ Solution 1 : Via l'Interface Admin (RECOMMANDÉ)

### Étape 1 : Se Connecter en tant qu'Admin de Groupe

1. Déconnectez-vous du compte Proviseur
2. Connectez-vous avec le compte **Admin de Groupe**

### Étape 2 : Aller dans la Gestion des Écoles

1. Menu → **Écoles**
2. Trouvez votre école dans la liste
3. Cliquez sur **Modifier** (icône crayon)

### Étape 3 : Activer les Niveaux

Dans le formulaire de modification :

1. Scrollez jusqu'à la section **"Niveaux d'enseignement proposés"**
2. **Cochez les niveaux** que votre école propose :
   - ☑️ Maternelle (si vous avez ce niveau)
   - ☑️ Primaire (recommandé)
   - ☑️ Collège (si vous avez ce niveau)
   - ☑️ Lycée (si vous avez ce niveau)

3. Cliquez sur **"Enregistrer"**

### Étape 4 : Vérifier

1. Reconnectez-vous en tant que **Proviseur**
2. Le Dashboard devrait maintenant afficher les niveaux activés
3. Vous verrez les cartes KPI pour chaque niveau

---

## ✅ Solution 2 : Via SQL (RAPIDE)

Si vous avez accès à Supabase, vous pouvez activer les niveaux directement :

```sql
-- Remplacer 'YOUR_SCHOOL_ID' par l'ID réel de votre école

-- Activer Primaire et Collège (exemple)
UPDATE schools 
SET 
  has_preschool = false,
  has_primary = true,
  has_middle = true,
  has_high = false
WHERE id = 'YOUR_SCHOOL_ID';

-- Vérification
SELECT 
  name,
  has_preschool,
  has_primary,
  has_middle,
  has_high
FROM schools 
WHERE id = 'YOUR_SCHOOL_ID';
```

---

## 🔍 Comment Trouver l'ID de Votre École

### Méthode 1 : Via la Console Navigateur

1. Connectez-vous en tant que Proviseur
2. Ouvrez la console (F12)
3. Cherchez le log : `🔄 Chargement dashboard pour école: [ID]`
4. Copiez cet ID

### Méthode 2 : Via SQL

```sql
-- Trouver l'école par son nom
SELECT id, name, has_preschool, has_primary, has_middle, has_high
FROM schools 
WHERE name LIKE '%nom-de-votre-ecole%';
```

---

## 📊 Résultat Attendu

Après activation des niveaux, le Dashboard Proviseur affichera :

```
┌─────────────────────────────────────────────────┐
│  Détail par Niveau Éducatif        [2 niveaux]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📗 PRIMAIRE              💰 0.00M  [✓ Performant]│
│ 0 élèves • 0 classes • 0 enseignants            │
├─────────────────────────────────────────────────┤
│ [👥 0] [📚 0] [👨‍🏫 0] [🎯 85%]                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏫 COLLÈGE               💰 0.00M  [✓ Performant]│
│ 0 élèves • 0 classes • 0 enseignants            │
├─────────────────────────────────────────────────┤
│ [👥 0] [📚 0] [👨‍🏫 0] [🎯 82%]                   │
└─────────────────────────────────────────────────┘
```

**Note** : Les KPIs seront à 0 tant que vous n'aurez pas ajouté d'élèves et de classes.

---

## 🎯 Prochaines Étapes

Une fois les niveaux activés, ajoutez des données :

### 1. Ajouter des Élèves

Via l'interface ou SQL :
```sql
INSERT INTO students (school_id, first_name, last_name, level, status, enrollment_date)
VALUES 
  ('YOUR_SCHOOL_ID', 'Jean', 'Dupont', 'primaire', 'active', NOW()),
  ('YOUR_SCHOOL_ID', 'Marie', 'Martin', 'college', 'active', NOW());
```

### 2. Ajouter des Classes

```sql
INSERT INTO classes (school_id, name, level, status, capacity)
VALUES 
  ('YOUR_SCHOOL_ID', 'CM2 A', 'primaire', 'active', 40),
  ('YOUR_SCHOOL_ID', '6ème A', 'college', 'active', 35);
```

### 3. Ajouter des Enseignants

Via l'interface Admin de Groupe :
1. Menu → **Utilisateurs**
2. Créer un utilisateur avec rôle **Enseignant**
3. Affecter à votre école

---

## 🔧 Amélioration Future Suggérée

### Valeur par Défaut

Pour éviter ce problème à l'avenir, on pourrait :

1. **Cocher "Primaire" par défaut** dans le formulaire (déjà fait !)
2. **Rendre obligatoire** la sélection d'au moins un niveau (déjà fait !)
3. **Afficher un message** si aucun niveau n'est coché

Le formulaire actuel a déjà ces protections, mais il faut **bien cocher les niveaux** lors de la création.

---

## 📝 Checklist de Vérification

Après avoir activé les niveaux :

- [ ] Niveaux activés dans la table `schools`
- [ ] Déconnexion/Reconnexion en tant que Proviseur
- [ ] Dashboard affiche "X niveaux" (X > 0)
- [ ] Cartes de niveaux visibles
- [ ] Pas de message "Aucun niveau scolaire actif"

---

## 💡 Conseil Important

**Lors de la création d'une nouvelle école**, l'Admin de Groupe DOIT :

1. ✅ Remplir le nom et le code
2. ✅ **COCHER AU MOINS UN NIVEAU** (très important !)
3. ✅ Remplir les autres informations
4. ✅ Enregistrer

Sans niveau coché, l'école sera créée mais le Dashboard Proviseur sera vide.

---

## 🎯 Résumé Rapide

**Problème** : École sans niveaux actifs  
**Cause** : Niveaux non cochés lors de la création  
**Solution** : Modifier l'école et cocher les niveaux  
**Résultat** : Dashboard Proviseur fonctionnel

---

**Date**: 15 novembre 2025  
**Version**: 2.1.0  
**Statut**: Solution Complète
