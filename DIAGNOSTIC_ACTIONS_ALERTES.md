# 🔍 DIAGNOSTIC: Actions Alertes Ne Fonctionnent Pas

**Date:** 20 novembre 2025  
**Problème:** Click et suppression ne fonctionnent pas

---

## 🧪 ÉTAPE 1: Ouvrir la Console (F12)

### Dans le navigateur:
1. Appuyez sur **F12**
2. Allez dans l'onglet **Console**
3. Cherchez des erreurs (texte rouge)

---

## 🔍 ÉTAPE 2: Vérifier les Erreurs Courantes

### Erreur 1: RLS Policy
```
Error: update on table "system_alerts" violates row-level security policy
```

**Solution:**
```sql
-- Dans Supabase Studio > SQL Editor
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin full access" ON system_alerts;

CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### Erreur 2: action_url NULL
```
TypeError: Cannot read property 'action_url' of undefined
```

**Solution:**
```sql
-- Dans Supabase Studio > SQL Editor
UPDATE system_alerts
SET action_url = CASE
  WHEN alert_type = 'subscription' THEN '/dashboard/subscriptions'
  WHEN alert_type = 'payment' THEN '/dashboard/payments'
  ELSE '/dashboard'
END
WHERE action_url IS NULL;
```

---

### Erreur 3: Hook Non Importé
```
Error: useNavigate is not defined
```

**Vérifier dans le fichier:**
`src/features/dashboard/components/widgets/SystemAlertsWidget.tsx`

```tsx
import { useNavigate } from 'react-router-dom'; // ✅ Doit être présent
```

---

## 🧪 ÉTAPE 3: Test JavaScript dans la Console

### Copier-coller dans la console (F12):

```javascript
// Test 1: Vérifier que les alertes sont chargées
console.log('=== DIAGNOSTIC ALERTES ===');

// Compter les alertes
const alerts = document.querySelectorAll('[class*="border-l-2"]');
console.log(`Alertes affichées: ${alerts.length}`);

// Test 2: Vérifier les boutons de suppression
const deleteButtons = document.querySelectorAll('button[title="Résoudre et supprimer"]');
console.log(`Boutons suppression: ${deleteButtons.length}`);

// Test 3: Simuler un clic sur la première alerte
if (alerts.length > 0) {
  console.log('Test: Clic sur première alerte...');
  alerts[0].click();
  console.log('✅ Clic exécuté (vérifier si navigation)');
}

// Test 4: Vérifier si React Query est chargé
if (window.__REACT_QUERY_DEVTOOLS__) {
  console.log('✅ React Query chargé');
} else {
  console.log('⚠️ React Query non détecté');
}
```

---

## 🔍 ÉTAPE 4: Vérifier les Données en Base

### Dans Supabase Studio > SQL Editor:

```sql
-- Vérifier que les alertes ont action_url
SELECT 
  id,
  title,
  action_url,
  is_read,
  resolved_at
FROM system_alerts
WHERE resolved_at IS NULL
ORDER BY created_at DESC;
```

**Résultat Attendu:**
```
title                    | action_url
-------------------------+---------------------------
Abonnement expiré        | /dashboard/subscriptions  ✅
Paiement échoué          | /dashboard/payments       ✅
```

**Si action_url est NULL:**
```sql
UPDATE system_alerts
SET action_url = '/dashboard/subscriptions'
WHERE alert_type = 'subscription';

UPDATE system_alerts
SET action_url = '/dashboard/payments'
WHERE alert_type = 'payment';
```

---

## 🔍 ÉTAPE 5: Vérifier les Permissions RLS

```sql
-- Vérifier les policies
SELECT 
  policyname,
  cmd,
  qual::text,
  with_check::text
FROM pg_policies
WHERE tablename = 'system_alerts';
```

**Résultat Attendu:**
```
policyname              | cmd  | qual | with_check
------------------------+------+------+------------
Super Admin full access | ALL  | true | true
```

**Si aucune policy:**
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

## 🔍 ÉTAPE 6: Tester Manuellement en SQL

### Test Suppression:
```sql
-- Tester la suppression d'une alerte
UPDATE system_alerts
SET resolved_at = NOW()
WHERE id = (
  SELECT id 
  FROM system_alerts 
  WHERE resolved_at IS NULL 
  LIMIT 1
);

-- Vérifier
SELECT COUNT(*) FROM system_alerts WHERE resolved_at IS NULL;
```

**Si ça marche en SQL mais pas dans l'app:**
→ Problème de permissions RLS ou frontend

---

### Test Marquer comme Lu:
```sql
-- Tester marquer comme lu
UPDATE system_alerts
SET is_read = true, read_at = NOW()
WHERE id = (
  SELECT id 
  FROM system_alerts 
  WHERE is_read = false 
  LIMIT 1
);

-- Vérifier
SELECT id, title, is_read FROM system_alerts WHERE is_read = true;
```

---

## 🔧 SOLUTIONS RAPIDES

### Solution 1: Tout Réinitialiser

```sql
-- Dans Supabase Studio > SQL Editor

-- 1. Réinitialiser les alertes
UPDATE system_alerts
SET 
  is_read = false,
  read_at = NULL,
  resolved_at = NULL;

-- 2. Corriger action_url
UPDATE system_alerts
SET action_url = CASE
  WHEN alert_type = 'subscription' THEN '/dashboard/subscriptions'
  WHEN alert_type = 'payment' THEN '/dashboard/payments'
  ELSE '/dashboard'
END;

-- 3. Vérifier RLS
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin full access" ON system_alerts;

CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Vérifier
SELECT 
  COUNT(*) as total,
  COUNT(action_url) as avec_url,
  COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as actives
FROM system_alerts;
```

---

### Solution 2: Vérifier le Code Frontend

**Fichier:** `src/features/dashboard/components/widgets/SystemAlertsWidget.tsx`

**Vérifier que ces imports existent:**
```tsx
import { useNavigate } from 'react-router-dom';
import { useSystemAlerts, useMarkAlertAsRead, useResolveAlert } from '../../hooks/useSystemAlerts';
import { toast } from 'sonner';
```

**Vérifier que ces handlers existent:**
```tsx
const handleAlertClick = (alert: any) => {
  if (alert.action_url) {
    navigate(alert.action_url);
  }
};

const handleMarkAsHandled = async (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  try {
    await resolveAlert.mutateAsync(id);
    toast.success('Alerte résolue');
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de la résolution');
  }
};
```

---

## 📊 CHECKLIST DE DIAGNOSTIC

### Base de Données
- [ ] Alertes existent (`SELECT COUNT(*) FROM system_alerts`)
- [ ] action_url rempli (`SELECT COUNT(*) FROM system_alerts WHERE action_url IS NOT NULL`)
- [ ] RLS activé (`SELECT * FROM pg_policies WHERE tablename = 'system_alerts'`)
- [ ] Test manuel fonctionne (UPDATE en SQL)

### Frontend
- [ ] Console sans erreur (F12)
- [ ] Imports corrects (useNavigate, hooks)
- [ ] Handlers définis (handleAlertClick, handleMarkAsHandled)
- [ ] Toaster configuré (sonner)

### Tests
- [ ] Click sur alerte → Vérifier console pour erreurs
- [ ] Click sur ❌ → Vérifier console pour erreurs
- [ ] Click sur 👁️ → Vérifier console pour erreurs

---

## 🎯 PROCHAINES ÉTAPES

1. **Ouvrir la console (F12)**
2. **Copier-coller le script de test JavaScript**
3. **Noter les erreurs affichées**
4. **Exécuter les solutions SQL correspondantes**
5. **Recharger (Ctrl + Shift + R)**
6. **Retester**

---

**Commencez par la console (F12) et notez les erreurs !** 🔍
