# 🔧 GUIDE ÉTAPE PAR ÉTAPE: Tout Faire Fonctionner

**Temps:** 10 minutes  
**On va identifier ET corriger le problème**

---

## 📍 ÉTAPE 1: DIAGNOSTIC (3 min)

### 1.1 Ouvrir Supabase Studio

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **E-Pilot Congo**
3. Cliquez sur **SQL Editor**

---

### 1.2 Exécuter le Diagnostic

**Copiez-collez le fichier:**
```
supabase/migrations/20251120_diagnostic_complet.sql
```

**Cliquez "Run"**

---

### 1.3 Lire le Résultat

Vous allez voir un résumé comme:
```
===========================================
DIAGNOSTIC COMPLET
===========================================
Total alertes: ?
Alertes actives: ?
Avec action_url: ?
RLS activé: ?
Policies RLS: ?
===========================================
```

**NOTEZ LES VALEURS** ⬇️

---

## 🔍 ÉTAPE 2: IDENTIFIER LE PROBLÈME

### Scénario A: "Total alertes: 0"

**Problème:** Aucune alerte dans la base de données

**Solution:** Exécuter le script de création
```
supabase/migrations/20251120_setup_complete_alerts.sql
```

---

### Scénario B: "Avec action_url: 0"

**Problème:** Les alertes n'ont pas d'URL pour la navigation

**Solution:** Exécuter ce script SQL:
```sql
UPDATE system_alerts
SET action_url = CASE
  WHEN alert_type = 'subscription' THEN '/dashboard/subscriptions'
  WHEN alert_type = 'payment' THEN '/dashboard/payments'
  ELSE '/dashboard'
END;
```

---

### Scénario C: "Policies RLS: 0"

**Problème:** Pas de permissions configurées

**Solution:** Exécuter ce script SQL:
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

### Scénario D: "RLS activé: false"

**Problème:** RLS désactivé

**Solution:** Exécuter:
```sql
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
```

---

### Scénario E: Tout est OK en base

**Problème:** Le problème est dans le frontend

**Solution:** Voir ÉTAPE 3

---

## 🔧 ÉTAPE 3: VÉRIFIER LE FRONTEND (2 min)

### 3.1 Ouvrir la Console du Navigateur

1. Appuyez sur **F12**
2. Allez dans l'onglet **Console**
3. Cherchez des erreurs (texte rouge)

---

### 3.2 Erreurs Courantes

#### Erreur: "useNavigate is not defined"

**Solution:** Vérifier les imports dans:
`src/features/dashboard/components/widgets/SystemAlertsWidget.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
```

---

#### Erreur: "Cannot read property 'mutateAsync'"

**Solution:** Vérifier que les hooks sont importés:
```tsx
import { useSystemAlerts, useMarkAlertAsRead, useResolveAlert } from '../../hooks/useSystemAlerts';
```

---

#### Erreur: RLS violation

**Solution:** Exécuter:
```sql
CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### 3.3 Test JavaScript

**Copier-coller dans la console (F12):**
```javascript
// Test 1: Compter les alertes
const alerts = document.querySelectorAll('[class*="border-l-2"]');
console.log(`Alertes affichées: ${alerts.length}`);

// Test 2: Vérifier les boutons
const deleteButtons = document.querySelectorAll('button[title="Résoudre et supprimer"]');
console.log(`Boutons suppression: ${deleteButtons.length}`);

// Test 3: Simuler un clic
if (alerts.length > 0) {
  console.log('Test clic sur première alerte...');
  alerts[0].click();
}
```

**Si aucune erreur et navigation fonctionne:**
→ Le problème était temporaire, rechargez (Ctrl + Shift + R)

**Si erreur:**
→ Notez l'erreur et cherchez la solution ci-dessus

---

## ✅ ÉTAPE 4: SOLUTION COMPLÈTE (5 min)

### Si Vous Avez Identifié le Problème

**Exécutez la solution correspondante ci-dessus**

---

### Si Vous N'êtes Pas Sûr

**Exécutez ce script qui corrige TOUT:**

```sql
-- 1. Supprimer toutes les alertes
DELETE FROM system_alerts;

-- 2. Activer RLS
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer anciennes policies
DROP POLICY IF EXISTS "Super Admin full access" ON system_alerts;

-- 4. Créer policy
CREATE POLICY "Super Admin full access"
ON system_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Insérer alertes de test
INSERT INTO system_alerts (
  alert_type, severity, category, title, message,
  entity_type, action_required, action_url, action_label
)
VALUES
  (
    'subscription', 'critical', 'expired',
    'Abonnement expiré',
    'Le groupe scolaire LAMARELLE a un abonnement expiré depuis 5 jours.',
    'school_group', true,
    '/dashboard/subscriptions',
    'Renouveler maintenant'
  ),
  (
    'payment', 'error', 'payment_failed',
    'Paiement échoué',
    'Le paiement de 50,000 FCFA pour le groupe SAINT-JOSEPH a échoué.',
    'payment', true,
    '/dashboard/payments',
    'Réessayer le paiement'
  ),
  (
    'subscription', 'warning', 'expiring_soon',
    'Abonnement expire bientôt',
    'Le groupe scolaire SAINT-JOSEPH expire dans 5 jours.',
    'school_group', true,
    '/dashboard/subscriptions',
    'Renouveler'
  );

-- 6. Vérifier
SELECT 
  COUNT(*) as total,
  COUNT(action_url) as avec_url
FROM system_alerts;
```

---

## 🔄 ÉTAPE 5: RECHARGER ET TESTER (1 min)

### 5.1 Recharger le Dashboard

**Ctrl + Shift + R** dans le navigateur

---

### 5.2 Tester les Actions

1. **Click sur alerte** → Devrait naviguer
2. **Click sur ❌** → Devrait supprimer
3. **Click sur 👁️** → Devrait marquer comme lu

---

### 5.3 Si Ça Ne Marche TOUJOURS Pas

**Ouvrir la console (F12) et noter l'erreur exacte**

Puis:
- Si erreur RLS → Recréer la policy
- Si erreur navigation → Vérifier les imports
- Si rien ne se passe → Vérifier que les alertes ont action_url

---

## 📊 CHECKLIST DE VÉRIFICATION

### Base de Données
- [ ] Table `system_alerts` existe
- [ ] Au moins 3 alertes dans la table
- [ ] Toutes les alertes ont `action_url`
- [ ] RLS activé
- [ ] Au moins 1 policy RLS

### Frontend
- [ ] Dashboard chargé sans erreur
- [ ] Widget "Alertes Système" visible
- [ ] Alertes affichées (au moins 3)
- [ ] Boutons ❌ et 👁️ visibles
- [ ] Console sans erreur (F12)

### Tests
- [ ] Click sur alerte fonctionne
- [ ] Click sur ❌ fonctionne
- [ ] Click sur 👁️ fonctionne
- [ ] Toasts affichés

---

## 🎯 RÉSUMÉ

1. **Diagnostic** → Identifier le problème
2. **Correction** → Appliquer la solution
3. **Recharger** → Ctrl + Shift + R
4. **Tester** → Vérifier les 3 actions

---

## 📞 SI VOUS ÊTES BLOQUÉ

**Partagez-moi:**
1. Le résultat du diagnostic (Total alertes, Avec action_url, etc.)
2. Les erreurs dans la console (F12)
3. Ce qui se passe quand vous cliquez

**Je vous donnerai la solution exacte !** 🚀
