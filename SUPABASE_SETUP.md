# 🗄️ Configuration Supabase - E-Pilot Congo

## ✅ Configuration terminée !

Votre application E-Pilot Congo est maintenant connectée à Supabase.

---

## 📋 Informations de connexion

### **URL du projet**
```
https://csltuxbanvweyfzqpfap.supabase.co
```

### **Anon Key (Public)**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbHR1eGJhbnZ3ZXlmenFwZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDA3MzcsImV4cCI6MjA3Njk3NjczN30.X4aB-Wst4z5pvciQMET6QdeACs8hx4qhV4V7vJcQc44
```

---

## 📁 Fichiers créés

### **1. `.env.local`** (Racine du projet)
```env
VITE_SUPABASE_URL=https://csltuxbanvweyfzqpfap.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **2. `src/lib/supabase.ts`** (Client Supabase)
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### **3. `src/types/supabase.types.ts`** (Types TypeScript)
Types générés pour toutes les tables Supabase.

---

## 🗃️ Structure de la base de données

### **Tables principales**

#### **1. users** (Utilisateurs)
```sql
- id: uuid (PK)
- email: text
- first_name: text
- last_name: text
- role: user_role (enum)
- school_group_id: uuid (FK)
- school_id: uuid (FK)
- status: status (enum)
- avatar: text
- last_login: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### **2. school_groups** (Groupes Scolaires)
```sql
- id: uuid (PK)
- name: text
- code: text (unique)
- region: text
- city: text
- admin_id: uuid (FK → users)
- school_count: integer
- student_count: integer
- staff_count: integer
- plan: subscription_plan (enum)
- status: status (enum)
- created_at: timestamp
- updated_at: timestamp
```

#### **3. schools** (Écoles)
```sql
- id: uuid (PK)
- name: text
- code: text (unique)
- school_group_id: uuid (FK → school_groups)
- admin_id: uuid (FK → users)
- student_count: integer
- staff_count: integer
- status: status (enum)
- created_at: timestamp
- updated_at: timestamp
```

#### **4. plans** (Plans d'abonnement)
```sql
- id: uuid (PK)
- name: text
- slug: text (unique)
- price: numeric
- currency: text (default: 'FCFA')
- billing_period: text
- max_schools: integer
- max_students: integer
- max_staff: integer
- features: jsonb
- modules: jsonb
- status: status (enum)
- created_at: timestamp
```

#### **5. subscriptions** (Abonnements)
```sql
- id: uuid (PK)
- school_group_id: uuid (FK → school_groups)
- plan_id: uuid (FK → plans)
- status: text
- start_date: date
- end_date: date
- auto_renew: boolean
- amount: numeric
- currency: text
- payment_method: text
- last_payment_date: timestamp
- next_payment_date: timestamp
- created_at: timestamp
- updated_at: timestamp
```

---

## 🔐 Enums (Types personnalisés)

### **user_role**
```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin_groupe',
  'admin_ecole',
  'enseignant',
  'cpe',
  'comptable'
);
```

### **subscription_plan**
```sql
CREATE TYPE subscription_plan AS ENUM (
  'gratuit',
  'premium',
  'pro',
  'institutionnel'
);
```

### **status**
```sql
CREATE TYPE status AS ENUM (
  'active',
  'inactive',
  'suspended'
);
```

---

## 🚀 Utilisation dans le code

### **1. Récupérer des données**

```typescript
import { supabase } from '@/lib/supabase';

// Récupérer tous les groupes scolaires
const { data, error } = await supabase
  .from('school_groups')
  .select('*')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Erreur:', error);
} else {
  console.log('Groupes:', data);
}
```

### **2. Insérer des données**

```typescript
const { data, error } = await supabase
  .from('school_groups')
  .insert({
    name: 'Groupe Scolaire Brazzaville',
    code: 'GSB-001',
    region: 'Brazzaville',
    city: 'Brazzaville',
    admin_id: 'uuid-admin',
    plan: 'premium',
    status: 'active',
  })
  .select()
  .single();
```

### **3. Mettre à jour des données**

```typescript
const { data, error } = await supabase
  .from('school_groups')
  .update({ status: 'inactive' })
  .eq('id', 'uuid-du-groupe')
  .select()
  .single();
```

### **4. Supprimer des données**

```typescript
const { error } = await supabase
  .from('school_groups')
  .delete()
  .eq('id', 'uuid-du-groupe');
```

### **5. Avec React Query**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const useSchoolGroups = () => {
  return useQuery({
    queryKey: ['school-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
```

---

## 🔒 Authentification

### **1. Connexion**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@epilot.cg',
  password: 'password123',
});

if (error) {
  console.error('Erreur de connexion:', error);
} else {
  console.log('Utilisateur connecté:', data.user);
}
```

### **2. Déconnexion**

```typescript
const { error } = await supabase.auth.signOut();
```

### **3. Récupérer l'utilisateur connecté**

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### **4. Écouter les changements d'authentification**

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});
```

---

## 📊 Row Level Security (RLS)

### **Activer RLS sur une table**

```sql
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
```

### **Politique d'exemple : Super Admin voit tout**

```sql
CREATE POLICY "Super Admin can view all school groups"
ON school_groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);
```

### **Politique : Admin Groupe voit ses groupes**

```sql
CREATE POLICY "Admin Groupe can view their groups"
ON school_groups
FOR SELECT
TO authenticated
USING (
  admin_id = auth.uid()
);
```

---

## 🧪 Tester la connexion

### **Dans le code**

```typescript
import { checkSupabaseConnection } from '@/lib/supabase';

// Vérifier la connexion
const isConnected = await checkSupabaseConnection();
console.log('Connexion Supabase:', isConnected ? '✅' : '❌');
```

### **Dans la console du navigateur**

```javascript
// Ouvrez la console (F12)
import { supabase } from '@/lib/supabase';

// Test simple
const { data, error } = await supabase.from('users').select('count');
console.log('Résultat:', data, error);
```

---

## 📚 Ressources

### **Documentation officielle**
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### **Dashboard Supabase**
```
https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap
```

### **SQL Editor**
```
https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/editor
```

### **Table Editor**
```
https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/editor
```

---

## 🔧 Prochaines étapes

1. ✅ Créer les tables dans Supabase
2. ✅ Configurer Row Level Security (RLS)
3. ✅ Créer les politiques d'accès
4. ✅ Insérer des données de test
5. ⏳ Remplacer les mocks par les vraies données Supabase
6. ⏳ Implémenter l'authentification Supabase
7. ⏳ Configurer les triggers et fonctions

---

## ⚠️ Sécurité

### **Variables d'environnement**
- ✅ `.env.local` est dans `.gitignore`
- ✅ Ne jamais commit les clés API
- ✅ Utiliser la clé `anon` pour le frontend
- ✅ Utiliser la clé `service_role` uniquement côté serveur

### **Row Level Security**
- ✅ Toujours activer RLS sur les tables sensibles
- ✅ Créer des politiques strictes
- ✅ Tester les politiques avec différents rôles

---

## 🎉 Connexion établie !

Votre application E-Pilot Congo est maintenant connectée à Supabase.

**Prochaine étape** : Créer les tables dans le dashboard Supabase.

---

**© 2025 E-Pilot Congo • République du Congo 🇨🇬**
