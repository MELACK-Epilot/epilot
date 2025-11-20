# 🧪 TEST: Click et Suppression des Alertes

**Date:** 20 novembre 2025  
**Objectif:** Vérifier que les clics et suppressions fonctionnent

---

## ✅ PRÉREQUIS

### 1. Script SQL Exécuté
- [ ] `20251120_setup_complete_alerts.sql` exécuté dans Supabase
- [ ] 7 alertes créées
- [ ] Dashboard rechargé (Ctrl + Shift + R)

---

## 🧪 TEST 1: Cliquer sur une Alerte

### Étapes
1. Ouvrir le dashboard
2. Trouver une alerte (ex: "Abonnement expiré")
3. **Cliquer n'importe où sur l'alerte** (fond jaune/rouge)
4. Observer la navigation

### Résultat Attendu
- ✅ URL change vers `/dashboard/subscriptions` ou `/dashboard/payments`
- ✅ Page de destination s'affiche
- ✅ Pas d'erreur dans la console (F12)

### Si Ça Ne Marche Pas

**Vérifier dans la console (F12):**
```javascript
// Ouvrir la console et taper:
console.log('Test navigation');
```

**Vérifier que action_url existe:**
```sql
-- Dans Supabase Studio > SQL Editor
SELECT id, title, action_url 
FROM system_alerts 
WHERE resolved_at IS NULL;
```

**Devrait retourner:**
```
title                    | action_url
-------------------------+---------------------------
Abonnement expiré        | /dashboard/subscriptions
Paiement échoué          | /dashboard/payments
```

**Si action_url est NULL, exécuter:**
```sql
UPDATE system_alerts
SET action_url = '/dashboard/subscriptions'
WHERE alert_type = 'subscription' AND action_url IS NULL;

UPDATE system_alerts
SET action_url = '/dashboard/payments'
WHERE alert_type = 'payment' AND action_url IS NULL;
```

---

## 🧪 TEST 2: Supprimer une Alerte (❌)

### Étapes
1. Trouver une alerte
2. **Cliquer sur l'icône X (❌)** en haut à droite
3. Observer le résultat

### Résultat Attendu
- ✅ Toast "Alerte résolue" apparaît
- ✅ Alerte disparaît immédiatement
- ✅ Compteur d'alertes diminue (ex: 7 → 6)
- ✅ Pas d'erreur dans la console

### Si Ça Ne Marche Pas

**Erreur Possible: RLS (Row Level Security)**

**Symptôme dans la console (F12):**
```
Error: update on table "system_alerts" violates row-level security policy
```

**Solution: Vérifier RLS**
```sql
-- Dans Supabase Studio > SQL Editor

-- 1. Vérifier les policies existantes
SELECT * FROM pg_policies 
WHERE tablename = 'system_alerts';

-- 2. Si aucune policy, créer:
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin full access" ON system_alerts;

CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Vérifier que la suppression fonctionne:**
```sql
-- Avant suppression
SELECT COUNT(*) FROM system_alerts WHERE resolved_at IS NULL;
-- Devrait retourner: 7

-- Après suppression d'une alerte
SELECT COUNT(*) FROM system_alerts WHERE resolved_at IS NULL;
-- Devrait retourner: 6

-- Vérifier l'alerte supprimée
SELECT id, title, resolved_at 
FROM system_alerts 
WHERE resolved_at IS NOT NULL
ORDER BY resolved_at DESC
LIMIT 1;
-- Devrait montrer l'alerte avec resolved_at rempli
```

---

## 🧪 TEST 3: Marquer comme Lu (👁️)

### Étapes
1. Trouver une alerte non lue
2. **Cliquer sur l'icône œil (👁️)**
3. Observer le résultat

### Résultat Attendu
- ✅ Toast "Alerte marquée comme lue"
- ✅ Icône 👁️ disparaît (car alerte maintenant lue)
- ✅ Alerte reste visible dans la liste
- ✅ Pas d'erreur dans la console

### Si Ça Ne Marche Pas

**Vérifier en SQL:**
```sql
-- Avant clic
SELECT id, title, is_read, read_at 
FROM system_alerts 
WHERE resolved_at IS NULL;

-- Après clic sur 👁️
-- is_read devrait passer à true
-- read_at devrait être rempli
```

---

## 🔍 DIAGNOSTIC COMPLET

### Script de Test JavaScript (Console F12)

```javascript
// Copier-coller dans la console du navigateur

console.log('=== TEST ALERTES ===');

// 1. Compter les alertes affichées
const alerts = document.querySelectorAll('[class*="border-l-2"]');
console.log(`✅ ${alerts.length} alertes affichées`);

// 2. Vérifier les alertes cliquables
const clickableAlerts = document.querySelectorAll('[class*="cursor-pointer"]');
console.log(`✅ ${clickableAlerts.length} alertes cliquables`);

// 3. Vérifier les boutons de suppression
const deleteButtons = document.querySelectorAll('button[title="Résoudre et supprimer"]');
console.log(`✅ ${deleteButtons.length} boutons de suppression`);

// 4. Vérifier les boutons "marquer comme lu"
const readButtons = document.querySelectorAll('button[title="Marquer comme lu"]');
console.log(`✅ ${readButtons.length} boutons "marquer comme lu"`);

// 5. Tester le clic sur la première alerte
if (alerts.length > 0) {
  console.log('📍 Pour tester le clic, tapez: alerts[0].click()');
}

// 6. Tester la suppression
if (deleteButtons.length > 0) {
  console.log('📍 Pour tester la suppression, tapez: deleteButtons[0].click()');
}
```

---

## 🔧 SOLUTIONS RAPIDES

### Problème 1: Clic ne fait rien

**Cause:** `action_url` est NULL

**Solution:**
```sql
UPDATE system_alerts
SET action_url = CASE
  WHEN alert_type = 'subscription' THEN '/dashboard/subscriptions'
  WHEN alert_type = 'payment' THEN '/dashboard/payments'
  WHEN alert_type = 'system' THEN '/dashboard'
  ELSE '/dashboard'
END
WHERE action_url IS NULL;
```

---

### Problème 2: Erreur RLS lors de la suppression

**Cause:** Pas de policy RLS

**Solution:**
```sql
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### Problème 3: Boutons invisibles

**Cause:** Alertes pas chargées ou erreur de rendu

**Vérifier:**
1. Ouvrir la console (F12)
2. Chercher des erreurs rouges
3. Vérifier que `useSystemAlerts` retourne des données

**Dans la console:**
```javascript
// Vérifier les données
fetch('/api/system_alerts')
  .then(r => r.json())
  .then(d => console.log('Alertes:', d));
```

---

### Problème 4: Toast ne s'affiche pas

**Cause:** Sonner pas configuré

**Vérifier dans `App.tsx` ou `main.tsx`:**
```tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* ... */}
    </>
  );
}
```

---

## ✅ CHECKLIST DE VÉRIFICATION

### Base de Données
- [ ] Table `system_alerts` existe
- [ ] 7 alertes créées
- [ ] Colonne `action_url` remplie
- [ ] Colonne `resolved_at` NULL pour alertes actives
- [ ] RLS policy créée

### Frontend
- [ ] Widget s'affiche sans erreur
- [ ] Alertes visibles (7 alertes)
- [ ] Boutons ❌ visibles
- [ ] Boutons 👁️ visibles (si alerte non lue)
- [ ] Toaster configuré

### Actions
- [ ] Clic sur alerte → Navigation
- [ ] Clic sur ❌ → Suppression
- [ ] Clic sur 👁️ → Marquer comme lu
- [ ] Toasts affichés

---

## 🎯 TEST FINAL

### Scénario Complet

1. **Ouvrir le dashboard**
2. **Compter les alertes** (devrait être 7)
3. **Cliquer sur "Abonnement expiré"** → Navigation vers `/dashboard/subscriptions`
4. **Revenir au dashboard**
5. **Cliquer sur 👁️** d'une alerte → Toast "Alerte marquée comme lue"
6. **Cliquer sur ❌** d'une alerte → Toast "Alerte résolue" + Alerte disparaît
7. **Vérifier le compteur** (devrait être 6)

### Résultat Attendu
- ✅ Toutes les actions fonctionnent
- ✅ Aucune erreur dans la console
- ✅ Toasts affichés correctement
- ✅ Navigation fluide

---

## 📊 COMMANDES SQL DE VÉRIFICATION

### Vérifier les Alertes Actives
```sql
SELECT 
  id,
  title,
  action_url,
  is_read,
  resolved_at
FROM system_alerts
ORDER BY created_at DESC;
```

### Compter par Statut
```sql
SELECT 
  'Actives' as statut,
  COUNT(*) as count
FROM system_alerts
WHERE resolved_at IS NULL

UNION ALL

SELECT 
  'Résolues',
  COUNT(*)
FROM system_alerts
WHERE resolved_at IS NOT NULL

UNION ALL

SELECT 
  'Lues',
  COUNT(*)
FROM system_alerts
WHERE is_read = true;
```

### Réinitialiser les Tests
```sql
-- Remettre toutes les alertes comme non lues et non résolues
UPDATE system_alerts
SET 
  is_read = false,
  read_at = NULL,
  resolved_at = NULL;
```

---

## 🚀 RÉSULTAT FINAL

**Si tous les tests passent:**
- ✅ Click sur alerte fonctionne
- ✅ Suppression fonctionne
- ✅ Marquer comme lu fonctionne
- ✅ Toasts affichés
- ✅ Pas d'erreur

**Le widget est 100% fonctionnel !** 🎉
