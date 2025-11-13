# ✅ Résumé des Corrections SQL

**Date** : 1er novembre 2025

---

## 🔍 Structure Réelle de la Table

```sql
CREATE TABLE school_groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  admin_id UUID NOT NULL,
  school_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  plan subscription_plan NOT NULL,  -- ENUM: 'gratuit', 'premium', 'pro', 'institutionnel'
  status status NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  address TEXT,
  phone TEXT,
  website TEXT,
  founded_year TEXT,
  description TEXT,
  logo TEXT,
  plan_id UUID
);
```

---

## ✅ Script SQL Corrigé

Le script `CREATE_ADMIN_GROUPE.sql` a été mis à jour pour :

1. **Créer un utilisateur temporaire** pour satisfaire la contrainte `admin_id NOT NULL`
2. **Créer le groupe scolaire** avec les bonnes colonnes
3. **Créer le vrai utilisateur** dans Supabase Auth
4. **Mettre à jour** `admin_id` avec le vrai UUID
5. **Supprimer** l'utilisateur temporaire

---

## 🚀 Pour Utiliser

### Étape 1 : Créer l'utilisateur dans Supabase Auth
```
Dashboard Supabase → Authentication → Users → Add user
Email: int@epilot.com
Password: int1@epilot.COM
Auto Confirm: ✅ OUI
→ Copier l'UUID
```

### Étape 2 : Exécuter le script SQL
```
1. Ouvrir CREATE_ADMIN_GROUPE_SIMPLE.sql
2. Remplacer 'VOTRE_UUID_ICI' par l'UUID copié (2 fois)
3. Exécuter dans SQL Editor Supabase
```

### Étape 3 : Se connecter
```
http://localhost:5173/login
Email: int@epilot.com
Password: int1@epilot.COM
```

---

**Les scripts SQL sont maintenant corrigés et prêts à l'emploi !** ✅
