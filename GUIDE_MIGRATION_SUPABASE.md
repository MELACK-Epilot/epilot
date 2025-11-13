# 🚀 Guide de Migration Supabase - Groupes Scolaires

## 📋 Étapes d'installation

### **1. Exécuter la migration**

Connectez-vous à votre projet Supabase et exécutez le script de migration :

#### **Option A : Via l'interface Supabase**
1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu de `SUPABASE_MIGRATION_SCHOOL_GROUPS.sql`
5. Cliquez sur **Run**

#### **Option B : Via CLI Supabase**
```bash
# Si vous avez Supabase CLI installé
supabase db push

# Ou exécutez directement le fichier
psql $DATABASE_URL < SUPABASE_MIGRATION_SCHOOL_GROUPS.sql
```

---

### **2. Vérifier la migration**

Après l'exécution, vérifiez que tout fonctionne :

```sql
-- Vérifier les colonnes ajoutées
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'school_groups'
ORDER BY ordinal_position;

-- Vérifier les données de test
SELECT name, code, region, city, phone, website, founded_year
FROM school_groups
LIMIT 5;
```

---

### **3. Activer Realtime**

Le script active automatiquement Realtime, mais vérifiez dans l'interface :

1. Allez dans **Database** > **Replication**
2. Vérifiez que `school_groups` est coché
3. Si non, cochez-le et cliquez sur **Save**

---

### **4. Tester la connexion**

Dans votre application React, testez la connexion :

```tsx
// Test rapide dans la console du navigateur
import { supabase } from '@/lib/supabase';

// Récupérer les groupes
const { data, error } = await supabase
  .from('school_groups')
  .select('*')
  .limit(5);

console.log('Groupes:', data);
console.log('Erreur:', error);
```

---

## 🔧 Configuration Supabase

### **Variables d'environnement**

Assurez-vous que votre fichier `.env` contient :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anonyme
```

### **Fichier de configuration Supabase**

Vérifiez `src/lib/supabase.ts` :

```tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

---

## 🧪 Tests

### **Test 1 : Lecture des données**
```tsx
const { data, error } = await supabase
  .from('school_groups')
  .select('*');

console.log('✅ Lecture:', data?.length, 'groupes');
```

### **Test 2 : Création**
```tsx
const { data, error } = await supabase
  .from('school_groups')
  .insert({
    name: 'Test Groupe',
    code: 'TEST-001',
    region: 'Brazzaville',
    city: 'Brazzaville',
    plan: 'gratuit',
    admin_id: 'votre-user-id',
  })
  .select()
  .single();

console.log('✅ Création:', data);
```

### **Test 3 : Temps réel**
```tsx
const channel = supabase
  .channel('test_realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'school_groups',
  }, (payload) => {
    console.log('🔄 Changement détecté:', payload);
  })
  .subscribe();

// Nettoyage
// supabase.removeChannel(channel);
```

---

## 🐛 Résolution de problèmes

### **Erreur : "relation already exists"**
✅ **Solution** : C'est normal ! La table existe déjà. Utilisez le script de migration qui ajoute seulement les colonnes manquantes.

### **Erreur : "permission denied"**
❌ **Problème** : Les politiques RLS bloquent l'accès
✅ **Solution** : 
1. Vérifiez que vous êtes authentifié
2. Vérifiez que votre utilisateur a le rôle `super_admin`
3. Ou désactivez temporairement RLS pour tester :
```sql
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
```

### **Erreur : "column does not exist"**
❌ **Problème** : Les nouvelles colonnes n'ont pas été ajoutées
✅ **Solution** : Exécutez la migration `SUPABASE_MIGRATION_SCHOOL_GROUPS.sql`

### **Realtime ne fonctionne pas**
❌ **Problème** : Realtime non activé
✅ **Solution** :
1. Allez dans **Database** > **Replication**
2. Cochez `school_groups`
3. Ou exécutez :
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE school_groups;
```

---

## 📊 Structure finale de la table

Après migration, voici la structure complète :

```sql
CREATE TABLE school_groups (
  -- Identifiants
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  
  -- Localisation
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,                    -- ✨ NOUVEAU
  
  -- Contact
  phone TEXT,                      -- ✨ NOUVEAU
  website TEXT,                    -- ✨ NOUVEAU
  
  -- Historique
  founded_year INTEGER,            -- ✨ NOUVEAU
  description TEXT,                -- ✨ NOUVEAU
  logo TEXT,                       -- ✨ NOUVEAU
  
  -- Relations
  admin_id UUID REFERENCES users(id),
  
  -- Statistiques
  school_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  
  -- Abonnement
  plan subscription_plan NOT NULL DEFAULT 'gratuit',
  status status NOT NULL DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ Checklist finale

Avant de déployer en production :

- [ ] Migration exécutée sans erreur
- [ ] Colonnes ajoutées vérifiées
- [ ] Politiques RLS configurées
- [ ] Realtime activé et testé
- [ ] Variables d'environnement configurées
- [ ] Tests de lecture réussis
- [ ] Tests de création réussis
- [ ] Tests de modification réussis
- [ ] Tests de suppression réussis
- [ ] Tests temps réel réussis
- [ ] Données de test créées
- [ ] Documentation à jour

---

## 🎉 Prêt pour la production !

Une fois tous les tests passés, votre application est prête à être utilisée avec Supabase en temps réel !

**Commandes utiles** :
```bash
# Lancer l'application
npm run dev

# Build production
npm run build

# Preview production
npm run preview
```

**URLs** :
- Application : http://localhost:5173
- Supabase Dashboard : https://app.supabase.com
- Documentation : https://supabase.com/docs
