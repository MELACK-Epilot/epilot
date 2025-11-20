# 🧪 TESTS: Actions Alertes Système

**Date:** 20 novembre 2025  
**Objectif:** Vérifier que toutes les actions fonctionnent correctement

---

## 🎯 PRÉREQUIS

### 1. Exécuter les Scripts SQL (Dans l'ordre)

**Dans Supabase Studio > SQL Editor:**

#### Script 1: Vérifier la Table
```sql
-- Copier-coller: 20251120_verify_and_fix_alerts_table.sql
```

#### Script 2: Nettoyer les Mauvaises Alertes
```sql
-- Copier-coller: 20251120_cleanup_wrong_alerts.sql
```

#### Script 3: Insérer les Bonnes Alertes
```sql
-- Copier-coller: 20251120_insert_correct_alerts.sql
```

---

## ✅ TEST 1: Cliquer sur une Alerte (Navigation)

### Étapes
1. Ouvrir le dashboard
2. Voir les alertes affichées
3. **Cliquer n'importe où sur une alerte** (pas sur les boutons)
4. Vérifier la navigation

### Résultat Attendu
- ✅ Navigation vers `/dashboard/subscriptions` ou `/dashboard/payments`
- ✅ URL change dans la barre d'adresse
- ✅ Page de destination s'affiche

### Si Ça Ne Marche Pas
**Vérifier dans la console (F12):**
```javascript
// Vérifier que action_url existe
console.log(alert.action_url); // Devrait afficher "/dashboard/subscriptions"
```

**Vérifier dans SQL:**
```sql
SELECT id, title, action_url 
FROM system_alerts 
WHERE resolved_at IS NULL 
LIMIT 5;
```

---

## ✅ TEST 2: Bouton "Renouveler maintenant" (Action Directe)

### Étapes
1. Trouver une alerte avec un bouton d'action
2. **Cliquer sur le bouton** (ex: "Renouveler maintenant")
3. Vérifier la navigation

### Résultat Attendu
- ✅ Navigation vers l'URL spécifiée
- ✅ Pas de propagation du clic (ne navigue pas 2 fois)
- ✅ Page de destination s'affiche

### Si Ça Ne Marche Pas
**Vérifier dans SQL:**
```sql
SELECT 
  id, 
  title, 
  action_required, 
  action_url, 
  action_label 
FROM system_alerts 
WHERE action_required = true 
  AND resolved_at IS NULL;
```

**Devrait retourner:**
```
action_required | action_url              | action_label
true            | /dashboard/subscriptions | Renouveler maintenant
```

---

## ✅ TEST 3: Bouton 👁️ (Marquer comme Lu)

### Étapes
1. Trouver une alerte non lue
2. **Cliquer sur l'icône œil (👁️)**
3. Vérifier le toast
4. Vérifier que l'alerte reste visible

### Résultat Attendu
- ✅ Toast "Alerte marquée comme lue"
- ✅ Alerte reste dans la liste
- ✅ Icône 👁️ disparaît (car alerte maintenant lue)

### Si Ça Ne Marche Pas
**Vérifier dans la console (F12):**
```javascript
// Erreur possible
Error: update on table "system_alerts" violates row-level security policy
```

**Solution: Vérifier RLS:**
```sql
-- Vérifier les policies
SELECT * FROM pg_policies 
WHERE tablename = 'system_alerts';

-- Si aucune policy, créer:
CREATE POLICY "Super Admin peut tout faire"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Vérifier en SQL:**
```sql
-- Avant clic
SELECT id, title, is_read FROM system_alerts WHERE id = 'xxx';

-- Après clic (is_read devrait être true)
SELECT id, title, is_read, read_at FROM system_alerts WHERE id = 'xxx';
```

---

## ✅ TEST 4: Bouton ❌ (Supprimer/Résoudre)

### Étapes
1. Trouver une alerte
2. **Cliquer sur l'icône X (❌)**
3. Vérifier le toast
4. Vérifier que l'alerte disparaît

### Résultat Attendu
- ✅ Toast "Alerte résolue"
- ✅ Alerte disparaît immédiatement de la liste
- ✅ Compteur d'alertes diminue

### Si Ça Ne Marche Pas
**Vérifier en SQL:**
```sql
-- L'alerte devrait avoir resolved_at rempli
SELECT id, title, resolved_at 
FROM system_alerts 
WHERE id = 'xxx';
```

**Vérifier le filtre dans le hook:**
```typescript
// Dans useSystemAlerts.ts
.is('resolved_at', null) // ✅ Correct: exclut les alertes résolues
```

---

## ✅ TEST 5: Pagination (Voir Plus/Moins)

### Étapes
1. Avoir plus de 5 alertes
2. Vérifier que seulement 5 sont affichées
3. **Cliquer sur "Voir X alerte(s) de plus"**
4. Vérifier que toutes les alertes s'affichent
5. **Cliquer sur "Voir moins"**
6. Vérifier retour à 5 alertes

### Résultat Attendu
- ✅ Maximum 5 alertes affichées par défaut
- ✅ Bouton "Voir plus" visible si > 5 alertes
- ✅ Toutes alertes affichées après clic
- ✅ Bouton "Voir moins" visible
- ✅ Retour à 5 alertes après clic

---

## 🔍 DIAGNOSTIC COMPLET

### Vérifier la Structure de la Table
```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'system_alerts'
ORDER BY ordinal_position;
```

**Colonnes Requises:**
- ✅ `id` (uuid)
- ✅ `alert_type` (text)
- ✅ `severity` (text)
- ✅ `category` (text)
- ✅ `title` (text)
- ✅ `message` (text)
- ✅ `entity_type` (text)
- ✅ `action_required` (boolean)
- ✅ `action_url` (text)
- ✅ `action_label` (text)
- ✅ `is_read` (boolean)
- ✅ `read_at` (timestamptz)
- ✅ `resolved_at` (timestamptz)
- ✅ `created_at` (timestamptz)

---

### Vérifier les Données
```sql
SELECT 
  id,
  title,
  action_required,
  action_url,
  action_label,
  is_read,
  resolved_at
FROM system_alerts
WHERE resolved_at IS NULL
ORDER BY created_at DESC;
```

**Exemple de Bonne Alerte:**
```
id                  | abc-123
title               | Abonnement expiré
action_required     | true
action_url          | /dashboard/subscriptions
action_label        | Renouveler maintenant
is_read             | false
resolved_at         | NULL
```

---

### Vérifier les RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'system_alerts';
```

**Si Aucune Policy:**
```sql
-- Créer une policy permissive pour le Super Admin
CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### Vérifier les Logs Frontend (Console F12)

**Logs Attendus:**
```javascript
// Après clic sur 👁️
✅ Alerte marquée comme lue

// Après clic sur ❌
✅ Alerte résolue

// Après clic sur alerte
// (navigation, pas de log spécifique)
```

**Logs d'Erreur Possibles:**
```javascript
❌ Error: update on table "system_alerts" violates row-level security policy
→ Solution: Créer/vérifier RLS policies

❌ Error: relation "system_alerts" does not exist
→ Solution: Créer la table avec le script DDL

❌ Error: column "action_url" does not exist
→ Solution: Exécuter 20251120_verify_and_fix_alerts_table.sql
```

---

## 🚀 SCRIPT DE TEST AUTOMATIQUE

**Copier-coller dans la console (F12):**

```javascript
// Test 1: Vérifier que les alertes ont action_url
const alerts = document.querySelectorAll('[class*="cursor-pointer"]');
console.log(`✅ ${alerts.length} alertes cliquables trouvées`);

// Test 2: Vérifier les boutons d'action
const actionButtons = document.querySelectorAll('button[title*="Renouveler"]');
console.log(`✅ ${actionButtons.length} boutons d'action trouvés`);

// Test 3: Vérifier les boutons "Marquer comme lu"
const readButtons = document.querySelectorAll('button[title="Marquer comme lu"]');
console.log(`✅ ${readButtons.length} boutons "Marquer comme lu" trouvés`);

// Test 4: Vérifier les boutons "Supprimer"
const deleteButtons = document.querySelectorAll('button[title="Résoudre et supprimer"]');
console.log(`✅ ${deleteButtons.length} boutons "Supprimer" trouvés`);

// Test 5: Vérifier pagination
const seeMoreButton = document.querySelector('button:has-text("Voir")');
if (seeMoreButton) {
  console.log('✅ Bouton "Voir plus" trouvé');
} else {
  console.log('ℹ️ Pas de bouton "Voir plus" (< 5 alertes)');
}
```

---

## ✅ CHECKLIST FINALE

### Base de Données
- [ ] Table `system_alerts` existe
- [ ] Toutes les colonnes requises existent
- [ ] RLS policies configurées
- [ ] Alertes de test insérées
- [ ] Aucune alerte "école" ou "user"

### Frontend
- [ ] Widget s'affiche sans erreur
- [ ] Alertes affichées (abonnements, paiements)
- [ ] Boutons visibles (👁️, ❌, actions)
- [ ] Pagination fonctionne (si > 5 alertes)

### Actions
- [ ] Clic sur alerte → Navigation
- [ ] Clic sur bouton action → Navigation
- [ ] Clic sur 👁️ → Marque comme lu
- [ ] Clic sur ❌ → Supprime l'alerte
- [ ] Toasts affichés correctement

---

## 🎯 RÉSULTAT ATTENDU

**Après tous les tests, le widget devrait:**

1. ✅ Afficher 5-7 alertes (abonnements, paiements)
2. ✅ Permettre de cliquer sur une alerte pour naviguer
3. ✅ Afficher des boutons d'action fonctionnels
4. ✅ Permettre de marquer comme lu (👁️)
5. ✅ Permettre de supprimer (❌)
6. ✅ Gérer la pagination (> 5 alertes)

---

**Si un test échoue, consulter la section "Si Ça Ne Marche Pas" correspondante !** 🔧
