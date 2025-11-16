# 📸 Comment Ajouter un Logo à une École

## 🎯 Objectif
Ajouter ou mettre à jour le logo d'une école dans la base de données Supabase.

---

## ⚠️ IMPORTANT : Différence Logo Groupe vs Logo École

### 🏢 Logo du Groupe Scolaire
- **Table** : `school_groups`
- **Champ** : `logo`
- **Affichage** : Header de la page Établissement

### 🏫 Logo de l'École
- **Table** : `schools`
- **Champ** : `logo`
- **Affichage** : Carte de chaque école dans "Nos Écoles"

**⚠️ Ce sont 2 logos DIFFÉRENTS !**

---

## 🔧 Méthode 1 : Via Supabase Dashboard

### Étape 1 : Uploader l'Image
1. Aller dans **Storage** dans Supabase
2. Créer un bucket `school-logos` (si pas encore créé)
3. Uploader le logo de l'école (format PNG, JPG, SVG)
4. Copier l'URL publique

### Étape 2 : Mettre à Jour la Table
1. Aller dans **Table Editor** → `schools`
2. Trouver l'école (ex: "Charles Zackama de sembé")
3. Modifier le champ `logo`
4. Coller l'URL du logo
5. Sauvegarder

---

## 🔧 Méthode 2 : Via SQL

### Ajouter un Logo à une École Spécifique
```sql
-- Remplacer 'school-id' par l'ID réel de l'école
-- Remplacer l'URL par l'URL réelle du logo
UPDATE schools 
SET logo = 'https://votre-projet.supabase.co/storage/v1/object/public/school-logos/charles-zackama-logo.png'
WHERE id = 'school-id';
```

### Trouver l'ID d'une École
```sql
SELECT id, name, logo 
FROM schools 
WHERE name ILIKE '%Charles Zackama%';
```

### Ajouter un Logo à Toutes les Écoles d'un Groupe
```sql
UPDATE schools 
SET logo = 'https://votre-projet.supabase.co/storage/v1/object/public/school-logos/default-school-logo.png'
WHERE school_group_id = 'group-id' 
AND logo IS NULL;
```

---

## 📋 Format Recommandé pour les Logos

### Spécifications Techniques
- **Format** : PNG (avec transparence) ou JPG
- **Dimensions** : 256x256px minimum (512x512px recommandé)
- **Ratio** : 1:1 (carré)
- **Poids** : < 500KB
- **Fond** : Transparent (PNG) ou blanc

### Exemples d'URLs Valides
```
✅ https://exemple.supabase.co/storage/v1/object/public/school-logos/ecole-abc.png
✅ https://cdn.example.com/logos/school-logo.jpg
✅ https://example.com/images/logo.svg
```

### URLs Invalides
```
❌ /images/logo.png (chemin relatif)
❌ C:\Users\Desktop\logo.png (chemin local)
❌ logo.png (nom de fichier seulement)
```

---

## 🧪 Vérification

### 1. Vérifier dans la Console
Ouvrir la console du navigateur et chercher :
```
🏫 École: Charles Zackama de sembé | Logo: https://...
```

Si vous voyez :
```
🏫 École: Charles Zackama de sembé | Logo: PAS DE LOGO
```
→ Le logo n'est pas dans la base de données !

### 2. Vérifier dans Supabase
```sql
SELECT name, logo 
FROM schools 
WHERE name = 'Charles Zackama de sembé';
```

Résultat attendu :
```
name                        | logo
---------------------------|----------------------------------
Charles Zackama de sembé   | https://...votre-url.../logo.png
```

---

## 🔍 Debugging

### Problème : Logo ne s'affiche pas

#### Cause 1 : Logo NULL dans la BDD
```sql
-- Vérifier
SELECT name, logo FROM schools WHERE id = 'school-id';

-- Si logo IS NULL, ajouter un logo
UPDATE schools 
SET logo = 'https://votre-url-logo.png'
WHERE id = 'school-id';
```

#### Cause 2 : URL Invalide
```sql
-- Vérifier l'URL
SELECT name, logo FROM schools WHERE id = 'school-id';

-- Tester l'URL dans le navigateur
-- Si erreur 404 → URL incorrecte
```

#### Cause 3 : Permissions Storage
```sql
-- Vérifier que le bucket est PUBLIC
-- Dans Supabase Dashboard → Storage → Policies
-- Créer une policy "Public Access" si nécessaire
```

---

## 📝 Exemple Complet

### Scénario : Ajouter le logo de "Charles Zackama de sembé"

#### 1. Trouver l'ID de l'école
```sql
SELECT id, name, logo 
FROM schools 
WHERE name = 'Charles Zackama de sembé';
```

Résultat :
```
id: abc123-def456-...
name: Charles Zackama de sembé
logo: NULL
```

#### 2. Uploader le logo dans Storage
- Aller dans Storage → `school-logos`
- Uploader `charles-zackama-logo.png`
- URL obtenue : `https://xxx.supabase.co/storage/v1/object/public/school-logos/charles-zackama-logo.png`

#### 3. Mettre à jour la BDD
```sql
UPDATE schools 
SET logo = 'https://xxx.supabase.co/storage/v1/object/public/school-logos/charles-zackama-logo.png'
WHERE id = 'abc123-def456-...';
```

#### 4. Vérifier
```sql
SELECT name, logo 
FROM schools 
WHERE id = 'abc123-def456-...';
```

Résultat :
```
name: Charles Zackama de sembé
logo: https://xxx.supabase.co/storage/v1/object/public/school-logos/charles-zackama-logo.png
```

#### 5. Recharger la page
Le logo devrait maintenant s'afficher ! 🎉

---

## 🎨 Affichage dans l'Interface

### Avec Logo
```
┌──────────────────────────────┐
│ [📷 LOGO]  École ABC         │
│            Actif • 2025      │
└──────────────────────────────┘
```

### Sans Logo
```
┌──────────────────────────────┐
│ [🏫 ICON]  École XYZ         │
│            Actif • 2025      │
└──────────────────────────────┘
```

---

## ✅ Checklist

Avant de dire "le logo ne s'affiche pas" :

- [ ] Le logo est bien uploadé dans Supabase Storage
- [ ] L'URL du logo est publique et accessible
- [ ] Le champ `logo` dans la table `schools` contient l'URL
- [ ] L'URL est complète (avec https://)
- [ ] La page a été rechargée après la modification
- [ ] La console affiche bien l'URL du logo
- [ ] L'URL fonctionne quand on la colle dans le navigateur

---

## 🆘 Support

Si le logo ne s'affiche toujours pas :

1. Ouvrir la console (F12)
2. Chercher le log : `🏫 École: ... | Logo: ...`
3. Copier l'URL du logo
4. Coller l'URL dans le navigateur
5. Si erreur → URL incorrecte
6. Si OK → Problème de code (nous contacter)

---

## 📌 Résumé

**Pour ajouter un logo d'école** :
1. Uploader l'image dans Storage
2. Copier l'URL publique
3. UPDATE schools SET logo = 'URL' WHERE id = 'school-id'
4. Recharger la page

**C'est tout !** 🚀
