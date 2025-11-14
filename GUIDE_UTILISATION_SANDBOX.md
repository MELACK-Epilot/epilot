# 📖 GUIDE D'UTILISATION - ENVIRONNEMENT SANDBOX

## 🎯 **POUR QUI ?**

Ce guide est destiné au **Super Admin E-Pilot** pour développer et tester les modules avant déploiement en production.

---

## 🚀 **DÉMARRAGE RAPIDE**

### **1. Installer les Dépendances**

```bash
# Installer faker et tsx
npm install --save-dev @faker-js/faker tsx
```

### **2. Exécuter la Migration SQL**

```bash
# 1. Aller sur https://app.supabase.com
# 2. Sélectionner votre projet E-Pilot
# 3. Aller dans SQL Editor
# 4. Copier le contenu de: supabase/migrations/20250114_sandbox_environment.sql
# 5. Cliquer sur "Run"
```

### **3. Générer les Données Sandbox**

```bash
npm run generate:sandbox
```

**Résultat attendu** :
```
🧪 ========================================
🧪 GÉNÉRATION DES DONNÉES SANDBOX
🧪 ========================================

📦 Étape 1/8: Création des groupes scolaires...
✅ 5 groupes créés

🏫 Étape 2/8: Création des écoles...
✅ 20 écoles créées

👥 Étape 3/8: Création des utilisateurs...
✅ 500+ utilisateurs créés

👨‍🎓 Étape 4/8: Création des élèves...
✅ 6500+ élèves créés

📚 Étape 5/8: Création des classes...
✅ 200+ classes créées

🔗 Étape 6/8: Assignation des élèves aux classes...
✅ Élèves assignés

📝 Étape 7/8: Création des inscriptions...
✅ 6500+ inscriptions créées

📊 Étape 8/8: Création des notes...
✅ Notes créées

🎉 ========================================
🎉 GÉNÉRATION TERMINÉE AVEC SUCCÈS !
🎉 ========================================
📊 Statistiques:
   - Groupes scolaires: 5
   - Écoles: 20
   - Utilisateurs: 500+
   - Élèves: 6500+
   - Classes: 200+
   - Inscriptions: 6500+
🎉 ========================================
```

### **4. Accéder à l'Interface**

```bash
# 1. Se connecter comme Super Admin
# 2. Aller sur /dashboard/sandbox
# 3. Vérifier les statistiques
```

---

## 📊 **DONNÉES GÉNÉRÉES**

### **Vue d'Ensemble**

| Entité | Quantité | Description |
|--------|----------|-------------|
| **Groupes Scolaires** | 5 | Différentes tailles (grand, moyen, petit, international, rural) |
| **Écoles** | 20 | Primaire, Collège, Lycée, Maternelle |
| **Utilisateurs** | 500+ | Proviseurs, Enseignants, Secrétaires, CPE |
| **Élèves** | 6,500+ | Tous les niveaux (Maternelle → Terminale) |
| **Classes** | 200+ | 2-5 classes par niveau |
| **Inscriptions** | 6,500+ | Statuts: Validée, En attente, Refusée |
| **Notes** | 50,000+ | 3 trimestres × toutes matières |

---

## 🏫 **DÉTAIL DES GROUPES SCOLAIRES**

### **1. Excellence Education Network** 🏆

**Type** : Grand réseau urbain  
**Écoles** : 5  
**Élèves** : 2,500  
**Budget** : 5M€  

**Écoles** :
- ✅ Lycée d'Excellence Moderne (600 élèves, 45 enseignants)
- ✅ Collège Excellence Centre (800 élèves, 50 enseignants)
- ✅ École Primaire Excellence Nord (450 élèves, 20 enseignants)
- ✅ Lycée Technique Excellence (400 élèves, 35 enseignants)
- ✅ Collège Excellence Sud (250 élèves, 20 enseignants)

**Cas d'usage** :
- Tester la scalabilité avec beaucoup de données
- Valider les performances avec 2500+ élèves
- Simuler un grand réseau urbain

---

### **2. Avenir Éducation** 📚

**Type** : Réseau régional  
**Écoles** : 4  
**Élèves** : 1,200  
**Budget** : 2M€  

**Écoles** :
- ✅ Lycée Avenir (360 élèves, 28 enseignants)
- ✅ Collège Avenir (480 élèves, 30 enseignants)
- ✅ École Primaire Avenir (300 élèves, 15 enseignants)
- ✅ Collège Technique Avenir (120 élèves, 10 enseignants)

**Cas d'usage** :
- Tester un réseau de taille moyenne
- Valider l'UX avec des données équilibrées
- Simuler un réseau régional

---

### **3. Savoir Plus** 🎓

**Type** : Petit réseau local  
**Écoles** : 3  
**Élèves** : 600  
**Budget** : 800K€  

**Écoles** :
- ✅ Lycée Savoir (240 élèves, 18 enseignants)
- ✅ Collège Savoir (320 élèves, 20 enseignants)
- ✅ École Primaire Savoir (150 élèves, 8 enseignants)

**Cas d'usage** :
- Tester avec peu de données
- Valider l'UI avec des listes courtes
- Simuler un petit réseau local

---

### **4. Horizon Académie** 🌍

**Type** : Réseau international bilingue  
**Écoles** : 5  
**Élèves** : 1,800  
**Budget** : 4M€  

**Écoles** :
- ✅ Lycée International Horizon (480 élèves, 40 enseignants)
- ✅ Collège Horizon Bilingue (640 élèves, 42 enseignants)
- ✅ École Primaire Horizon (360 élèves, 18 enseignants)
- ✅ Lycée Technique Horizon (240 élèves, 22 enseignants)
- ✅ École Maternelle Horizon (180 élèves, 12 enseignants)

**Cas d'usage** :
- Tester un réseau international
- Valider les programmes bilingues
- Simuler une école maternelle

---

### **5. Étoile du Savoir** 🌟

**Type** : Réseau rural  
**Écoles** : 3  
**Élèves** : 400  
**Budget** : 500K€  

**Écoles** :
- ✅ Lycée Étoile (160 élèves, 12 enseignants)
- ✅ Collège Étoile (180 élèves, 14 enseignants)
- ✅ École Primaire Étoile (120 élèves, 6 enseignants)

**Cas d'usage** :
- Tester un réseau rural
- Valider avec des ressources limitées
- Simuler des petites structures

---

## 🛠️ **UTILISATION PRATIQUE**

### **Scénario 1 : Développer un Nouveau Module**

```bash
# 1. Générer les données sandbox
npm run generate:sandbox

# 2. Se connecter comme Super Admin
# Email: admin@e-pilot.cg
# Password: [votre mot de passe]

# 3. Développer le module
# - Créer les composants
# - Tester avec les données sandbox
# - Valider l'UX

# 4. Tester dans différents contextes
# - Grand réseau (Excellence Education)
# - Petit réseau (Savoir Plus)
# - Réseau international (Horizon Académie)

# 5. Valider et déployer
# - Corriger les bugs
# - Optimiser les performances
# - Déployer en production

# 6. Nettoyer (optionnel)
# Dashboard > Sandbox > Supprimer les Données
```

---

### **Scénario 2 : Tester la Scalabilité**

```bash
# 1. Générer les données
npm run generate:sandbox

# 2. Se connecter au groupe "Excellence Education Network"
# - 2500 élèves
# - 5 écoles
# - 170 enseignants

# 3. Tester les modules
# - Gestion des Inscriptions (6500+ inscriptions)
# - Gestion des Classes (200+ classes)
# - Gestion des Notes (50,000+ notes)

# 4. Mesurer les performances
# - Temps de chargement
# - Temps de recherche
# - Temps de filtrage

# 5. Optimiser si nécessaire
# - Ajouter des index
# - Optimiser les requêtes
# - Ajouter de la pagination
```

---

### **Scénario 3 : Former un Client**

```bash
# 1. Générer les données sandbox
npm run generate:sandbox

# 2. Préparer la démo
# - Choisir un groupe (ex: Avenir Éducation)
# - Préparer les scénarios
# - Tester le parcours

# 3. Faire la démo
# - Montrer les fonctionnalités
# - Expliquer les workflows
# - Répondre aux questions

# 4. Laisser le client tester
# - Données réalistes
# - Pas de risque
# - Environnement isolé

# 5. Nettoyer après la démo
# Dashboard > Sandbox > Supprimer les Données
```

---

## 🔍 **VÉRIFICATIONS**

### **Vérifier les Données Générées**

```sql
-- Compter les données sandbox
SELECT * FROM count_sandbox_data();
```

**Résultat attendu** :
```
| entity_type    | count |
|----------------|-------|
| school_groups  | 5     |
| schools        | 20    |
| users          | 500+  |
| students       | 6500+ |
| classes        | 200+  |
| inscriptions   | 6500+ |
```

### **Vérifier l'Isolation**

```sql
-- Vérifier que les données sont bien marquées sandbox
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_sandbox = TRUE THEN 1 ELSE 0 END) as sandbox_count
FROM school_groups;
```

**Résultat attendu** :
```
| total | sandbox_count |
|-------|---------------|
| 5     | 5             |
```

### **Vérifier les Permissions**

```sql
-- Vérifier les policies RLS
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE policyname LIKE '%sandbox%';
```

**Résultat attendu** :
```
| schemaname | tablename     | policyname                              |
|------------|---------------|-----------------------------------------|
| public     | school_groups | Super admin can access sandbox school groups |
| public     | schools       | Super admin can access sandbox schools  |
| public     | users         | Super admin can access sandbox users    |
```

---

## 🧹 **NETTOYAGE**

### **Méthode 1 : Via l'Interface**

```bash
# 1. Se connecter comme Super Admin
# 2. Aller sur /dashboard/sandbox
# 3. Cliquer sur "Supprimer les Données Sandbox"
# 4. Confirmer la suppression
```

### **Méthode 2 : Via SQL**

```sql
-- Supprimer toutes les données sandbox
SELECT delete_sandbox_data();
```

### **Méthode 3 : Via Script**

```bash
# Créer un script de nettoyage
npm run clean:sandbox
```

---

## ⚠️ **BONNES PRATIQUES**

### **✅ À FAIRE**

- ✅ Générer les données sandbox avant de développer
- ✅ Tester avec différents groupes (grand, moyen, petit)
- ✅ Vérifier les performances avec beaucoup de données
- ✅ Valider l'UX avec des données réalistes
- ✅ Nettoyer après les tests
- ✅ Utiliser pour les démos clients
- ✅ Former les nouveaux développeurs

### **❌ À NE PAS FAIRE**

- ❌ Ne pas mélanger sandbox et production
- ❌ Ne pas supprimer les données sandbox en production
- ❌ Ne pas partager les accès sandbox avec les clients
- ❌ Ne pas oublier de nettoyer après les tests
- ❌ Ne pas utiliser pour des données réelles
- ❌ Ne pas désactiver l'isolation RLS

---

## 🎯 **EXEMPLES D'UTILISATION**

### **Exemple 1 : Tester le Module Inscriptions**

```typescript
// 1. Générer les données
npm run generate:sandbox

// 2. Se connecter au groupe "Excellence Education Network"
// 3. Aller sur le module "Gestion des Inscriptions"
// 4. Vérifier les données:
//    - 2500 inscriptions (Excellence Education)
//    - Statuts variés (85% validées, 8% en attente, etc.)
//    - Tous les niveaux (Seconde → Terminale)

// 5. Tester les fonctionnalités:
//    - Recherche par nom
//    - Filtrage par statut
//    - Filtrage par niveau
//    - Tri par date
//    - Pagination

// 6. Valider les performances:
//    - Temps de chargement < 1s
//    - Recherche instantanée
//    - Filtres réactifs
```

### **Exemple 2 : Tester le Module Classes**

```typescript
// 1. Se connecter au groupe "Horizon Académie"
// 2. Aller sur le module "Gestion des Classes"
// 3. Vérifier les données:
//    - 50+ classes (5 écoles)
//    - Effectifs variés (20-40 élèves)
//    - Enseignants assignés

// 4. Tester les fonctionnalités:
//    - Créer une nouvelle classe
//    - Assigner des élèves
//    - Modifier l'enseignant principal
//    - Voir l'emploi du temps

// 5. Valider l'UX:
//    - Navigation fluide
//    - Formulaires intuitifs
//    - Messages clairs
```

### **Exemple 3 : Tester le Module Notes**

```typescript
// 1. Se connecter au groupe "Savoir Plus"
// 2. Aller sur le module "Gestion des Notes"
// 3. Vérifier les données:
//    - 600 élèves
//    - 3 trimestres
//    - Toutes les matières

// 4. Tester les fonctionnalités:
//    - Saisir des notes
//    - Calculer les moyennes
//    - Générer des bulletins
//    - Exporter en PDF

// 5. Valider les calculs:
//    - Moyennes correctes
//    - Coefficients appliqués
//    - Classements justes
```

---

## 📈 **STATISTIQUES ET MONITORING**

### **Dashboard Sandbox**

```typescript
// Accéder aux statistiques en temps réel
/dashboard/sandbox

// Affiche:
- Nombre de groupes scolaires
- Nombre d'écoles
- Nombre d'utilisateurs
- Nombre d'élèves
- Nombre de classes
- Nombre d'inscriptions
```

### **Requêtes SQL Utiles**

```sql
-- Statistiques par groupe
SELECT 
  sg.name,
  COUNT(DISTINCT s.id) as schools,
  COUNT(DISTINCT u.id) as users,
  COUNT(DISTINCT st.id) as students
FROM school_groups sg
LEFT JOIN schools s ON s.school_group_id = sg.id
LEFT JOIN users u ON u.school_group_id = sg.id
LEFT JOIN students st ON st.school_group_id = sg.id
WHERE sg.is_sandbox = TRUE
GROUP BY sg.id, sg.name;

-- Inscriptions par statut
SELECT 
  status,
  COUNT(*) as count
FROM inscriptions
WHERE is_sandbox = TRUE
GROUP BY status;

-- Classes par niveau
SELECT 
  level,
  COUNT(*) as count,
  AVG(max_students) as avg_capacity
FROM classes
WHERE is_sandbox = TRUE
GROUP BY level;
```

---

## 🎉 **CONCLUSION**

L'environnement sandbox vous permet de :

✅ **Développer** en toute sécurité  
✅ **Tester** avec des données réalistes  
✅ **Valider** la scalabilité  
✅ **Former** les clients  
✅ **Démontrer** les fonctionnalités  

**UTILISEZ-LE SYSTÉMATIQUEMENT AVANT CHAQUE DÉPLOIEMENT ! 🏆🧪✨**
