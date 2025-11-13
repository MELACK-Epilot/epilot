# 🧪 Guide de Test - Page Utilisateurs

## 🎯 Objectif
Tester toutes les fonctionnalités de la page Utilisateurs (Administrateurs de Groupe).

---

## ⚙️ Prérequis

### 1. Base de Données Supabase
Vérifier que les tables sont créées :
```sql
-- Vérifier table users
SELECT * FROM users WHERE role = 'admin_groupe' LIMIT 5;

-- Vérifier table school_groups
SELECT id, name, code FROM school_groups LIMIT 5;
```

### 2. Données de Test
Créer au moins 1 groupe scolaire :
```sql
INSERT INTO school_groups (name, code, region, city, status)
VALUES 
  ('Groupe Test', 'GT-001', 'Brazzaville', 'Brazzaville', 'active'),
  ('Lycées Saint-Pierre', 'LSP-001', 'Pointe-Noire', 'Pointe-Noire', 'active');
```

### 3. Serveur de Développement
```bash
npm run dev
```

---

## 📋 Scénarios de Test

### Test 1 : Accès à la Page ✅

**Étapes** :
1. Ouvrir le navigateur
2. Se connecter au dashboard
3. Cliquer sur "Utilisateurs" dans la sidebar
4. Vérifier l'URL : `/dashboard/users`

**Résultat attendu** :
- ✅ Page s'affiche sans erreur
- ✅ Titre "Utilisateurs" visible
- ✅ Sous-titre "Gestion des Administrateurs de Groupe"
- ✅ Bouton "Ajouter Admin Groupe" visible
- ✅ 4 StatCards affichées (Total, Actifs, Inactifs, Suspendus)
- ✅ Filtres visibles (Recherche, Statut, Groupe)
- ✅ DataTable affichée (vide ou avec données)

---

### Test 2 : Affichage des Statistiques ✅

**Étapes** :
1. Observer les 4 StatCards en haut de la page

**Résultat attendu** :
- ✅ **Total** : Nombre correct d'Admin Groupe
- ✅ **Actifs** : Nombre d'utilisateurs avec `status = 'active'`
- ✅ **Inactifs** : Nombre d'utilisateurs avec `status = 'inactive'`
- ✅ **Suspendus** : Nombre d'utilisateurs avec `status = 'suspended'`
- ✅ Icônes colorées (Bleu, Vert, Gris, Rouge)
- ✅ Valeurs numériques affichées

---

### Test 3 : Création d'un Admin Groupe ✅

**Étapes** :
1. Cliquer sur "Ajouter Admin Groupe"
2. Remplir le formulaire :
   - **Prénom** : Jean
   - **Nom** : Dupont
   - **Email** : jean.dupont@test.cg
   - **Téléphone** : +242 06 123 45 67
   - **Groupe Scolaire** : Sélectionner "Groupe Test"
   - **Mot de passe** : Test1234
   - **Envoyer email** : Coché
3. Cliquer sur "Créer"

**Résultat attendu** :
- ✅ Modal se ferme
- ✅ Toast "Administrateur de Groupe créé avec succès"
- ✅ Nouvel utilisateur apparaît dans la liste
- ✅ Statistiques mises à jour (+1 Total, +1 Actifs)
- ✅ Email de bienvenue envoyé (console.log pour l'instant)

**Validation des erreurs** :
- ❌ Email invalide → Message d'erreur
- ❌ Téléphone invalide → "Numéro de téléphone invalide (format Congo)"
- ❌ Mot de passe faible → "Le mot de passe doit contenir au moins une majuscule"
- ❌ Champs vides → Messages d'erreur appropriés

---

### Test 4 : Recherche d'Utilisateurs ✅

**Étapes** :
1. Taper "Jean" dans le champ de recherche
2. Observer les résultats

**Résultat attendu** :
- ✅ Liste filtrée en temps réel
- ✅ Seuls les utilisateurs avec "Jean" dans prénom, nom ou email
- ✅ Pas de rechargement de page
- ✅ Compteur de résultats mis à jour

**Variations** :
- Recherche par email : "test.cg"
- Recherche par nom : "Dupont"
- Recherche vide : Tous les résultats

---

### Test 5 : Filtres par Statut ✅

**Étapes** :
1. Sélectionner "Actif" dans le filtre Statut
2. Observer les résultats
3. Sélectionner "Inactif"
4. Sélectionner "Tous les statuts"

**Résultat attendu** :
- ✅ **Actif** : Seuls les utilisateurs actifs
- ✅ **Inactif** : Seuls les utilisateurs inactifs
- ✅ **Suspendu** : Seuls les utilisateurs suspendus
- ✅ **Tous** : Tous les utilisateurs
- ✅ Badges colorés correspondants

---

### Test 6 : Filtres par Groupe Scolaire ✅

**Étapes** :
1. Sélectionner "Groupe Test" dans le filtre Groupe
2. Observer les résultats
3. Sélectionner "Tous les groupes"

**Résultat attendu** :
- ✅ Seuls les utilisateurs du groupe sélectionné
- ✅ Colonne "Groupe Scolaire" affiche le bon nom
- ✅ Retour à tous les groupes fonctionne

---

### Test 7 : Modification d'un Utilisateur ✅

**Étapes** :
1. Cliquer sur les 3 points (⋮) d'un utilisateur
2. Sélectionner "Modifier"
3. Modifier les champs :
   - **Prénom** : Jean-Pierre
   - **Téléphone** : +242 06 987 65 43
   - **Statut** : Inactif
4. Cliquer sur "Modifier"

**Résultat attendu** :
- ✅ Modal se ferme
- ✅ Toast "Administrateur de Groupe modifié avec succès"
- ✅ Modifications visibles dans la liste
- ✅ Badge statut mis à jour (Gris pour Inactif)
- ✅ Statistiques mises à jour (-1 Actifs, +1 Inactifs)

**Vérifications** :
- ❌ Email non modifiable (champ désactivé)
- ✅ Autres champs modifiables

---

### Test 8 : Réinitialisation Mot de Passe ✅

**Étapes** :
1. Cliquer sur les 3 points (⋮) d'un utilisateur
2. Sélectionner "Réinitialiser mot de passe"
3. Confirmer dans la popup

**Résultat attendu** :
- ✅ Toast "Email de réinitialisation envoyé"
- ✅ Email envoyé à l'utilisateur (vérifier boîte mail)
- ✅ Lien de réinitialisation fonctionnel

**Note** : Vérifier la configuration Supabase pour les emails.

---

### Test 9 : Désactivation d'un Utilisateur ✅

**Étapes** :
1. Cliquer sur les 3 points (⋮) d'un utilisateur actif
2. Sélectionner "Désactiver" (rouge)
3. Confirmer dans la popup

**Résultat attendu** :
- ✅ Popup de confirmation affichée
- ✅ Toast "Utilisateur désactivé avec succès"
- ✅ Badge statut change à "Inactif" (Gris)
- ✅ Statistiques mises à jour (-1 Actifs, +1 Inactifs)
- ✅ Utilisateur reste dans la liste (soft delete)

---

### Test 10 : Tri des Colonnes ✅

**Étapes** :
1. Cliquer sur l'en-tête "Nom Complet"
2. Observer le tri
3. Cliquer à nouveau (tri inversé)
4. Tester autres colonnes

**Résultat attendu** :
- ✅ Tri ascendant/descendant fonctionne
- ✅ Icône de tri visible
- ✅ Données triées correctement
- ✅ Pas de rechargement de page

---

### Test 11 : Pagination ✅

**Étapes** :
1. Créer plus de 10 utilisateurs (si nécessaire)
2. Observer la pagination en bas du tableau
3. Cliquer sur "Page suivante"
4. Changer le nombre d'éléments par page

**Résultat attendu** :
- ✅ Pagination affichée si > 10 utilisateurs
- ✅ Navigation entre pages fonctionne
- ✅ Compteur "1-10 sur 25" correct
- ✅ Sélecteur "10, 25, 50, 100 par page" fonctionne

---

### Test 12 : Responsive Design 📱

**Étapes** :
1. Ouvrir DevTools (F12)
2. Tester différentes tailles d'écran :
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

**Résultat attendu** :

**Mobile** :
- ✅ StatCards en colonne (1 par ligne)
- ✅ Filtres en colonne
- ✅ Table scrollable horizontalement
- ✅ Bouton "Ajouter" visible
- ✅ Modal plein écran

**Tablet** :
- ✅ StatCards en 2 colonnes
- ✅ Filtres en ligne
- ✅ Table lisible

**Desktop** :
- ✅ StatCards en 4 colonnes
- ✅ Filtres en ligne
- ✅ Table complète visible

---

### Test 13 : États de Chargement ⏳

**Étapes** :
1. Rafraîchir la page (F5)
2. Observer les skeleton loaders
3. Attendre le chargement des données

**Résultat attendu** :
- ✅ Skeleton loaders affichés pendant le chargement
- ✅ Pas de "flash" de contenu vide
- ✅ Transition fluide vers les données réelles
- ✅ Boutons désactivés pendant les actions

---

### Test 14 : Gestion des Erreurs ❌

**Scénarios à tester** :

#### A. Email déjà existant
1. Créer un utilisateur avec email existant
2. **Attendu** : Toast d'erreur "Email déjà utilisé"

#### B. Groupe scolaire inexistant
1. Supprimer un groupe dans Supabase
2. Essayer de créer un utilisateur avec ce groupe
3. **Attendu** : Message d'erreur

#### C. Connexion Supabase perdue
1. Désactiver la connexion réseau
2. Essayer une action
3. **Attendu** : Toast d'erreur "Erreur de connexion"

#### D. Validation formulaire
1. Soumettre formulaire vide
2. **Attendu** : Messages d'erreur sous chaque champ

---

### Test 15 : Performance ⚡

**Métriques à vérifier** :

1. **Temps de chargement initial** :
   - ✅ < 2 secondes

2. **Recherche en temps réel** :
   - ✅ < 300ms de délai

3. **Ouverture modal** :
   - ✅ Instantané (< 100ms)

4. **Soumission formulaire** :
   - ✅ < 1 seconde

5. **Mise à jour liste** :
   - ✅ < 500ms

**Outils** :
- Chrome DevTools > Performance
- React DevTools > Profiler
- Network tab pour les requêtes

---

## 🐛 Bugs Connus à Vérifier

### 1. Email de Bienvenue
- ⚠️ Actuellement simulé (console.log)
- À implémenter : Envoi réel via Supabase Functions

### 2. Logs d'Activité
- ⚠️ Actions non loggées
- À implémenter : Insertion dans `activity_logs`

### 3. Permissions RLS
- ⚠️ Vérifier que seul le Super Admin peut accéder
- Tester avec un compte Admin Groupe (devrait être refusé)

---

## ✅ Checklist Finale

### Fonctionnel
- [ ] Affichage liste
- [ ] Recherche
- [ ] Filtres (statut, groupe)
- [ ] Création utilisateur
- [ ] Modification utilisateur
- [ ] Désactivation utilisateur
- [ ] Réinitialisation mot de passe
- [ ] Statistiques
- [ ] Tri colonnes
- [ ] Pagination

### Validation
- [ ] Email unique
- [ ] Téléphone format Congo
- [ ] Mot de passe fort
- [ ] Messages d'erreur clairs

### UX/UI
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Loading states
- [ ] Toast notifications
- [ ] Confirmations
- [ ] États vides
- [ ] Badges colorés
- [ ] Avatars

### Performance
- [ ] Chargement < 2s
- [ ] Recherche < 300ms
- [ ] Pas de lag
- [ ] Cache React Query

### Sécurité
- [ ] Validation Zod
- [ ] Validation Supabase
- [ ] Soft delete
- [ ] Permissions RLS

---

## 📊 Rapport de Test

### Template
```markdown
## Test effectué le : [DATE]

### Environnement
- Navigateur : Chrome 120
- OS : Windows 11
- Résolution : 1920x1080

### Résultats
| Test | Statut | Commentaire |
|------|--------|-------------|
| Test 1 : Accès | ✅ | OK |
| Test 2 : Stats | ✅ | OK |
| Test 3 : Création | ✅ | OK |
| ... | ... | ... |

### Bugs trouvés
1. [Description du bug]
2. [Description du bug]

### Recommandations
1. [Amélioration suggérée]
2. [Amélioration suggérée]
```

---

## 🚀 Commandes Utiles

### Lancer les tests
```bash
# Dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

### Vérifier Supabase
```bash
# Ouvrir Supabase Studio
# URL : https://csltuxbanvweyfzqpfap.supabase.co

# Vérifier tables
SELECT * FROM users;
SELECT * FROM school_groups;
```

### Logs
```bash
# Console navigateur
F12 > Console

# Network requests
F12 > Network > Filter: Fetch/XHR
```

---

## 📝 Notes

### Données de Test Recommandées
```sql
-- 3 groupes scolaires
INSERT INTO school_groups (name, code, region, city, status) VALUES
  ('Groupe Test A', 'GTA-001', 'Brazzaville', 'Brazzaville', 'active'),
  ('Groupe Test B', 'GTB-002', 'Pointe-Noire', 'Pointe-Noire', 'active'),
  ('Groupe Test C', 'GTC-003', 'Dolisie', 'Dolisie', 'inactive');

-- 5 admin groupe (différents statuts)
-- À créer via l'interface pour tester le formulaire
```

### Scénarios Edge Cases
1. **Utilisateur sans groupe** : Devrait être impossible (champ requis)
2. **Groupe supprimé** : Utilisateur devrait afficher "N/A"
3. **Email très long** : Validation max length
4. **Caractères spéciaux** : Tester dans nom/prénom
5. **Connexion lente** : Tester avec throttling réseau

---

**Guide de test complet pour la page Utilisateurs ! 🧪**
