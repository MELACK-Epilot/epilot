# 🗄️ Guide : Créer les tables dans Supabase

## ✅ Résultat de la vérification

```
❌ Les tables n'existent pas encore dans votre base de données Supabase
```

---

## 📋 Étapes pour créer les tables

### **Étape 1 : Ouvrir le SQL Editor**

1. **Cliquez sur ce lien** :
   ```
   https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/editor
   ```

2. **Connectez-vous** à votre compte Supabase si nécessaire

3. **Cliquez sur "SQL Editor"** dans le menu de gauche

---

### **Étape 2 : Copier le schéma SQL**

1. **Ouvrez le fichier** : `SUPABASE_SQL_SCHEMA.sql`

2. **Sélectionnez tout** (Ctrl+A)

3. **Copiez** (Ctrl+C)

---

### **Étape 3 : Exécuter le SQL**

1. **Dans le SQL Editor**, collez le contenu (Ctrl+V)

2. **Cliquez sur le bouton "Run"** (ou appuyez sur Ctrl+Enter)

3. **Attendez** que l'exécution se termine (environ 5-10 secondes)

4. **Vérifiez** qu'il n'y a pas d'erreurs

---

### **Étape 4 : Vérifier la création**

1. **Cliquez sur "Table Editor"** dans le menu de gauche

2. **Vous devriez voir** 9 tables :
   - ✅ users
   - ✅ school_groups
   - ✅ schools
   - ✅ plans
   - ✅ subscriptions
   - ✅ business_categories
   - ✅ modules
   - ✅ activity_logs
   - ✅ notifications

---

### **Étape 5 : Vérifier depuis votre application**

Relancez le script de vérification :

```bash
npm run check-db
```

Vous devriez voir :

```
✅ users                      - Existe
✅ school_groups              - Existe
✅ schools                    - Existe
✅ plans                      - Existe
✅ subscriptions              - Existe
✅ business_categories        - Existe
✅ modules                    - Existe
✅ activity_logs              - Existe
✅ notifications              - Existe

📊 Tables existantes: 9/9
📊 Tables manquantes: 0/9

✅ Toutes les tables sont présentes!
✅ La base de données est prête à l'emploi!
```

---

## 🎯 Ce qui sera créé

### **9 Tables**
1. **users** - Utilisateurs de la plateforme
2. **school_groups** - Groupes scolaires (réseaux d'écoles)
3. **schools** - Écoles individuelles
4. **plans** - Plans d'abonnement (Gratuit, Premium, Pro, Institutionnel)
5. **subscriptions** - Abonnements actifs
6. **business_categories** - Catégories métiers
7. **modules** - Modules fonctionnels
8. **activity_logs** - Journal d'activité
9. **notifications** - Notifications utilisateurs

### **4 Enums (Types personnalisés)**
- `user_role` : super_admin, admin_groupe, admin_ecole, enseignant, cpe, comptable
- `subscription_plan` : gratuit, premium, pro, institutionnel
- `status` : active, inactive, suspended
- `subscription_status` : active, expired, cancelled, pending

### **Sécurité (RLS)**
- Row Level Security activé sur toutes les tables
- Politiques d'accès par rôle
- Super Admin : accès total
- Admin Groupe : ses groupes uniquement
- Admin École : son école uniquement

### **Données initiales**
- 4 plans d'abonnement pré-configurés
- 1 compte Super Admin (admin@epilot.cg)

---

## ⚠️ En cas d'erreur

### **Erreur : "extension uuid-ossp does not exist"**

**Solution** : Activez l'extension manuellement

1. Dans le SQL Editor, exécutez :
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

2. Puis réexécutez le schéma complet

---

### **Erreur : "type already exists"**

**Solution** : Les types existent déjà, supprimez-les d'abord

1. Dans le SQL Editor, exécutez :
   ```sql
   DROP TYPE IF EXISTS user_role CASCADE;
   DROP TYPE IF EXISTS subscription_plan CASCADE;
   DROP TYPE IF EXISTS status CASCADE;
   DROP TYPE IF EXISTS subscription_status CASCADE;
   ```

2. Puis réexécutez le schéma complet

---

### **Erreur : "table already exists"**

**Solution** : Les tables existent déjà

1. Vérifiez dans le Table Editor
2. Si vous voulez recommencer à zéro :
   ```sql
   DROP TABLE IF EXISTS notifications CASCADE;
   DROP TABLE IF EXISTS activity_logs CASCADE;
   DROP TABLE IF EXISTS modules CASCADE;
   DROP TABLE IF EXISTS business_categories CASCADE;
   DROP TABLE IF EXISTS subscriptions CASCADE;
   DROP TABLE IF EXISTS plans CASCADE;
   DROP TABLE IF EXISTS schools CASCADE;
   DROP TABLE IF EXISTS school_groups CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```

3. Puis réexécutez le schéma complet

---

## 🚀 Après la création

### **1. Vérifier les données initiales**

```sql
-- Vérifier les plans
SELECT * FROM plans;

-- Vérifier le super admin
SELECT * FROM users;
```

### **2. Tester depuis votre application**

```typescript
import { supabase } from '@/lib/supabase';

// Test simple
const { data, error } = await supabase
  .from('plans')
  .select('*');

console.log('Plans:', data);
```

### **3. Commencer à utiliser**

Vous pouvez maintenant :
- ✅ Créer des groupes scolaires
- ✅ Ajouter des utilisateurs
- ✅ Gérer les abonnements
- ✅ Utiliser toutes les fonctionnalités

---

## 📚 Ressources

- **Dashboard Supabase** : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
- **SQL Editor** : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/editor
- **Table Editor** : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/editor
- **Documentation** : SUPABASE_SETUP.md

---

**© 2025 E-Pilot Congo • République du Congo 🇨🇬**
