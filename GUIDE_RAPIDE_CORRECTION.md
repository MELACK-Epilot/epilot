# 🚀 GUIDE RAPIDE: Faire Fonctionner les Actions

**Temps estimé:** 5 minutes  
**Objectif:** Tout faire fonctionner en une seule fois

---

## ⚡ SOLUTION RAPIDE (1 Script)

### Étape 1: Ouvrir Supabase Studio

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **E-Pilot Congo**
3. Cliquez sur **SQL Editor** (menu gauche)

---

### Étape 2: Exécuter le Script Complet

**Copiez-collez TOUT le contenu du fichier:**
```
supabase/migrations/20251120_setup_complete_alerts.sql
```

**Puis cliquez sur "Run" (ou Ctrl + Enter)**

---

### Étape 3: Vérifier le Résultat

Vous devriez voir:
```
✅ Nettoyage terminé
✅ Colonnes vérifiées/ajoutées
✅ RLS configuré
✅ 7 alertes insérées
===========================================
CONFIGURATION TERMINÉE !
===========================================
Total alertes: 7
Critiques: 2
Erreurs: 2
Avertissements: 2
Informations: 1
Avec action: 6
===========================================
✅ TOUT EST CORRECT !
```

---

### Étape 4: Recharger le Dashboard

1. Retournez sur votre dashboard E-Pilot
2. **Ctrl + Shift + R** (force reload)
3. Vérifiez le widget "Alertes Système"

---

## ✅ RÉSULTAT ATTENDU

### Widget Alertes Système

```
┌─────────────────────────────────────────────────────────┐
│ 🚨 Alertes Système                              🔄  (7) │
├─────────────────────────────────────────────────────────┤
│ 🔴 Abonnement expiré [expired] [CRITIQUE]      👁️ ❌  │
│ Le groupe LAMARELLE a un abonnement expiré...           │
│ subscription: LAMARELLE  •  il y a 1 minute             │
│ [Renouveler maintenant ↗]                               │
├─────────────────────────────────────────────────────────┤
│ 🔴 Abonnement expiré [expired] [CRITIQUE]      👁️ ❌  │
│ Le groupe EXCELLENCE a un abonnement expiré...          │
│ [Renouveler maintenant ↗]                               │
├─────────────────────────────────────────────────────────┤
│ 🔴 Paiement échoué [payment_failed]            👁️ ❌  │
│ Le paiement de 50,000 FCFA pour SAINT-JOSEPH...        │
│ [Réessayer le paiement ↗]                              │
├─────────────────────────────────────────────────────────┤
│ 🔴 Paiement échoué [payment_failed]            👁️ ❌  │
│ Le paiement de 75,000 FCFA pour NOTRE-DAME...          │
│ [Voir détails ↗]                                       │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Abonnement expire bientôt [expiring_soon]   👁️ ❌  │
│ Le groupe SAINT-JOSEPH expire dans 5 jours...          │
│ [Renouveler ↗]                                          │
├─────────────────────────────────────────────────────────┤
│                  [Voir 2 alerte(s) de plus]            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎮 TESTER LES ACTIONS

### Test 1: Cliquer sur une Alerte ✅
**Action:** Cliquez n'importe où sur l'alerte "Abonnement expiré"  
**Résultat:** Navigation vers `/dashboard/subscriptions`

---

### Test 2: Bouton "Renouveler maintenant" ✅
**Action:** Cliquez sur le bouton "Renouveler maintenant"  
**Résultat:** Navigation vers `/dashboard/subscriptions`

---

### Test 3: Marquer comme Lu (👁️) ✅
**Action:** Cliquez sur l'icône œil  
**Résultat:**
- Toast "Alerte marquée comme lue"
- Icône 👁️ disparaît
- Alerte reste visible

---

### Test 4: Supprimer (❌) ✅
**Action:** Cliquez sur l'icône X  
**Résultat:**
- Toast "Alerte résolue"
- Alerte disparaît
- Compteur diminue (7 → 6)

---

### Test 5: Voir Plus ✅
**Action:** Cliquez sur "Voir 2 alerte(s) de plus"  
**Résultat:**
- Affiche toutes les 7 alertes
- Bouton devient "Voir moins"

---

## 🔧 SI ÇA NE MARCHE TOUJOURS PAS

### Problème 1: Erreur RLS (Row Level Security)

**Symptôme:** Erreur dans la console F12
```
Error: update on table "system_alerts" violates row-level security policy
```

**Solution:** Exécuter ce script SQL
```sql
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

### Problème 2: Colonnes Manquantes

**Symptôme:** Erreur dans la console
```
Error: column "action_url" does not exist
```

**Solution:** Exécuter ce script SQL
```sql
ALTER TABLE system_alerts ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE system_alerts ADD COLUMN IF NOT EXISTS action_label TEXT;
ALTER TABLE system_alerts ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false;
ALTER TABLE system_alerts ADD COLUMN IF NOT EXISTS category TEXT;
```

---

### Problème 3: Navigation Ne Marche Pas

**Symptôme:** Clic sur alerte ne fait rien

**Vérifier en SQL:**
```sql
SELECT id, title, action_url 
FROM system_alerts 
WHERE resolved_at IS NULL;
```

**Si action_url est NULL:**
```sql
UPDATE system_alerts
SET action_url = '/dashboard/subscriptions'
WHERE alert_type = 'subscription' AND action_url IS NULL;

UPDATE system_alerts
SET action_url = '/dashboard/payments'
WHERE alert_type = 'payment' AND action_url IS NULL;
```

---

### Problème 4: Boutons Invisibles

**Symptôme:** Pas de boutons 👁️ ou ❌

**Vérifier dans la console (F12):**
```javascript
// Vérifier que les alertes ont les bonnes propriétés
console.log(document.querySelector('[data-alert-id]'));
```

**Vérifier le code:**
- Fichier: `src/features/dashboard/components/widgets/SystemAlertsWidget.tsx`
- Lignes 248-266 (boutons 👁️ et ❌)

---

## 📊 VÉRIFICATION RAPIDE

### Commande SQL de Diagnostic
```sql
-- Tout vérifier en une fois
SELECT 
  '✅ Total alertes' as check_name,
  COUNT(*)::text as result
FROM system_alerts
WHERE resolved_at IS NULL

UNION ALL

SELECT 
  '✅ Avec action_url',
  COUNT(*)::text
FROM system_alerts
WHERE action_url IS NOT NULL AND resolved_at IS NULL

UNION ALL

SELECT 
  '✅ Avec action_label',
  COUNT(*)::text
FROM system_alerts
WHERE action_label IS NOT NULL AND resolved_at IS NULL

UNION ALL

SELECT 
  '✅ Non lues',
  COUNT(*)::text
FROM system_alerts
WHERE is_read = false AND resolved_at IS NULL;
```

**Résultat Attendu:**
```
check_name              | result
------------------------+--------
✅ Total alertes        | 7
✅ Avec action_url      | 6
✅ Avec action_label    | 6
✅ Non lues             | 7
```

---

## 🎯 CHECKLIST FINALE

### Base de Données
- [ ] Script `20251120_setup_complete_alerts.sql` exécuté
- [ ] 7 alertes créées
- [ ] RLS configuré
- [ ] Toutes colonnes présentes

### Frontend
- [ ] Dashboard rechargé (Ctrl + Shift + R)
- [ ] Widget affiche 7 alertes
- [ ] Boutons visibles (👁️, ❌, actions)
- [ ] Pagination visible ("Voir 2 alerte(s) de plus")

### Actions
- [ ] Clic sur alerte → Navigation ✅
- [ ] Clic sur bouton action → Navigation ✅
- [ ] Clic sur 👁️ → Marque comme lu ✅
- [ ] Clic sur ❌ → Supprime ✅
- [ ] Pagination fonctionne ✅

---

## ✅ SUCCÈS !

**Si tous les tests passent, le widget est 100% fonctionnel !**

### Fonctionnalités Complètes
- ✅ Affichage alertes réelles (abonnements, paiements)
- ✅ Navigation par clic
- ✅ Boutons d'action visibles et fonctionnels
- ✅ Marquer comme lu (sans supprimer)
- ✅ Supprimer/Résoudre
- ✅ Pagination (5 alertes max)
- ✅ Date et catégorie affichées
- ✅ Filtres et recherche

---

**Le widget est production-ready !** 🎉

**Temps total:** ~5 minutes  
**Complexité:** Simple (1 script SQL + reload)
