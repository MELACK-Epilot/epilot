# 🔧 Correction Bouton "Créer" - Formulaire Utilisateur

## ⚠️ Problème Identifié

**Symptômes :**
- Le bouton "➕ Créer" ne fonctionne pas
- Le champ "Groupe Scolaire" est vide
- Impossible de soumettre le formulaire

**Causes Possibles :**
1. ✅ **Validation conditionnelle manquante** - Le champ `schoolGroupId` est optionnel mais devrait être obligatoire pour admin_groupe
2. ⚠️ **Aucun groupe scolaire dans la base de données** - Le select est vide car il n'y a pas de données

---

## ✅ Correction 1 : Validation Conditionnelle

### **Problème**
Le schéma Zod définit `schoolGroupId` comme `.optional()`, mais il devrait être **obligatoire pour admin_groupe**.

### **Solution Appliquée**

**Fichier :** `src/features/dashboard/components/UserFormDialog.tsx` (ligne 85-104)

**Avant :**
```typescript
const createUserSchema = baseUserSchema.extend({
  password: z.string()...,
  sendWelcomeEmail: z.boolean().default(true),
});
```

**Après :**
```typescript
const createUserSchema = baseUserSchema.extend({
  password: z.string()...,
  sendWelcomeEmail: z.boolean().default(true),
}).refine((data) => {
  // Si le rôle est admin_groupe, schoolGroupId est obligatoire
  if (data.role === 'admin_groupe') {
    return data.schoolGroupId && data.schoolGroupId.length > 0;
  }
  return true;
}, {
  message: 'Le groupe scolaire est obligatoire pour un Administrateur de Groupe',
  path: ['schoolGroupId'],
});
```

**Effet :**
- ✅ Si rôle = `admin_groupe` → `schoolGroupId` **obligatoire**
- ✅ Si rôle = `super_admin` → `schoolGroupId` **optionnel**
- ✅ Message d'erreur clair si non rempli

---

## ⚠️ Correction 2 : Vérifier les Groupes Scolaires

### **Diagnostic**

Le champ "Groupe Scolaire" peut être vide si :
1. ❌ Aucun groupe scolaire n'existe dans la base de données
2. ❌ Erreur de connexion à Supabase
3. ❌ Problème de permissions RLS

### **Vérification dans Supabase**

**Étape 1 : Vérifier si des groupes existent**
```sql
SELECT id, name, code, status 
FROM school_groups 
WHERE status = 'active'
ORDER BY name;
```

**Résultat attendu :**
```
id                                   | name                    | code  | status
-------------------------------------|-------------------------|-------|--------
uuid-1                               | Groupe Scolaire Test    | GST01 | active
```

**Si aucun résultat :**
→ **Il faut créer au moins un groupe scolaire !**

---

### **Solution : Créer un Groupe Scolaire de Test**

**Option 1 : Via SQL (Rapide)**
```sql
INSERT INTO school_groups (
  name,
  code,
  description,
  address,
  city,
  department,
  country,
  phone,
  email,
  website,
  director_name,
  director_phone,
  director_email,
  status,
  plan_id
) VALUES (
  'Groupe Scolaire Pilote',
  'GSP001',
  'Groupe scolaire de test pour E-Pilot',
  '123 Avenue de la République',
  'Brazzaville',
  'Brazzaville',
  'Congo',
  '+242069698620',
  'contact@gsp.cg',
  'https://gsp.cg',
  'Jean Dupont',
  '+242069698621',
  'directeur@gsp.cg',
  'active',
  (SELECT id FROM subscription_plans WHERE slug = 'gratuit')
) RETURNING id, name, code;
```

**Option 2 : Via l'Interface (Recommandé)**
1. Aller sur la page **Groupes Scolaires**
2. Cliquer sur **"➕ Créer un Groupe Scolaire"**
3. Remplir le formulaire :
   - Nom : `Groupe Scolaire Pilote`
   - Code : `GSP001`
   - Email : `contact@gsp.cg`
   - Téléphone : `+242069698620`
   - Ville : `Brazzaville`
   - Plan : `Gratuit`
4. Cliquer sur **"Créer"**

---

## 🧪 Tests de Vérification

### **Test 1 : Vérifier le Chargement des Groupes**

**Dans la Console du Navigateur :**
```javascript
// Ouvrir la console (F12)
// Aller sur la page Utilisateurs
// Cliquer sur "Créer un Administrateur"
// Vérifier les logs :
```

**Logs attendus :**
```
🔄 useSchoolGroups: Début de la requête...
✅ useSchoolGroups: 1 groupe(s) trouvé(s)
```

**Si erreur :**
```
❌ useSchoolGroups: Erreur - [détails de l'erreur]
```

---

### **Test 2 : Vérifier la Validation**

**Étapes :**
1. Ouvrir le formulaire "Créer un Administrateur de Groupe"
2. Remplir tous les champs **SAUF** "Groupe Scolaire"
3. Cliquer sur "Créer"

**Résultat attendu :**
```
❌ Erreur affichée sous le champ "Groupe Scolaire" :
"Le groupe scolaire est obligatoire pour un Administrateur de Groupe"
```

---

### **Test 3 : Vérifier la Soumission**

**Étapes :**
1. Ouvrir le formulaire "Créer un Administrateur de Groupe"
2. Remplir **TOUS** les champs :
   - Prénom : `Jean`
   - Nom : `Dupont`
   - Email : `jean.dupont@test.cg`
   - Téléphone : `+242069698620`
   - Rôle : `Administrateur de Groupe Scolaire`
   - **Groupe Scolaire : `Groupe Scolaire Pilote`** ✅
   - Mot de passe : `Test1234!`
3. Cliquer sur "Créer"

**Résultat attendu :**
```
✅ Toast de succès : "Utilisateur créé avec succès"
✅ Redirection vers la liste des utilisateurs
✅ Nouvel utilisateur visible dans le tableau
```

---

## 🔍 Diagnostic Avancé

### **Vérifier les Permissions RLS**

**Problème possible :** Les politiques RLS empêchent la lecture des groupes scolaires.

**Vérification :**
```sql
-- Vérifier les politiques RLS sur school_groups
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'school_groups';
```

**Politique attendue pour SELECT :**
```sql
-- Super Admin peut tout voir
CREATE POLICY "Super Admin can view all school groups"
ON school_groups FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'super_admin'
);
```

**Si la politique n'existe pas, la créer :**
```sql
-- Activer RLS
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;

-- Créer la politique
CREATE POLICY "Super Admin can view all school groups"
ON school_groups FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'super_admin'
);
```

---

## 📋 Checklist de Résolution

### **Étape 1 : Vérifier la Base de Données**
- [ ] ✅ Exécuter `SELECT * FROM school_groups;`
- [ ] ✅ Vérifier qu'au moins 1 groupe existe
- [ ] ✅ Si aucun groupe, en créer un (voir SQL ci-dessus)

### **Étape 2 : Vérifier les Permissions**
- [ ] ✅ Vérifier les politiques RLS sur `school_groups`
- [ ] ✅ S'assurer que l'utilisateur connecté a accès aux groupes
- [ ] ✅ Vérifier le rôle de l'utilisateur connecté

### **Étape 3 : Vérifier le Frontend**
- [ ] ✅ Ouvrir la console du navigateur (F12)
- [ ] ✅ Aller sur la page Utilisateurs
- [ ] ✅ Cliquer sur "Créer un Administrateur"
- [ ] ✅ Vérifier les logs `useSchoolGroups`
- [ ] ✅ Vérifier que le select affiche des options

### **Étape 4 : Tester la Validation**
- [ ] ✅ Remplir le formulaire sans groupe
- [ ] ✅ Vérifier que l'erreur s'affiche
- [ ] ✅ Sélectionner un groupe
- [ ] ✅ Vérifier que l'erreur disparaît

### **Étape 5 : Tester la Soumission**
- [ ] ✅ Remplir tous les champs
- [ ] ✅ Sélectionner un groupe
- [ ] ✅ Cliquer sur "Créer"
- [ ] ✅ Vérifier le toast de succès
- [ ] ✅ Vérifier que l'utilisateur apparaît dans la liste

---

## 🎯 Solutions Rapides

### **Solution 1 : Créer un Groupe de Test (SQL)**
```sql
-- Copier-coller dans Supabase SQL Editor
INSERT INTO school_groups (
  name, code, email, phone, city, department, country, status, plan_id
) VALUES (
  'Groupe Scolaire Test',
  'GST001',
  'test@gst.cg',
  '+242069698620',
  'Brazzaville',
  'Brazzaville',
  'Congo',
  'active',
  (SELECT id FROM subscription_plans WHERE slug = 'gratuit')
);
```

### **Solution 2 : Désactiver Temporairement RLS (Développement Uniquement)**
```sql
-- ⚠️ ATTENTION : Uniquement pour le développement !
ALTER TABLE school_groups DISABLE ROW LEVEL SECURITY;
```

### **Solution 3 : Ajouter des Logs de Debug**

**Dans le formulaire :**
```typescript
// Ajouter dans UserFormDialog.tsx
console.log('📊 Groupes scolaires chargés:', schoolGroups);
console.log('📊 Nombre de groupes:', schoolGroups?.length);
console.log('📊 Loading:', isLoadingGroups);
```

---

## ✅ Résultat Attendu

**Après correction :**

1. ✅ Le champ "Groupe Scolaire" affiche des options
2. ✅ La validation fonctionne (erreur si non rempli pour admin_groupe)
3. ✅ Le bouton "Créer" fonctionne
4. ✅ L'utilisateur est créé avec succès
5. ✅ Toast de confirmation affiché

---

## 📁 Fichiers Modifiés

✅ `src/features/dashboard/components/UserFormDialog.tsx`
- Ligne 85-104 : Validation conditionnelle ajoutée

---

## 🚀 Prochaines Actions

1. **Vérifier la base de données** (SELECT sur school_groups)
2. **Créer un groupe de test** si nécessaire
3. **Tester le formulaire** avec tous les champs remplis
4. **Vérifier les logs** dans la console du navigateur

**Le formulaire devrait maintenant fonctionner correctement !** ✅
