# 🔧 DÉPANNAGE - EDGE FUNCTION SANDBOX

## ❌ **PROBLÈME ACTUEL**

```
Symptômes:
- 2 popups s'affichent (toast)
- Mais rien ne se passe après
- Pas de génération de données
```

## 🔍 **DIAGNOSTIC**

### **Logs Observés**
```
Seulement des requêtes OPTIONS (CORS preflight)
Pas de requêtes POST
→ La fonction n'est jamais vraiment appelée
```

### **Cause Probable**
```
Problème d'authentification ou de configuration
de l'appel à la Edge Function
```

---

## ✅ **SOLUTIONS**

### **Solution 1 : Utiliser le Script Terminal (RECOMMANDÉ)**

C'est la méthode la plus fiable pour l'instant :

```bash
# Ouvrir un terminal
cd c:\MELACK\e-pilot

# Exécuter le script
npm run generate:sandbox

# Attendre 2 minutes
# ✅ Données générées !
```

**Avantages** :
- ✅ Fonctionne à 100%
- ✅ Feedback dans le terminal
- ✅ Pas de problème d'authentification

---

### **Solution 2 : Générer Directement en SQL**

Créer une fonction PostgreSQL qui génère les données :

```sql
-- Dans Supabase SQL Editor
CREATE OR REPLACE FUNCTION generate_sandbox_data_sql()
RETURNS json AS $$
DECLARE
  result json;
  group_id uuid;
  school_id uuid;
BEGIN
  -- Créer un groupe scolaire
  INSERT INTO school_groups (name, slug, description, is_sandbox)
  VALUES ('Test Academy', 'test-academy', 'Groupe de test', true)
  RETURNING id INTO group_id;
  
  -- Créer une école
  INSERT INTO schools (name, slug, type, school_group_id, is_sandbox)
  VALUES ('École Test', 'ecole-test', 'primaire', group_id, true)
  RETURNING id INTO school_id;
  
  -- Créer des élèves (exemple simple)
  INSERT INTO students (
    first_name, last_name, date_of_birth, gender, level,
    school_id, school_group_id, parent_name, parent_phone, is_sandbox
  )
  SELECT 
    'Élève' || i,
    'Famille' || i,
    '2010-01-01'::date,
    CASE WHEN i % 2 = 0 THEN 'M' ELSE 'F' END,
    'CP',
    school_id,
    group_id,
    'Parent' || i,
    '0600000000',
    true
  FROM generate_series(1, 100) i;
  
  -- Retourner le résultat
  SELECT json_build_object(
    'success', true,
    'message', 'Données générées',
    'students', 100
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION generate_sandbox_data_sql() TO authenticated;
```

Puis dans l'interface :

```typescript
const { data, error } = await supabase.rpc('generate_sandbox_data_sql');
```

---

### **Solution 3 : Déboguer la Edge Function**

Vérifier l'authentification :

```typescript
// Dans SandboxManager.tsx
const handleGenerate = async () => {
  setIsGenerating(true);
  
  try {
    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session);
    
    if (!session) {
      throw new Error('Non authentifié');
    }
    
    // Appeler la fonction
    const { data, error } = await supabase.functions.invoke('generate-sandbox', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    
    console.log('Response:', data, error);
    
    if (error) throw error;
    
    // ...
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

---

## 🎯 **RECOMMANDATION IMMÉDIATE**

### **Pour Générer les Données Maintenant**

**Utilise le script terminal** :

```bash
npm run generate:sandbox
```

C'est la méthode la plus fiable et la plus rapide.

### **Pour Déboguer la Edge Function**

1. Ouvre la console du navigateur (F12)
2. Clique sur "Générer les Données Sandbox"
3. Regarde les erreurs dans la console
4. Envoie-moi les erreurs pour que je corrige

---

## 📊 **ALTERNATIVE : FONCTION SQL SIMPLE**

En attendant que la Edge Function soit corrigée, je peux créer une fonction SQL qui génère quelques données de test :

```sql
-- Fonction simple pour tester
CREATE OR REPLACE FUNCTION quick_sandbox_test()
RETURNS json AS $$
BEGIN
  -- Créer 1 groupe
  INSERT INTO school_groups (name, slug, is_sandbox)
  VALUES ('Test Group', 'test-group', true);
  
  -- Créer 1 école
  INSERT INTO schools (name, slug, type, school_group_id, is_sandbox)
  SELECT 'Test School', 'test-school', 'primaire', id, true
  FROM school_groups WHERE slug = 'test-group';
  
  -- Créer 10 élèves
  INSERT INTO students (
    first_name, last_name, date_of_birth, gender, level,
    school_id, school_group_id, parent_name, parent_phone, is_sandbox
  )
  SELECT 
    'Élève' || i,
    'Test' || i,
    '2010-01-01',
    'M',
    'CP',
    s.id,
    s.school_group_id,
    'Parent' || i,
    '0600000000',
    true
  FROM generate_series(1, 10) i, schools s
  WHERE s.slug = 'test-school';
  
  RETURN json_build_object('success', true, 'students', 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Puis dans l'interface :

```typescript
const { data, error } = await supabase.rpc('quick_sandbox_test');
```

---

## 🎉 **RÉSUMÉ**

### **Solution Immédiate**
```bash
npm run generate:sandbox
```

### **Solution à Court Terme**
```
Créer une fonction SQL simple
Appeler via supabase.rpc()
```

### **Solution à Long Terme**
```
Déboguer la Edge Function
Corriger l'authentification
Tester et valider
```

---

**POUR L'INSTANT, UTILISE LE SCRIPT TERMINAL : `npm run generate:sandbox` 🚀**
