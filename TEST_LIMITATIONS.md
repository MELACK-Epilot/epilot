# 🧪 TEST DES LIMITATIONS DYNAMIQUES

**Date** : 7 novembre 2025, 12:25 PM

---

## ✅ INSTALLATION TERMINÉE

Les fonctions SQL ont été créées avec succès :
- ✅ `check_plan_limit()` - Vérifier les limites
- ✅ `increment_resource_count()` - Incrémenter compteurs
- ✅ `decrement_resource_count()` - Décrémenter compteurs

---

## 🧪 TESTS À EFFECTUER

### **TEST 1 : Créer une École (Limite OK)**

1. **Ouvrir** : http://localhost:5173/dashboard/schools
2. **Cliquer** : "Nouvelle École"
3. **Remplir** le formulaire
4. **Cliquer** : "Enregistrer"

**✅ Résultat attendu** :
```
✅ École créée avec succès
```

---

### **TEST 2 : Créer une École (Limite Atteinte)**

**Prérequis** : Avoir un groupe avec plan Gratuit (max 1 école) et déjà 1 école créée

1. **Ouvrir** : http://localhost:5173/dashboard/schools
2. **Cliquer** : "Nouvelle École"
3. **Remplir** le formulaire
4. **Cliquer** : "Enregistrer"

**❌ Résultat attendu** :
```
❌ Limite de 1 école(s) atteinte pour le plan Gratuit. 
   Veuillez mettre à niveau votre plan.
```

---

### **TEST 3 : Créer un Utilisateur (Limite OK)**

1. **Ouvrir** : http://localhost:5173/dashboard/users
2. **Cliquer** : "Nouvel Utilisateur"
3. **Remplir** le formulaire
4. **Cliquer** : "Enregistrer"

**✅ Résultat attendu** :
```
✅ Utilisateur créé avec succès
```

---

### **TEST 4 : Créer un Utilisateur (Limite Atteinte)**

**Prérequis** : Avoir un groupe avec plan Gratuit (max 10 users) et déjà 10 utilisateurs

1. **Ouvrir** : http://localhost:5173/dashboard/users
2. **Cliquer** : "Nouvel Utilisateur"
3. **Remplir** le formulaire
4. **Cliquer** : "Enregistrer"

**❌ Résultat attendu** :
```
❌ Limite de 10 utilisateur(s) atteinte pour le plan Gratuit. 
   Veuillez mettre à niveau votre plan.
```

---

## 🔍 VÉRIFICATION SQL

### **Vérifier les Compteurs**

```sql
SELECT 
  id,
  name,
  plan,
  school_count,
  student_count,
  staff_count
FROM school_groups;
```

### **Vérifier une Limite**

```sql
-- Remplacer 'group-id' par un vrai ID
SELECT * FROM check_plan_limit('group-id', 'schools');
SELECT * FROM check_plan_limit('group-id', 'users');
```

### **Tester l'Incrémentation**

```sql
-- Avant
SELECT school_count FROM school_groups WHERE id = 'group-id';

-- Incrémenter
SELECT increment_resource_count('group-id', 'schools', 1);

-- Après (devrait être +1)
SELECT school_count FROM school_groups WHERE id = 'group-id';
```

---

## 📊 CRÉER DES PLANS DE TEST

### **Plan 1 : Gratuit (Limité)**

```sql
INSERT INTO subscription_plans (
  name, slug, price, currency, billing_period,
  max_schools, max_students, max_staff, max_storage,
  is_active
) VALUES (
  'Gratuit',
  'gratuit',
  0,
  'FCFA',
  'monthly',
  1,    -- ✅ 1 école max
  10,   -- ✅ 10 élèves max
  5,    -- ✅ 5 staff max
  1,    -- ✅ 1 GB max
  true
);
```

### **Plan 2 : Premium (Moyen)**

```sql
INSERT INTO subscription_plans (
  name, slug, price, currency, billing_period,
  max_schools, max_students, max_staff, max_storage,
  is_active
) VALUES (
  'Premium',
  'premium',
  50000,
  'FCFA',
  'monthly',
  5,    -- ✅ 5 écoles max
  50,   -- ✅ 50 élèves max
  20,   -- ✅ 20 staff max
  10,   -- ✅ 10 GB max
  true
);
```

### **Plan 3 : Illimité**

```sql
INSERT INTO subscription_plans (
  name, slug, price, currency, billing_period,
  max_schools, max_students, max_staff, max_storage,
  is_active
) VALUES (
  'Illimité',
  'illimite',
  250000,
  'FCFA',
  'monthly',
  -1,   -- ✅ Illimité
  -1,   -- ✅ Illimité
  -1,   -- ✅ Illimité
  -1,   -- ✅ Illimité
  true
);
```

---

## 🔄 ASSIGNER UN PLAN À UN GROUPE

```sql
-- 1. Récupérer l'ID du plan
SELECT id, name FROM subscription_plans WHERE slug = 'gratuit';

-- 2. Assigner le plan au groupe
INSERT INTO school_group_subscriptions (
  school_group_id,
  plan_id,
  status,
  start_date
) VALUES (
  'VOTRE-GROUP-ID',
  'PLAN-ID-RECUPERE',
  'active',
  NOW()
);
```

---

## ✅ CHECKLIST DE VALIDATION

### **Installation**
- [ ] Script SQL exécuté sans erreur
- [ ] Fonction `check_plan_limit` existe
- [ ] Fonction `increment_resource_count` existe
- [ ] Fonction `decrement_resource_count` existe
- [ ] Permissions accordées

### **Tests SQL**
- [ ] `check_plan_limit('group-id', 'schools')` retourne un résultat
- [ ] `check_plan_limit('group-id', 'users')` retourne un résultat
- [ ] `increment_resource_count` incrémente correctement
- [ ] `decrement_resource_count` décrémente correctement

### **Tests Application**
- [ ] Création d'école avec limite OK fonctionne
- [ ] Création d'école avec limite atteinte est bloquée
- [ ] Message d'erreur clair affiché
- [ ] Création d'utilisateur avec limite OK fonctionne
- [ ] Création d'utilisateur avec limite atteinte est bloquée

### **UI (Optionnel)**
- [ ] Composant `QuotaDisplay` fonctionne
- [ ] Barres de progression affichées
- [ ] Alertes affichées quand proche limite
- [ ] Bouton "Mettre à niveau" visible

---

## 🐛 DÉPANNAGE

### **Erreur : "function check_plan_limit does not exist"**

**Solution** :
1. Vérifier que le script SQL a été exécuté
2. Rafraîchir la connexion Supabase
3. Vérifier les permissions : `GRANT EXECUTE ON FUNCTION check_plan_limit TO authenticated;`

### **Erreur : "Aucun plan d'abonnement actif trouvé"**

**Solution** :
1. Vérifier qu'un plan existe : `SELECT * FROM subscription_plans;`
2. Vérifier l'assignation : `SELECT * FROM school_group_subscriptions WHERE school_group_id = 'group-id';`
3. Vérifier le statut : `status = 'active'`

### **Compteurs incorrects**

**Solution** : Recalculer les compteurs
```sql
-- Recalculer school_count
UPDATE school_groups sg
SET school_count = (
  SELECT COUNT(*) FROM schools WHERE school_group_id = sg.id
);

-- Recalculer student_count
UPDATE school_groups sg
SET student_count = (
  SELECT COUNT(*) FROM users WHERE school_group_id = sg.id AND role = 'eleve'
);

-- Recalculer staff_count
UPDATE school_groups sg
SET staff_count = (
  SELECT COUNT(*) FROM users WHERE school_group_id = sg.id AND role != 'eleve'
);
```

---

## 🎊 FÉLICITATIONS !

Si tous les tests passent, votre système de **limitations dynamiques** est **100% opérationnel** ! 🚀

**Prochaines étapes** :
1. Créer vos plans personnalisés
2. Assigner les plans aux groupes
3. Afficher les quotas sur le dashboard (optionnel)

---

**Support** : Consultez `IMPLEMENTATION_LIMITATIONS_DYNAMIQUES.md` pour plus de détails

**Date** : 7 novembre 2025, 12:25 PM  
**Statut** : ✅ PRÊT À TESTER
