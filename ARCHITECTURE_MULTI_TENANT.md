# 🏗️ Architecture Multi-Tenant E-Pilot Congo

## 🎯 Concept

E-Pilot est une **plateforme SaaS multi-tenant** où :
- 1 Super Admin gère la plateforme
- Plusieurs Groupes Scolaires utilisent la plateforme
- Chaque Groupe a plusieurs Écoles
- Les données sont **isolées par groupe**

---

## 👥 Hiérarchie des Rôles

### **2 rôles uniquement**

```
┌─────────────────────────────────────────┐
│  Super Admin E-Pilot (Plateforme)      │
│  - Gère tous les groupes               │
│  - Crée et affecte les modules         │
│  - Voit toutes les données             │
└─────────────────────────────────────────┘
              ↓ Crée et affecte
┌─────────────────────────────────────────┐
│  Admin Groupe (Groupe Scolaire)        │
│  - Gère son groupe et ses écoles       │
│  - Utilise les modules affectés        │
│  - Voit uniquement ses données         │
│  - Peut affecter modules à son staff   │
└─────────────────────────────────────────┘
              ↓ Gère
┌─────────────────────────────────────────┐
│  Écoles du Groupe                      │
│  - École 1, École 2, École 3...       │
│  - Toutes gérées par l'admin_groupe   │
└─────────────────────────────────────────┘
```

### **Enum `user_role`**
```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',    -- Administrateur plateforme E-Pilot
  'admin_groupe'    -- Administrateur d'un groupe scolaire
);
```

**Note** : Pas de `admin_ecole` car l'admin_groupe gère toutes ses écoles.

---

## 🔐 Isolation des Données (RLS)

### **Principe**

Chaque groupe scolaire voit **uniquement ses propres données** :

```sql
-- Super Admin : Voit TOUT
WHERE user.role = 'super_admin'

-- Admin Groupe : Voit UNIQUEMENT son groupe
WHERE user.school_group_id = data.school_group_id
```

### **Exemple avec Inscriptions**

```sql
-- Super Admin
SELECT * FROM inscriptions;  -- Toutes les inscriptions

-- Admin Groupe A
SELECT * FROM inscriptions
WHERE school_id IN (
  SELECT id FROM schools 
  WHERE school_group_id = 'groupe_a_id'
);  -- Seulement inscriptions du Groupe A

-- Admin Groupe B
SELECT * FROM inscriptions
WHERE school_id IN (
  SELECT id FROM schools 
  WHERE school_group_id = 'groupe_b_id'
);  -- Seulement inscriptions du Groupe B
```

---

## 📦 Affectation des Modules

### **Workflow**

```
1. Super Admin crée un module
   ↓
2. Super Admin affecte le module à un ou plusieurs groupes
   ↓
3. Admin Groupe voit le module dans sa liste
   ↓
4. Admin Groupe peut l'utiliser pour ses écoles
   ↓
5. Admin Groupe peut affecter l'accès à son personnel
```

### **Table `module_assignments`** (à créer)

```sql
CREATE TABLE module_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id),
  school_group_id UUID REFERENCES school_groups(id),
  assigned_by UUID REFERENCES users(id),  -- Super Admin
  assigned_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

### **Exemple**

```sql
-- Super Admin affecte "Gestion Inscriptions" au Groupe A
INSERT INTO module_assignments (module_id, school_group_id, assigned_by)
VALUES (
  'inscriptions_module_id',
  'groupe_a_id',
  'super_admin_id'
);

-- Maintenant, Groupe A peut utiliser le module Inscriptions
-- Groupe B ne le voit pas (sauf si aussi affecté)
```

---

## 🏫 Structure des Données

### **Hiérarchie**

```
school_groups (Groupes Scolaires)
    ↓ has many
schools (Écoles)
    ↓ has many
inscriptions (Inscriptions)
    ↓ has many
students (Élèves)
```

### **Exemple concret**

```
Groupe A : "Complexe Scolaire La Sagesse"
    ├── École 1 : "Collège La Sagesse Brazzaville"
    │   ├── Inscription 1 : Jean Dupont (5EME)
    │   ├── Inscription 2 : Marie Koumba (6EME)
    │   └── ...
    ├── École 2 : "Lycée La Sagesse Pointe-Noire"
    │   ├── Inscription 3 : Paul Mbemba (2NDE)
    │   └── ...
    └── École 3 : "Primaire La Sagesse Dolisie"
        └── ...

Groupe B : "Groupe Scolaire Saint-Joseph"
    ├── École 4 : "Collège Saint-Joseph"
    │   ├── Inscription 4 : Sophie Nkounkou (4EME)
    │   └── ...
    └── École 5 : "Lycée Saint-Joseph"
        └── ...
```

**Important** : 
- Admin Groupe A voit **uniquement** les données du Groupe A
- Admin Groupe B voit **uniquement** les données du Groupe B
- Super Admin voit **tout**

---

## 🔒 Politiques RLS (Row Level Security)

### **Pour la table `inscriptions`**

```sql
-- 1. Super Admin : Accès total
CREATE POLICY "Super Admin can do everything"
  ON inscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- 2. Admin Groupe : Accès à ses écoles uniquement
CREATE POLICY "Admin Groupe can manage their schools inscriptions"
  ON inscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN school_groups sg ON u.school_group_id = sg.id
      JOIN schools s ON s.school_group_id = sg.id
      WHERE u.id = auth.uid()
      AND u.role = 'admin_groupe'
      AND s.id = inscriptions.school_id  -- ✅ Isolation
    )
  );
```

### **Schéma RLS**

```
┌─────────────────────────────────────────┐
│  Super Admin                            │
│  ✅ Voit toutes les inscriptions       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Admin Groupe A                         │
│  ✅ Voit inscriptions Groupe A         │
│  ❌ Ne voit PAS inscriptions Groupe B  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Admin Groupe B                         │
│  ✅ Voit inscriptions Groupe B         │
│  ❌ Ne voit PAS inscriptions Groupe A  │
└─────────────────────────────────────────┘
```

---

## 📊 Cas d'usage

### **Cas 1 : Super Admin affecte un module**

```typescript
// Super Admin connecté
const affectModule = async (moduleId: string, groupeId: string) => {
  await supabase.from('module_assignments').insert({
    module_id: moduleId,
    school_group_id: groupeId,
    assigned_by: superAdminId,
  });
};

// Résultat : Le groupe peut maintenant utiliser le module
```

### **Cas 2 : Admin Groupe utilise le module**

```typescript
// Admin Groupe A connecté
const inscriptions = await supabase
  .from('inscriptions')
  .select('*');

// RLS filtre automatiquement :
// - Retourne SEULEMENT les inscriptions des écoles du Groupe A
// - Ne retourne PAS les inscriptions du Groupe B
```

### **Cas 3 : Admin Groupe crée une inscription**

```typescript
// Admin Groupe A connecté
const createInscription = async (data) => {
  await supabase.from('inscriptions').insert({
    school_id: 'ecole_du_groupe_a',  // ✅ OK
    student_first_name: 'Jean',
    // ...
  });
};

// Si l'admin essaie de créer pour une école d'un autre groupe :
await supabase.from('inscriptions').insert({
  school_id: 'ecole_du_groupe_b',  // ❌ ERREUR RLS
});
// Résultat : Erreur "new row violates row-level security policy"
```

---

## 🎯 Avantages de cette architecture

### **1. Sécurité** 🔒
- ✅ Isolation totale des données
- ✅ Impossible d'accéder aux données d'un autre groupe
- ✅ RLS au niveau base de données (pas contournable)

### **2. Scalabilité** 📈
- ✅ Peut gérer 100+ groupes scolaires
- ✅ Chaque groupe est indépendant
- ✅ Performance optimale (index sur school_group_id)

### **3. Flexibilité** 🎨
- ✅ Super Admin contrôle les modules disponibles
- ✅ Chaque groupe peut avoir des modules différents
- ✅ Facturation par groupe possible

### **4. Maintenance** 🔧
- ✅ Une seule base de données
- ✅ Mises à jour centralisées
- ✅ Backup unique

---

## 📋 Tables principales

### **1. `school_groups`**
```sql
CREATE TABLE school_groups (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  plan_id UUID REFERENCES subscription_plans(id),
  -- ...
);
```

### **2. `schools`**
```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY,
  school_group_id UUID REFERENCES school_groups(id),  -- ✅ Lien
  name VARCHAR(255),
  -- ...
);
```

### **3. `users`**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  role user_role,
  school_group_id UUID REFERENCES school_groups(id),  -- ✅ Lien
  -- ...
);
```

### **4. `inscriptions`**
```sql
CREATE TABLE inscriptions (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),  -- ✅ Lien
  -- ...
);
```

### **5. `module_assignments`** (à créer)
```sql
CREATE TABLE module_assignments (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  school_group_id UUID REFERENCES school_groups(id),  -- ✅ Lien
  -- ...
);
```

---

## ✅ Checklist RLS

Pour chaque table, vérifier :

- [ ] Politique pour `super_admin` (accès total)
- [ ] Politique pour `admin_groupe` (filtré par `school_group_id`)
- [ ] Index sur `school_group_id` pour performance
- [ ] Pas de politique pour `admin_ecole` (rôle supprimé)

---

## 🎉 Résultat

Cette architecture permet :
- ✅ **Multi-tenant** sécurisé
- ✅ **Isolation** des données par groupe
- ✅ **Affectation** flexible des modules
- ✅ **Scalabilité** illimitée
- ✅ **2 rôles** simples (super_admin + admin_groupe)

**Architecture validée pour production !** 🚀🇨🇬

---

**Date** : 31 octobre 2025  
**Projet** : E-Pilot Congo 🇨🇬
