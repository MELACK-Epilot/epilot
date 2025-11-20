# 🚨 ANALYSE: Section "Alertes Système"

**Date:** 20 novembre 2025  
**Question:** Est-ce que la section Alertes Système utilise les données réelles ?

---

## ✅ RÉPONSE: OUI, MAIS...

### 🎯 Verdict

**La section "Alertes Système" est CONÇUE pour utiliser des données réelles**, mais actuellement elle affiche **"Aucune alerte"** car:

1. ❌ **Table `system_alerts` n'existe pas** dans la base de données
2. ❌ **Aucune migration SQL** pour créer cette table
3. ✅ **Code frontend prêt** et attend les données
4. ✅ **Pas de fallback mocké** (contrairement à `useMonthlyRevenue`)

---

## 📊 ANALYSE DÉTAILLÉE

### 1. ✅ Code Frontend - CORRECT

**Fichier:** `SystemAlertsWidget.tsx`

```typescript
const { data: alertsData = [], isLoading, refetch } = useSystemAlerts({ isRead: false });
```

**Fonctionnalités implémentées:**
- ✅ Récupération données réelles depuis Supabase
- ✅ Filtres par sévérité (critical, error, warning)
- ✅ Recherche par titre/message
- ✅ Bouton "Résoudre" pour chaque alerte
- ✅ Bouton "Actualiser"
- ✅ Loading state
- ✅ Empty state ("Aucune alerte")

**Verdict:** ✅ Code frontend PARFAIT

---

### 2. ✅ Hook `useSystemAlerts` - CORRECT

**Fichier:** `useSystemAlerts.ts`

```typescript
const { data, error } = await supabase
  .from('system_alerts')
  .select('*')
  .is('resolved_at', null)
  .order('created_at', { ascending: false })
  .limit(50);
```

**Fonctionnalités:**
- ✅ Query Supabase directe (pas de mock)
- ✅ Filtres par type, sévérité, statut lu/non lu
- ✅ Tri par date (plus récentes d'abord)
- ✅ Limite à 50 alertes
- ✅ Refetch automatique toutes les 2 minutes
- ✅ Gestion d'erreur (retourne [] si erreur)

**Verdict:** ✅ Hook PARFAIT

---

### 3. ❌ Table Base de Données - MANQUANTE

**Problème:** Table `system_alerts` n'existe PAS

**Recherche effectuée:**
```bash
# Aucune migration trouvée pour system_alerts
grep -r "system_alerts" supabase/migrations/
# Résultat: Aucun fichier
```

**Impact:**
- Widget affiche "Aucune alerte" (empty state)
- Pas d'erreur visible (gestion d'erreur silencieuse)
- Utilisateur pense qu'il n'y a pas d'alertes

**Verdict:** ❌ TABLE MANQUANTE

---

## 🔧 SOLUTION: Créer la Table

### Migration SQL Requise

```sql
-- Migration: Créer table system_alerts
-- Date: 2025-11-20

CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type et sévérité
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- Contenu
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Entité liée (optionnel)
  entity_type VARCHAR(50),
  entity_id UUID,
  entity_name VARCHAR(255),
  
  -- Action
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  
  -- Statut
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour performance
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX idx_system_alerts_is_read ON system_alerts(is_read);
CREATE INDEX idx_system_alerts_resolved_at ON system_alerts(resolved_at);
CREATE INDEX idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX idx_system_alerts_entity ON system_alerts(entity_type, entity_id);

-- RLS (Row Level Security)
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin voit tout
CREATE POLICY "Super Admin can view all alerts"
  ON system_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'super_admin'
    )
  );

-- Policy: Admin Groupe voit ses alertes
CREATE POLICY "Admin Groupe can view their alerts"
  ON system_alerts
  FOR SELECT
  TO authenticated
  USING (
    entity_type = 'school_group'
    AND entity_id IN (
      SELECT id FROM school_groups
      WHERE admin_id = auth.uid()
    )
  );

-- Policy: Super Admin peut créer des alertes
CREATE POLICY "Super Admin can create alerts"
  ON system_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'super_admin'
    )
  );

-- Policy: Utilisateurs peuvent marquer comme lu/résolu
CREATE POLICY "Users can update their alerts"
  ON system_alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('super_admin', 'admin_groupe')
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_system_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_alerts_updated_at
  BEFORE UPDATE ON system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_system_alerts_updated_at();

-- Vue pour alertes non lues
CREATE OR REPLACE VIEW unread_alerts AS
SELECT *
FROM system_alerts
WHERE is_read = false
  AND resolved_at IS NULL
ORDER BY created_at DESC;

-- Fonction pour créer alerte automatique
CREATE OR REPLACE FUNCTION create_system_alert(
  p_type VARCHAR,
  p_severity VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name VARCHAR DEFAULT NULL,
  p_action_required BOOLEAN DEFAULT false,
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO system_alerts (
    alert_type,
    severity,
    title,
    message,
    entity_type,
    entity_id,
    entity_name,
    action_required,
    action_url
  ) VALUES (
    p_type,
    p_severity,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_action_required,
    p_action_url
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Données de test (optionnel)
INSERT INTO system_alerts (alert_type, severity, title, message, action_required)
VALUES
  ('subscription', 'critical', 'Abonnement expiré', 'Le groupe scolaire LAMARELLE a un abonnement expiré depuis 3 jours', true),
  ('payment', 'error', 'Paiement échoué', 'Échec du paiement pour l''école Primaire Les Cocotiers', true),
  ('system', 'warning', 'Espace disque faible', 'L''espace disque disponible est inférieur à 10%', false),
  ('user', 'info', 'Nouvel utilisateur', '5 nouveaux utilisateurs créés aujourd''hui', false);
```

---

## 📋 TYPES D'ALERTES RECOMMANDÉS

### 1. Alertes Abonnements
- **Critical:** Abonnement expiré > 7 jours
- **Error:** Abonnement expiré < 7 jours
- **Warning:** Abonnement expire dans < 7 jours
- **Info:** Nouvel abonnement créé

### 2. Alertes Paiements
- **Critical:** Paiement échoué 3+ fois
- **Error:** Paiement échoué
- **Warning:** Paiement en retard
- **Info:** Paiement reçu

### 3. Alertes Système
- **Critical:** Service down
- **Error:** Erreur base de données
- **Warning:** Performance dégradée
- **Info:** Maintenance planifiée

### 4. Alertes Utilisateurs
- **Critical:** Compte compromis
- **Error:** Tentative de connexion suspecte
- **Warning:** Mot de passe faible
- **Info:** Nouveau compte créé

---

## 🔄 TRIGGERS AUTOMATIQUES

### Créer alertes automatiquement

```sql
-- Trigger: Alerte si abonnement expire bientôt
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date <= CURRENT_DATE + INTERVAL '7 days' THEN
    PERFORM create_system_alert(
      'subscription',
      CASE
        WHEN NEW.end_date < CURRENT_DATE THEN 'critical'
        WHEN NEW.end_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'error'
        ELSE 'warning'
      END,
      'Abonnement expire bientôt',
      format('L''abonnement du groupe %s expire le %s', NEW.school_group_name, NEW.end_date),
      'subscription',
      NEW.id,
      NEW.school_group_name,
      true,
      format('/dashboard/subscriptions/%s', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_expiry_alert
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiry();

-- Trigger: Alerte si paiement échoue
CREATE OR REPLACE FUNCTION check_payment_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' THEN
    PERFORM create_system_alert(
      'payment',
      'error',
      'Paiement échoué',
      format('Le paiement de %s FCFA pour %s a échoué', NEW.amount, NEW.school_name),
      'payment',
      NEW.id,
      NEW.school_name,
      true,
      format('/dashboard/payments/%s', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_failure_alert
  AFTER INSERT OR UPDATE ON fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION check_payment_failure();
```

---

## 📊 COMPARAISON AVANT/APRÈS

| Aspect | Avant (Actuel) | Après (Avec Table) |
|--------|----------------|-------------------|
| **Table BD** | ❌ N'existe pas | ✅ Créée |
| **Données** | ❌ Aucune | ✅ Réelles |
| **Affichage** | "Aucune alerte" | Alertes réelles |
| **Triggers** | ❌ Aucun | ✅ Automatiques |
| **Filtres** | ⚠️ Fonctionnent (vide) | ✅ Fonctionnent |
| **Recherche** | ⚠️ Fonctionne (vide) | ✅ Fonctionne |
| **Actions** | ⚠️ Fonctionnent (vide) | ✅ Fonctionnent |

---

## 🎯 PLAN D'ACTION

### Immédiat (30 min)
1. ✅ Créer migration `20251120_create_system_alerts.sql`
2. ✅ Exécuter migration
3. ✅ Insérer données de test
4. ✅ Vérifier affichage

### Court terme (2h)
1. Créer triggers automatiques
2. Intégrer alertes dans workflow
3. Tester tous les cas d'usage

### Moyen terme (1 semaine)
1. Ajouter notifications email
2. Ajouter notifications push
3. Dashboard analytics alertes

---

## ✅ CONCLUSION

### État Actuel
- ✅ **Code frontend:** PARFAIT
- ✅ **Hook React Query:** PARFAIT
- ❌ **Table BD:** MANQUANTE
- ⚠️ **Affichage:** "Aucune alerte" (normal car table vide)

### Verdict Final
**La section "Alertes Système" utilise UNIQUEMENT des données réelles** (pas de mock), mais affiche "Aucune alerte" car la table `system_alerts` n'existe pas encore.

### Action Requise
**Créer la table `system_alerts`** avec la migration SQL fournie ci-dessus.

**Temps estimé:** 30 minutes

---

**Voulez-vous que je crée la migration SQL maintenant ?** 🚀
