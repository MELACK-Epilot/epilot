# ✅ VÉRIFICATION: Alertes Système

**Date:** 20 novembre 2025  
**Statut:** Table existe ✅

---

## ✅ TABLE EXISTE

La table `system_alerts` est déjà créée avec:
- ✅ Tous les champs nécessaires
- ✅ Index de performance
- ✅ Contraintes de validation
- ✅ Foreign keys vers `users`, `school_groups`, `schools`
- ✅ Trigger `update_updated_at_column`

---

## 🔍 VÉRIFICATIONS À FAIRE

### 1. Vérifier si la table contient des données

```sql
-- Compter les alertes
SELECT COUNT(*) FROM system_alerts;

-- Voir les alertes non résolues
SELECT 
  id,
  severity,
  alert_type,
  title,
  message,
  is_read,
  created_at
FROM system_alerts
WHERE resolved_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Statistiques par sévérité
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

---

### 2. Vérifier les RLS (Row Level Security)

```sql
-- Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'system_alerts';

-- Voir les policies
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

---

### 3. Insérer des données de test

```sql
-- Alerte critique: Abonnement expiré
INSERT INTO system_alerts (
  alert_type,
  severity,
  category,
  title,
  message,
  entity_type,
  entity_id,
  action_required,
  action_url,
  action_label
)
SELECT
  'subscription',
  'critical',
  'expiration',
  'Abonnement expiré',
  'Le groupe scolaire ' || sg.name || ' a un abonnement expiré depuis ' || 
    EXTRACT(DAY FROM NOW() - s.end_date) || ' jours',
  'school_group',
  sg.id,
  true,
  '/dashboard/subscriptions?group=' || sg.id,
  'Renouveler'
FROM subscriptions s
JOIN school_groups sg ON s.school_group_id = sg.id
WHERE s.end_date < NOW()
  AND s.status = 'expired'
LIMIT 5;

-- Alerte erreur: Paiement échoué
INSERT INTO system_alerts (
  alert_type,
  severity,
  category,
  title,
  message,
  entity_type,
  entity_id,
  action_required,
  action_url,
  action_label
)
VALUES
  (
    'payment',
    'error',
    'payment_failed',
    'Paiement échoué',
    'Le paiement de 50,000 FCFA pour l''école Primaire Les Cocotiers a échoué',
    'payment',
    gen_random_uuid(),
    true,
    '/dashboard/payments',
    'Voir détails'
  );

-- Alerte warning: Abonnement expire bientôt
INSERT INTO system_alerts (
  alert_type,
  severity,
  category,
  title,
  message,
  entity_type,
  action_required,
  action_url,
  action_label
)
SELECT
  'subscription',
  'warning',
  'expiring_soon',
  'Abonnement expire bientôt',
  'Le groupe scolaire ' || sg.name || ' a un abonnement qui expire dans ' || 
    EXTRACT(DAY FROM s.end_date - NOW()) || ' jours',
  'school_group',
  sg.id,
  true,
  '/dashboard/subscriptions?group=' || sg.id,
  'Renouveler'
FROM subscriptions s
JOIN school_groups sg ON s.school_group_id = sg.id
WHERE s.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND s.status = 'active'
LIMIT 3;

-- Alerte info: Système
INSERT INTO system_alerts (
  alert_type,
  severity,
  category,
  title,
  message,
  action_required
)
VALUES
  (
    'system',
    'info',
    'maintenance',
    'Maintenance planifiée',
    'Une maintenance système est prévue le 25 novembre de 2h à 4h du matin',
    false
  );
```

---

### 4. Vérifier l'affichage dans le widget

**Actions:**
1. Recharger la page dashboard (Ctrl + Shift + R)
2. Vérifier la section "Alertes Système"
3. Devrait afficher les alertes insérées

**Attendu:**
- Badge avec nombre d'alertes
- Filtres par sévérité (Critiques, Erreurs, Avertissements)
- Recherche fonctionnelle
- Bouton "Résoudre" sur chaque alerte

---

## 🔧 TRIGGERS AUTOMATIQUES RECOMMANDÉS

### Trigger 1: Alerte si abonnement expire

```sql
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Si abonnement expire dans moins de 7 jours
  IF NEW.end_date <= CURRENT_DATE + INTERVAL '7 days' 
     AND NEW.end_date > CURRENT_DATE 
     AND NEW.status = 'active' THEN
    
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_group_id,
      action_required,
      action_url,
      action_label
    )
    VALUES (
      'subscription',
      CASE
        WHEN NEW.end_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'error'
        ELSE 'warning'
      END,
      'expiring_soon',
      'Abonnement expire bientôt',
      format(
        'L''abonnement du groupe %s expire le %s (dans %s jours)',
        (SELECT name FROM school_groups WHERE id = NEW.school_group_id),
        NEW.end_date,
        EXTRACT(DAY FROM NEW.end_date - CURRENT_DATE)
      ),
      'subscription',
      NEW.id,
      NEW.school_group_id,
      true,
      format('/dashboard/subscriptions?group=%s', NEW.school_group_id),
      'Renouveler'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Si abonnement expiré
  IF NEW.end_date < CURRENT_DATE AND NEW.status = 'expired' THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_group_id,
      action_required,
      action_url,
      action_label
    )
    VALUES (
      'subscription',
      'critical',
      'expired',
      'Abonnement expiré',
      format(
        'L''abonnement du groupe %s a expiré depuis %s jours',
        (SELECT name FROM school_groups WHERE id = NEW.school_group_id),
        EXTRACT(DAY FROM CURRENT_DATE - NEW.end_date)
      ),
      'subscription',
      NEW.id,
      NEW.school_group_id,
      true,
      format('/dashboard/subscriptions?group=%s', NEW.school_group_id),
      'Renouveler maintenant'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS subscription_expiry_alert ON subscriptions;
CREATE TRIGGER subscription_expiry_alert
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiry();
```

---

### Trigger 2: Alerte si paiement échoue

```sql
CREATE OR REPLACE FUNCTION check_payment_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_id,
      action_required,
      action_url,
      action_label
    )
    VALUES (
      'payment',
      'error',
      'payment_failed',
      'Paiement échoué',
      format(
        'Le paiement de %s FCFA pour %s a échoué',
        NEW.amount,
        (SELECT name FROM schools WHERE id = NEW.school_id)
      ),
      'payment',
      NEW.id,
      NEW.school_id,
      true,
      format('/dashboard/payments/%s', NEW.id),
      'Réessayer'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS payment_failure_alert ON fee_payments;
CREATE TRIGGER payment_failure_alert
  AFTER INSERT OR UPDATE ON fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION check_payment_failure();
```

---

### Trigger 3: Alerte si école sans directeur

```sql
CREATE OR REPLACE FUNCTION check_school_without_director()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si l'école a un directeur
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE school_id = NEW.id
    AND role = 'directeur'
    AND deleted_at IS NULL
  ) THEN
    INSERT INTO system_alerts (
      alert_type,
      severity,
      category,
      title,
      message,
      entity_type,
      entity_id,
      school_id,
      action_required,
      action_url,
      action_label
    )
    VALUES (
      'school',
      'warning',
      'missing_director',
      'École sans directeur',
      format('L''école %s n''a pas de directeur assigné', NEW.name),
      'school',
      NEW.id,
      NEW.id,
      true,
      format('/dashboard/schools/%s/users', NEW.id),
      'Assigner un directeur'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS school_without_director_alert ON schools;
CREATE TRIGGER school_without_director_alert
  AFTER INSERT OR UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION check_school_without_director();
```

---

## 📊 REQUÊTES UTILES

### Nettoyer les alertes résolues anciennes

```sql
-- Supprimer les alertes résolues de plus de 30 jours
DELETE FROM system_alerts
WHERE resolved_at < NOW() - INTERVAL '30 days';
```

### Statistiques des alertes

```sql
-- Alertes par type et sévérité
SELECT 
  alert_type,
  severity,
  COUNT(*) as count,
  COUNT(CASE WHEN is_read THEN 1 END) as read_count,
  COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END) as resolved_count
FROM system_alerts
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY alert_type, severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END,
  count DESC;
```

### Alertes non résolues par groupe scolaire

```sql
SELECT 
  sg.name as groupe,
  COUNT(*) as alertes_actives,
  COUNT(CASE WHEN sa.severity = 'critical' THEN 1 END) as critiques,
  COUNT(CASE WHEN sa.severity = 'error' THEN 1 END) as erreurs,
  COUNT(CASE WHEN sa.severity = 'warning' THEN 1 END) as avertissements
FROM system_alerts sa
JOIN school_groups sg ON sa.school_group_id = sg.id
WHERE sa.resolved_at IS NULL
GROUP BY sg.id, sg.name
ORDER BY critiques DESC, erreurs DESC;
```

---

## ✅ CHECKLIST

### Vérifications
- [ ] Table existe
- [ ] RLS activé
- [ ] Policies créées
- [ ] Données de test insérées
- [ ] Widget affiche les alertes
- [ ] Filtres fonctionnent
- [ ] Recherche fonctionne
- [ ] Bouton "Résoudre" fonctionne
- [ ] Actualisation fonctionne

### Triggers (Optionnel)
- [ ] Trigger abonnements expirés
- [ ] Trigger paiements échoués
- [ ] Trigger écoles sans directeur

---

## 🎯 PROCHAINES ÉTAPES

1. **Immédiat:** Vérifier si des données existent
2. **Si vide:** Insérer données de test
3. **Tester:** Recharger dashboard et vérifier affichage
4. **Optionnel:** Créer triggers automatiques

---

**Voulez-vous que je vérifie si des données existent dans la table ?** 🔍
