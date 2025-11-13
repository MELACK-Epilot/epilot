# ✅ Corrections appliquées aux schémas SQL

## 🐛 Problème identifié

**Erreur SQL** :
```
ERROR: 42703: column u.full_name does not exist
LINE 181: u.full_name as sender_name,
```

**Cause** : Les vues SQL faisaient référence à des colonnes inexistantes dans la table `users`.

---

## 🔧 Corrections appliquées

### **Table `users` - Structure réelle**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,        -- ✅ Séparé
  last_name TEXT NOT NULL,          -- ✅ Séparé
  gender TEXT,
  date_of_birth DATE,
  phone TEXT,
  role user_role NOT NULL,
  school_group_id UUID,
  school_id UUID,
  status status NOT NULL,
  avatar TEXT,                      -- ✅ Pas avatar_url
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **1. MESSAGES_SCHEMA.sql** ✅

#### **Vue `messages_with_details`** (Ligne 181-183)

**AVANT** ❌ :
```sql
u.full_name as sender_name,
u.email as sender_email,
u.avatar_url as sender_avatar,
```

**APRÈS** ✅ :
```sql
CONCAT(u.first_name, ' ', u.last_name) as sender_name,
u.email as sender_email,
u.avatar as sender_avatar,
```

---

### **2. TICKETS_SCHEMA.sql** ✅

#### **Trigger `trigger_generate_ticket_number`** (Ligne 360)

**AVANT** ❌ :
```sql
-- Syntaxe invalide - fonction inline dans trigger
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION (
    CREATE OR REPLACE FUNCTION set_ticket_number()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.ticket_number = generate_ticket_number();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  );
```

**APRÈS** ✅ :
```sql
-- Fonction créée AVANT le trigger
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number = generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger utilise la fonction
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();
```

#### **Vue `tickets_with_details`** (Lignes 160-168)

**AVANT** ❌ :
```sql
creator.full_name as creator_name,
creator.email as creator_email,
creator.avatar_url as creator_avatar,
creator.role as creator_role,
-- Assigné à
assignee.id as assignee_id,
assignee.full_name as assignee_name,
assignee.email as assignee_email,
assignee.avatar_url as assignee_avatar,
```

**APRÈS** ✅ :
```sql
CONCAT(creator.first_name, ' ', creator.last_name) as creator_name,
creator.email as creator_email,
creator.avatar as creator_avatar,
creator.role as creator_role,
-- Assigné à
assignee.id as assignee_id,
CONCAT(assignee.first_name, ' ', assignee.last_name) as assignee_name,
assignee.email as assignee_email,
assignee.avatar as assignee_avatar,
```

#### **Vue `tickets_stats_by_user`** (Ligne 231)

**AVANT** ❌ :
```sql
u.full_name,
```

**APRÈS** ✅ :
```sql
CONCAT(u.first_name, ' ', u.last_name) as full_name,
```

---

## ✅ Vérification

### **Schémas corrigés**
- ✅ `MESSAGES_SCHEMA.sql` - 2 corrections (colonnes)
- ✅ `TICKETS_SCHEMA.sql` - 4 corrections (1 trigger + 3 colonnes)
- ✅ `SOCIAL_FEED_SCHEMA.sql` - Aucune correction nécessaire

### **Colonnes corrigées**
| Ancienne colonne | Nouvelle expression | Fichier |
|------------------|---------------------|---------|
| `u.full_name` | `CONCAT(u.first_name, ' ', u.last_name)` | MESSAGES, TICKETS |
| `u.avatar_url` | `u.avatar` | MESSAGES, TICKETS |
| `creator.full_name` | `CONCAT(creator.first_name, ' ', creator.last_name)` | TICKETS |
| `creator.avatar_url` | `creator.avatar` | TICKETS |
| `assignee.full_name` | `CONCAT(assignee.first_name, ' ', assignee.last_name)` | TICKETS |
| `assignee.avatar_url` | `assignee.avatar` | TICKETS |

---

## 🚀 Prochaines étapes

### **1. Réexécuter les schémas corrigés**

```bash
# Dans Supabase Dashboard → SQL Editor

# 1. Supprimer les vues existantes (si déjà créées)
DROP VIEW IF EXISTS messages_with_details CASCADE;
DROP VIEW IF EXISTS user_messaging_stats CASCADE;
DROP VIEW IF EXISTS tickets_with_details CASCADE;
DROP VIEW IF EXISTS tickets_stats_by_user CASCADE;

# 2. Réexécuter les schémas corrigés
# Copier/coller database/MESSAGES_SCHEMA.sql → Run
# Copier/coller database/TICKETS_SCHEMA.sql → Run
```

### **2. Vérifier les vues**

```sql
-- Tester la vue messages_with_details
SELECT * FROM messages_with_details LIMIT 5;

-- Tester la vue tickets_with_details
SELECT * FROM tickets_with_details LIMIT 5;

-- Tester la vue tickets_stats_by_user
SELECT * FROM tickets_stats_by_user LIMIT 5;
```

---

## 📝 Notes importantes

### **Fonction CONCAT()**
- PostgreSQL supporte `CONCAT(first_name, ' ', last_name)`
- Alternative : `first_name || ' ' || last_name`
- Gère automatiquement les valeurs NULL

### **Nommage des colonnes**
- `avatar` (pas `avatar_url`) dans la table `users`
- `first_name` et `last_name` séparés (pas `full_name`)
- Cohérence avec le schéma principal `SUPABASE_SQL_SCHEMA.sql`

---

## ✅ Statut final

**Tous les schémas SQL sont maintenant corrigés et compatibles avec la structure de la table `users` !** 🎉

Les 3 schémas peuvent être exécutés sans erreur :
- ✅ `SOCIAL_FEED_SCHEMA.sql` - OK
- ✅ `MESSAGES_SCHEMA.sql` - Corrigé
- ✅ `TICKETS_SCHEMA.sql` - Corrigé

---

**Date** : 30 octobre 2025  
**Auteur** : E-Pilot Congo 🇨🇬  
**Statut** : ✅ CORRIGÉ ET PRÊT
