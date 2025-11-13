# 🚨 Actions correctives immédiates - E-Pilot Congo

**Date** : 29 octobre 2025 - 8h45  
**Statut** : 147 erreurs TypeScript détectées

---

## 📊 Diagnostic

### ✅ **Supabase : Configuration OK**
- ✅ Connexion établie
- ✅ Toutes les tables existent :
  - users
  - school_groups (avec toutes les colonnes requises)
  - schools
  - plans
  - subscriptions
  - business_categories
  - modules

### ⚠️ **Problèmes identifiés**

1. **Row Level Security (RLS)** bloque les insertions
   - Erreur : `new row violates row-level security policy`
   - Impact : Impossible de créer des groupes scolaires sans utilisateur authentifié

2. **Types TypeScript Supabase obsolètes**
   - 147 erreurs TypeScript dans 23 fichiers
   - Les types ne correspondent pas à la structure réelle de la base de données
   - Erreurs principales : `Property 'xxx' does not exist on type 'never'`

---

## 🔧 Solutions à appliquer (dans l'ordre)

### **ÉTAPE 1 : Désactiver RLS pour le développement** ⚠️

**Fichier** : `SUPABASE_DISABLE_RLS_DEV.sql`

1. Ouvrir le dashboard Supabase :
   ```
   https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/sql
   ```

2. Aller dans **SQL Editor** → **New query**

3. Copier-coller le contenu de `SUPABASE_DISABLE_RLS_DEV.sql` :
   ```sql
   ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
   ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
   ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE business_categories DISABLE ROW LEVEL SECURITY;
   ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
   ```

4. Cliquer sur **Run**

**⚠️ IMPORTANT** : Cette action est UNIQUEMENT pour le développement. Réactivez RLS avant la production !

---

### **ÉTAPE 2 : Régénérer les types TypeScript Supabase**

**Option A : Avec Supabase CLI (recommandé)**

```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# Générer les types
npx supabase gen types typescript --project-id csltuxbanvweyfzqpfap > src/types/supabase.types.ts
```

**Option B : Manuellement via le dashboard**

1. Aller sur : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/api
2. Copier les types TypeScript générés
3. Remplacer le contenu de `src/types/supabase.types.ts`

---

### **ÉTAPE 3 : Vérifier la configuration**

```bash
# Tester la connexion et la configuration
npx tsx scripts/check-supabase-config.ts
```

**Résultat attendu** :
```
✅ Connexion: OK
✅ Toutes les tables présentes
✅ Toutes les colonnes présentes
✅ Insertion test réussie
```

---

### **ÉTAPE 4 : Recompiler le projet**

```bash
# Nettoyer le cache
npm run clean  # ou rm -rf dist node_modules/.vite

# Recompiler
npm run build
```

**Résultat attendu** : 0 erreur TypeScript

---

## 📋 Checklist de validation

- [ ] RLS désactivé sur toutes les tables
- [ ] Types TypeScript régénérés
- [ ] Script de vérification passe sans erreur
- [ ] Compilation réussie (0 erreur)
- [ ] Formulaire de création de groupe fonctionne
- [ ] Données persistées dans Supabase

---

## 🎯 Test final

1. **Lancer l'application** :
   ```bash
   npm run dev
   ```

2. **Tester la création d'un groupe** :
   - Aller sur http://localhost:5173/dashboard/school-groups
   - Cliquer sur "Nouveau groupe"
   - Remplir le formulaire :
     - Nom : "Groupe Test"
     - Code : "TEST-001"
     - Région : "Brazzaville"
     - Ville : "Brazzaville"
     - Plan : "Gratuit"
   - Cliquer sur "Créer"

3. **Vérifier dans Supabase** :
   - Aller sur : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap/editor
   - Ouvrir la table `school_groups`
   - Vérifier que le groupe "Groupe Test" est présent

---

## 🚨 Si ça ne fonctionne toujours pas

### Problème : Erreurs TypeScript persistent

**Solution** : Supprimer et régénérer les types
```bash
rm src/types/supabase.types.ts
npx supabase gen types typescript --project-id csltuxbanvweyfzqpfap > src/types/supabase.types.ts
```

### Problème : RLS bloque toujours

**Solution** : Vérifier que RLS est bien désactivé
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Si `rowsecurity = true`, réexécuter `SUPABASE_DISABLE_RLS_DEV.sql`

### Problème : Connexion Supabase échoue

**Solution** : Vérifier les variables d'environnement
```bash
# Afficher les variables
cat .env.local

# Vérifier qu'elles sont bien chargées
npm run dev
# Ouvrir la console du navigateur (F12)
# Taper : import.meta.env.VITE_SUPABASE_URL
```

---

## 📞 Informations de connexion Supabase

- **URL** : https://csltuxbanvweyfzqpfap.supabase.co
- **Project ID** : csltuxbanvweyfzqpfap
- **Dashboard** : https://supabase.com/dashboard/project/csltuxbanvweyfzqpfap

---

## 🎉 Résultat final attendu

Après avoir suivi toutes les étapes :

✅ 0 erreur TypeScript  
✅ Formulaire de création fonctionnel  
✅ Données persistées dans Supabase  
✅ Application prête pour le développement  

---

**Prochaine étape** : Implémenter l'authentification réelle pour remplacer le mock
