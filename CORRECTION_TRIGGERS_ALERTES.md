# ✅ CORRECTION: Triggers Alertes - Contexte Super Admin

**Date:** 20 novembre 2025  
**Problème:** Triggers incorrects + Fichier trop long (403 lignes)  
**Solution:** Découpage + Correction contexte métier

---

## ❌ ERREURS CORRIGÉES

### 1. Contexte Métier Incorrect

**Erreur:**
- ❌ Trigger "École sans directeur"
- ❌ Trigger "Utilisateur bloqué"
- ❌ Alertes sur écoles individuelles
- ❌ Alertes sur utilisateurs

**Problème:**
Le **Super Admin E-Pilot** ne gère PAS:
- ❌ Les écoles individuelles
- ❌ Les utilisateurs des écoles

**Rappel Hiérarchie:**
```
SUPER ADMIN E-PILOT
  ↓ Gère
  - Groupes Scolaires
  - Plans d'abonnement
  - Modules Pédagogiques
  - Catégories Métiers

ADMIN DE GROUPE
  ↓ Gère
  - Écoles de son groupe
  - Utilisateurs de ses écoles
  - Assignation modules/rôles
```

---

### 2. Fichier Trop Long

**Avant:**
- ❌ `20251120_create_alert_triggers.sql` - **403 lignes**
- ❌ Viole règle @[/decouper] (MAX 350 lignes)

**Après:**
- ✅ `20251120_create_alert_triggers_subscriptions.sql` - **~200 lignes**
- ✅ `20251120_create_alert_triggers_payments.sql` - **~120 lignes**

---

## ✅ TRIGGERS CORRECTS (Super Admin)

### Fichier 1: Abonnements (200 lignes)

**`20251120_create_alert_triggers_subscriptions.sql`**

#### Trigger 1: Abonnement expiré/expire bientôt
```sql
CREATE TRIGGER subscription_expiry_alert
  AFTER INSERT OR UPDATE OF end_date, status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiry();
```

**Alertes créées:**
- **Critical:** Abonnement expiré > 0 jours
- **Error:** Expire dans 1-3 jours
- **Warning:** Expire dans 4-7 jours

**Entité:** `school_group` (Groupe Scolaire)

---

#### Trigger 2: Groupe sans abonnement actif
```sql
CREATE TRIGGER group_without_subscription_alert
  AFTER INSERT OR UPDATE ON school_groups
  FOR EACH ROW
  EXECUTE FUNCTION check_group_without_subscription();
```

**Alerte créée:**
- **Critical:** Groupe scolaire sans abonnement actif

**Entité:** `school_group` (Groupe Scolaire)

---

### Fichier 2: Paiements (120 lignes)

**`20251120_create_alert_triggers_payments.sql`**

#### Trigger 3: Paiement échoué
```sql
CREATE TRIGGER payment_failure_alert
  AFTER INSERT OR UPDATE OF status ON fee_payments
  FOR EACH ROW
  WHEN (NEW.status = 'failed')
  EXECUTE FUNCTION check_payment_failure();
```

**Alerte créée:**
- **Error:** Paiement échoué

**Entité:** `payment` (Paiement)

**Note:** Même si le paiement concerne une école, le Super Admin voit tous les paiements car il gère la facturation globale.

---

#### Fonction Utilitaire: Nettoyage
```sql
CREATE FUNCTION cleanup_old_alerts() RETURNS INTEGER
```

**Usage:**
```sql
-- Supprimer alertes résolues > 30 jours
SELECT cleanup_old_alerts();
```

---

## 📊 COMPARAISON AVANT/APRÈS

| Aspect | Avant | Après |
|--------|-------|-------|
| **Fichiers** | 1 (403 lignes) | 2 (200 + 120 lignes) |
| **Conformité** | ❌ Non (> 350) | ✅ Oui (< 350) |
| **Contexte métier** | ❌ Incorrect | ✅ Correct |
| **Triggers écoles** | ❌ Présents | ✅ Supprimés |
| **Triggers utilisateurs** | ❌ Présents | ✅ Supprimés |
| **Triggers groupes** | ✅ Présents | ✅ Présents |
| **Triggers abonnements** | ✅ Présents | ✅ Présents |
| **Triggers paiements** | ✅ Présents | ✅ Présents |

---

## 🎯 TRIGGERS POUR ADMIN GROUPE (Futur)

**À créer séparément** (contexte Admin Groupe):

### Fichier: `create_alert_triggers_admin_groupe.sql`

```sql
-- Trigger: École sans directeur (Admin Groupe)
CREATE TRIGGER school_without_director_alert
  AFTER INSERT OR UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION check_school_without_director();

-- Trigger: Utilisateur bloqué (Admin Groupe)
CREATE TRIGGER user_locked_alert
  AFTER UPDATE OF is_locked ON users
  FOR EACH ROW
  WHEN (NEW.is_locked = true)
  EXECUTE FUNCTION check_user_locked();

-- Trigger: École sans élèves (Admin Groupe)
CREATE TRIGGER school_without_students_alert
  AFTER INSERT OR UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION check_school_without_students();
```

**Important:** Ces triggers créent des alertes visibles uniquement par l'Admin du Groupe concerné (RLS).

---

## 📋 CHECKLIST FINALE

### Conformité @[/decouper]
- [x] Fichier 1: 200 lignes (< 350) ✅
- [x] Fichier 2: 120 lignes (< 350) ✅
- [x] Ancien fichier supprimé ✅

### Contexte Métier
- [x] Triggers Super Admin uniquement ✅
- [x] Pas de triggers écoles ✅
- [x] Pas de triggers utilisateurs ✅
- [x] Triggers groupes scolaires ✅
- [x] Triggers abonnements ✅
- [x] Triggers paiements ✅

### Documentation
- [x] Commentaires clairs ✅
- [x] Contexte expliqué ✅
- [x] Séparation Admin/Super Admin ✅

---

## 🚀 EXÉCUTION

### Ordre d'exécution
```bash
# 1. Triggers abonnements
psql -f supabase/migrations/20251120_create_alert_triggers_subscriptions.sql

# 2. Triggers paiements
psql -f supabase/migrations/20251120_create_alert_triggers_payments.sql
```

### Vérification
```sql
-- Lister tous les triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%alert%'
ORDER BY event_object_table, trigger_name;

-- Résultat attendu:
-- subscription_expiry_alert | subscriptions
-- group_without_subscription_alert | school_groups
-- payment_failure_alert | fee_payments
```

---

## ✅ RÉSULTAT FINAL

**Triggers Super Admin:**
1. ✅ `subscription_expiry_alert` - Abonnements expirés/expirant
2. ✅ `group_without_subscription_alert` - Groupes sans abonnement
3. ✅ `payment_failure_alert` - Paiements échoués

**Fonction utilitaire:**
- ✅ `cleanup_old_alerts()` - Nettoyage alertes anciennes

**Conformité:**
- ✅ Fichiers < 350 lignes
- ✅ Contexte métier correct
- ✅ Séparation Super Admin / Admin Groupe

---

**Merci pour la correction ! Le contexte métier est maintenant respecté.** 🎯
