# 🚨 CORRECTION URGENTE: Alertes Incorrectes

**Date:** 20 novembre 2025  
**Problème:** Alertes "École sans directeur" affichées (hors scope Super Admin)  
**Cause:** Mauvaises données de test + Triggers incorrects

---

## ❌ PROBLÈME IDENTIFIÉ

### Capture d'écran
Les alertes affichées sont:
- ❌ "École sans directeur" (LA FLEUR)
- ❌ "École sans directeur" (LES ÉTABLISSEMENT KONÉ)
- ❌ "École sans directeur" (Charles Zacksana de sembé)

**Ces alertes ne devraient PAS exister pour le Super Admin !**

---

## 🎯 RAPPEL CONTEXTE

### Super Admin E-Pilot
**Gère:**
- ✅ Groupes Scolaires
- ✅ Plans d'abonnement
- ✅ Modules Pédagogiques
- ✅ Abonnements
- ✅ Paiements globaux

**NE gère PAS:**
- ❌ Écoles individuelles
- ❌ Utilisateurs des écoles
- ❌ Directeurs

### Admin de Groupe
**Gère:**
- ✅ Ses écoles
- ✅ Ses utilisateurs
- ✅ Ses directeurs

---

## 🔧 SOLUTION: 3 Étapes

### Étape 1: Nettoyer les Mauvaises Alertes (2 min)

**Exécuter:**
```bash
psql -f supabase/migrations/20251120_cleanup_wrong_alerts.sql
```

**Ou dans Supabase Studio:**
Copier-coller le contenu de `20251120_cleanup_wrong_alerts.sql`

**Actions:**
- ✅ Supprime alertes "École sans directeur"
- ✅ Supprime alertes "Utilisateur bloqué"
- ✅ Supprime triggers incorrects
- ✅ Vérifie qu'il ne reste aucune alerte école/user

---

### Étape 2: Insérer les Bonnes Alertes (2 min)

**Exécuter:**
```bash
psql -f supabase/migrations/20251120_insert_correct_alerts.sql
```

**Ou dans Supabase Studio:**
Copier-coller le contenu de `20251120_insert_correct_alerts.sql`

**Actions:**
- ✅ Insère alertes abonnements expirés (CRITICAL)
- ✅ Insère alertes paiements échoués (ERROR)
- ✅ Insère alertes expire bientôt (WARNING)
- ✅ Insère alertes système (INFO)
- ✅ Vérifie contexte Super Admin

---

### Étape 3: Créer les Bons Triggers (2 min)

**Exécuter dans l'ordre:**
```bash
# 1. Triggers abonnements
psql -f supabase/migrations/20251120_create_alert_triggers_subscriptions.sql

# 2. Triggers paiements
psql -f supabase/migrations/20251120_create_alert_triggers_payments.sql
```

**Actions:**
- ✅ Crée trigger abonnements expirés
- ✅ Crée trigger groupe sans abonnement
- ✅ Crée trigger paiements échoués
- ❌ PAS de trigger écoles
- ❌ PAS de trigger utilisateurs

---

## 📊 RÉSULTAT ATTENDU

### Avant (Incorrect)
```
Alertes Système (3)
├─ École sans directeur (LA FLEUR) ❌
├─ École sans directeur (LES ÉTABLISSEMENT KONÉ) ❌
└─ École sans directeur (Charles Zacksana) ❌
```

### Après (Correct)
```
Alertes Système (9)
├─ CRITICAL (2)
│  ├─ Abonnement expiré (LAMARELLE) ✅
│  └─ Abonnement expiré (EXCELLENCE) ✅
├─ ERROR (2)
│  ├─ Paiement échoué (SAINT-JOSEPH) ✅
│  └─ Paiement échoué (NOTRE-DAME) ✅
├─ WARNING (3)
│  ├─ Expire bientôt (SAINT-JOSEPH) ✅
│  ├─ Expire bientôt (MARIE-CLAIRE) ✅
│  └─ Groupe sans abonnement (LES PIONEERS) ✅
└─ INFO (2)
   ├─ Maintenance planifiée ✅
   └─ Abonnement renouvelé (NOTRE-DAME) ✅
```

---

## 🧪 VÉRIFICATION

### Test 1: Aucune Alerte École/User
```sql
-- Devrait retourner 0
SELECT COUNT(*) 
FROM system_alerts 
WHERE entity_type IN ('school', 'user') 
  AND resolved_at IS NULL;
```

**Attendu:** `0`

---

### Test 2: Alertes par Type
```sql
SELECT 
  alert_type,
  COUNT(*) as count
FROM system_alerts
WHERE resolved_at IS NULL
GROUP BY alert_type
ORDER BY count DESC;
```

**Attendu:**
```
alert_type    | count
--------------+-------
subscription  | 5
payment       | 2
system        | 2
```

---

### Test 3: Alertes par Sévérité
```sql
SELECT 
  severity,
  COUNT(*) as count
FROM system_alerts
WHERE resolved_at IS NULL
GROUP BY severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END;
```

**Attendu:**
```
severity  | count
----------+-------
critical  | 2
error     | 2
warning   | 3
info      | 2
```

---

### Test 4: Triggers Existants
```sql
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%alert%'
ORDER BY event_object_table, trigger_name;
```

**Attendu:**
```
trigger_name                      | event_object_table
----------------------------------+-------------------
payment_failure_alert             | fee_payments
subscription_expiry_alert         | subscriptions
group_without_subscription_alert  | school_groups
```

**NE DEVRAIT PAS contenir:**
- ❌ `school_without_director_alert`
- ❌ `user_locked_alert`

---

## 📝 FICHIERS CRÉÉS/MODIFIÉS

### Nouveaux Fichiers
1. ✅ `20251120_cleanup_wrong_alerts.sql` - Nettoyage
2. ✅ `20251120_insert_correct_alerts.sql` - Bonnes alertes
3. ✅ `CORRECTION_URGENTE_ALERTES.md` - Ce document

### Fichiers Modifiés
1. ✅ `20251120_insert_test_alerts.sql` - Suppression alertes écoles
2. ✅ `20251120_create_alert_triggers_subscriptions.sql` - Triggers corrects
3. ✅ `20251120_create_alert_triggers_payments.sql` - Triggers corrects

### Fichiers Supprimés
1. ✅ `20251120_create_alert_triggers.sql` - Fichier incorrect (403 lignes)

---

## 🚀 COMMANDES RAPIDES

### Tout Nettoyer et Réinstaller (5 min)
```bash
# 1. Nettoyer
psql -f supabase/migrations/20251120_cleanup_wrong_alerts.sql

# 2. Insérer bonnes alertes
psql -f supabase/migrations/20251120_insert_correct_alerts.sql

# 3. Créer triggers abonnements
psql -f supabase/migrations/20251120_create_alert_triggers_subscriptions.sql

# 4. Créer triggers paiements
psql -f supabase/migrations/20251120_create_alert_triggers_payments.sql
```

---

### Vérification Rapide
```bash
# Compter alertes par type
psql -c "SELECT alert_type, COUNT(*) FROM system_alerts WHERE resolved_at IS NULL GROUP BY alert_type;"

# Vérifier aucune alerte école/user
psql -c "SELECT COUNT(*) FROM system_alerts WHERE entity_type IN ('school', 'user') AND resolved_at IS NULL;"
```

---

## ✅ CHECKLIST

### Nettoyage
- [ ] Script `cleanup_wrong_alerts.sql` exécuté
- [ ] Alertes écoles supprimées
- [ ] Alertes users supprimées
- [ ] Triggers incorrects supprimés

### Réinstallation
- [ ] Script `insert_correct_alerts.sql` exécuté
- [ ] 9 alertes créées (2 critical, 2 error, 3 warning, 2 info)
- [ ] Triggers abonnements créés
- [ ] Triggers paiements créés

### Vérification
- [ ] 0 alerte école/user
- [ ] Toutes alertes = groupes/abonnements/paiements
- [ ] Widget affiche bonnes alertes
- [ ] Navigation fonctionne
- [ ] Boutons d'action visibles

---

## 🎯 RÉSULTAT FINAL

**Après correction, le dashboard devrait afficher:**

```
┌─────────────────────────────────────────────────────────┐
│ 🚨 Alertes Système                              🔄  (9) │
├─────────────────────────────────────────────────────────┤
│ 🔴 Abonnement expiré [expired] [CRITIQUE]      👁️ ❌  │
│ Le groupe LAMARELLE a un abonnement expiré...           │
│ subscription: LAMARELLE  •  il y a 2 heures             │
│ [Renouveler maintenant ↗]                               │
├─────────────────────────────────────────────────────────┤
│ 🔴 Paiement échoué [payment_failed]            👁️ ❌  │
│ Le paiement de 50,000 FCFA pour SAINT-JOSEPH...        │
│ payment: SAINT-JOSEPH  •  il y a 1 heure               │
│ [Réessayer le paiement ↗]                              │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Abonnement expire bientôt [expiring_soon]   👁️ ❌  │
│ Le groupe MARIE-CLAIRE expire dans 3 jours...          │
│ subscription: MARIE-CLAIRE  •  il y a 30 min           │
│ [Renouveler ↗]                                          │
└─────────────────────────────────────────────────────────┘
```

**Aucune alerte "École sans directeur" !** ✅

---

**Voulez-vous que j'exécute ces corrections maintenant ?** 🚀
