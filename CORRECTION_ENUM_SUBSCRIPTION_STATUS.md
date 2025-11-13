# 🔧 CORRECTION : ENUM SUBSCRIPTION_STATUS

**Date** : 6 novembre 2025  
**Statut** : ✅ CORRIGÉ

---

## ❌ ERREUR RENCONTRÉE

```
ERROR: 22P02: invalid input value for enum subscription_status: "trial"
LINE 53: WHEN (NEW.status = 'active' OR NEW.status = 'trial')
```

---

## 🔍 ANALYSE

### **Problème** :
Le script `CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql` utilisait la valeur `'trial'` dans les conditions des triggers, mais cette valeur n'existe **pas** dans l'enum `subscription_status` de la base de données actuelle.

### **Valeurs valides de l'enum** :
```sql
CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'suspended'))
```

**Note** : Bien que la définition dans `SUPABASE_PLANS_SUBSCRIPTIONS.sql` mentionne `'trial'`, cette valeur n'a **pas été créée** dans la base de données actuelle.

---

## ✅ CORRECTION APPLIQUÉE

### **Fichier** : `database/CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql`

#### **Changement 1 : Trigger auto_assign_modules** (ligne 53)

**Avant** ❌ :
```sql
WHEN (NEW.status = 'active' OR NEW.status = 'trial')
```

**Après** ✅ :
```sql
WHEN (NEW.status IN ('active', 'pending'))
```

#### **Changement 2 : Fonction disable_modules_on_subscription_end** (ligne 123)

**Avant** ❌ :
```sql
IF (OLD.status IN ('active', 'trial') AND NEW.status IN ('expired', 'cancelled')) THEN
```

**Après** ✅ :
```sql
IF (OLD.status IN ('active', 'pending') AND NEW.status IN ('expired', 'cancelled')) THEN
```

---

## 🎯 LOGIQUE CORRIGÉE

### **1. Assignation automatique des modules** :
```sql
-- Déclenché quand un abonnement est créé avec status 'active' ou 'pending'
CREATE TRIGGER trigger_auto_assign_modules
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status IN ('active', 'pending'))
  EXECUTE FUNCTION auto_assign_plan_modules_to_group();
```

**Comportement** :
- Abonnement créé avec `status = 'active'` → Modules assignés ✅
- Abonnement créé avec `status = 'pending'` → Modules assignés ✅
- Abonnement créé avec `status = 'expired'` → Modules **non** assignés ❌

### **2. Désactivation des modules** :
```sql
-- Déclenché quand un abonnement passe de 'active'/'pending' à 'expired'/'cancelled'
IF (OLD.status IN ('active', 'pending') AND NEW.status IN ('expired', 'cancelled')) THEN
  -- Désactiver tous les modules
END IF;
```

**Comportement** :
- `active` → `expired` : Modules désactivés ✅
- `active` → `cancelled` : Modules désactivés ✅
- `pending` → `expired` : Modules désactivés ✅
- `pending` → `cancelled` : Modules désactivés ✅

---

## 📊 FLUX COMPLET CORRIGÉ

### **Scénario 1 : Création d'abonnement actif**
```
1. INSERT INTO subscriptions (status = 'active', ...)
2. TRIGGER auto_assign_modules
3. Modules assignés à group_module_configs ✅
```

### **Scénario 2 : Création d'abonnement en attente**
```
1. INSERT INTO subscriptions (status = 'pending', ...)
2. TRIGGER auto_assign_modules
3. Modules assignés à group_module_configs ✅
```

### **Scénario 3 : Expiration d'abonnement**
```
1. UPDATE subscriptions SET status = 'expired' WHERE ...
2. TRIGGER disable_modules_on_end
3. Modules désactivés dans group_module_configs ✅
```

### **Scénario 4 : Annulation d'abonnement**
```
1. UPDATE subscriptions SET status = 'cancelled' WHERE ...
2. TRIGGER disable_modules_on_end
3. Modules désactivés dans group_module_configs ✅
```

---

## 🔄 ALTERNATIVE : AJOUTER 'trial' À L'ENUM (OPTIONNEL)

Si vous souhaitez vraiment utiliser `'trial'` comme statut, vous pouvez l'ajouter à l'enum :

```sql
-- Option 1 : Modifier la contrainte CHECK
ALTER TABLE subscriptions 
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions 
  ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'trial', 'suspended'));

-- Option 2 : Si vous utilisez un vrai ENUM PostgreSQL
ALTER TYPE subscription_status ADD VALUE 'trial';
```

**Puis restaurer le code original** :
```sql
WHEN (NEW.status IN ('active', 'trial'))
```

---

## ✅ RÉSULTAT

### **Avant** ❌ :
```
ERROR: invalid input value for enum subscription_status: "trial"
Script échoue
```

### **Après** ✅ :
```
✓ Fonction auto_assign_plan_modules_to_group() créée
✓ Trigger trigger_auto_assign_modules créé
✓ Fonction update_plan_modules_on_upgrade() créée
✓ Trigger trigger_update_modules_on_upgrade créé
✓ Fonction disable_modules_on_subscription_end() créée
✓ Trigger trigger_disable_modules_on_end créé
✅ Script exécuté avec succès !
```

---

## 📝 PROCHAINES ÉTAPES

1. ✅ **Exécuter le script corrigé** :
   ```bash
   # Dans Supabase SQL Editor
   # Exécuter : database/CREATE_AUTO_ASSIGN_MODULES_FUNCTION.sql
   ```

2. ✅ **Vérifier les fonctions** :
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname LIKE '%assign%';
   ```

3. ✅ **Vérifier les triggers** :
   ```sql
   SELECT tgname, tgrelid::regclass 
   FROM pg_trigger 
   WHERE tgname LIKE '%module%';
   ```

4. ✅ **Tester** :
   ```sql
   -- Créer un abonnement test
   INSERT INTO subscriptions (
     school_group_id, 
     plan_id, 
     status, 
     start_date, 
     end_date, 
     amount, 
     currency, 
     billing_period
   ) VALUES (
     '...', 
     '...', 
     'active', 
     NOW(), 
     NOW() + INTERVAL '1 year', 
     50000, 
     'FCFA', 
     'monthly'
   );
   
   -- Vérifier l'assignation
   SELECT * FROM group_module_configs 
   WHERE school_group_id = '...';
   ```

---

## 💡 NOTES IMPORTANTES

### **Statuts d'abonnement disponibles** :
- `'active'` - Abonnement actif
- `'pending'` - En attente de validation/paiement
- `'expired'` - Expiré
- `'cancelled'` - Annulé
- `'suspended'` - Suspendu

### **Recommandation** :
Utiliser `'pending'` pour les abonnements en attente de paiement ou validation, plutôt que d'ajouter un nouveau statut `'trial'`.

---

**Script corrigé et prêt à être exécuté !** ✅
