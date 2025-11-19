# 🚀 GUIDE D'EXÉCUTION - AUTO-RENOUVELLEMENT

**Date:** 19 novembre 2025  
**Objectif:** Activer la fonctionnalité d'auto-renouvellement  
**Méthode:** Exécution manuelle via Supabase Dashboard

---

## ⚠️ PROBLÈME MCP

Le serveur MCP Supabase n'est pas encore actif dans Windsurf. Cela peut être dû à:
- Le serveur MCP prend du temps à démarrer
- Une configuration supplémentaire est nécessaire
- Le package `mcp-remote` doit être installé

**Solution:** Exécuter le script SQL directement via le dashboard Supabase.

---

## 📋 ÉTAPES D'EXÉCUTION

### Étape 1: Ouvrir Supabase Dashboard

1. Va sur: https://supabase.com/dashboard
2. Connecte-toi à ton compte
3. Sélectionne le projet **E-Pilot** (`csltuxbanvweyfzqpfap`)

### Étape 2: Ouvrir SQL Editor

1. Dans le menu de gauche, clique sur **SQL Editor**
2. Clique sur **New query** (ou **+ New**)

### Étape 3: Copier le Script

Copie le script suivant (ou ouvre le fichier `database/ADD_AUTO_RENEW_COLUMN.sql`):

```sql
/**
 * AJOUT COLONNE AUTO_RENEW - RENOUVELLEMENT AUTOMATIQUE
 * Temps d'exécution: ~5 secondes
 */

-- ============================================
-- PARTIE 1 : AJOUT COLONNE AUTO_RENEW
-- ============================================

-- Ajouter la colonne auto_renew si elle n'existe pas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Commentaire explicatif
COMMENT ON COLUMN subscriptions.auto_renew IS 'Renouvellement automatique de l''abonnement à l''expiration (true par défaut)';

-- ============================================
-- PARTIE 2 : MISE À JOUR DES DONNÉES EXISTANTES
-- ============================================

-- Mettre à jour les abonnements existants sans valeur
UPDATE subscriptions
SET auto_renew = true
WHERE auto_renew IS NULL;

-- Définir auto_renew à false pour les abonnements annulés ou expirés
UPDATE subscriptions
SET auto_renew = false
WHERE status IN ('cancelled', 'expired', 'suspended')
  AND auto_renew = true;

-- ============================================
-- PARTIE 3 : INDEX POUR PERFORMANCE
-- ============================================

-- Index pour les requêtes de renouvellement automatique
CREATE INDEX IF NOT EXISTS idx_subscriptions_auto_renew 
ON subscriptions(auto_renew, end_date) 
WHERE status = 'active' AND auto_renew = true;

-- ============================================
-- PARTIE 4 : FONCTION DE RENOUVELLEMENT AUTOMATIQUE
-- ============================================

CREATE OR REPLACE FUNCTION process_auto_renewals()
RETURNS TABLE(
  subscription_id UUID,
  school_group_name TEXT,
  plan_name TEXT,
  old_end_date TIMESTAMPTZ,
  new_end_date TIMESTAMPTZ,
  status TEXT
) AS $$
DECLARE
  v_subscription RECORD;
  v_new_end_date TIMESTAMPTZ;
  v_billing_days INTEGER;
BEGIN
  -- Parcourir les abonnements à renouveler (expirant dans les 7 prochains jours)
  FOR v_subscription IN
    SELECT 
      s.id,
      s.end_date,
      s.billing_period,
      sg.name as group_name,
      sp.name as plan_name
    FROM subscriptions s
    INNER JOIN school_groups sg ON sg.id = s.school_group_id
    INNER JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.status = 'active'
      AND s.auto_renew = true
      AND s.end_date IS NOT NULL
      AND s.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  LOOP
    -- Calculer la nouvelle date de fin selon le cycle de facturation
    v_billing_days := CASE v_subscription.billing_period
      WHEN 'monthly' THEN 30
      WHEN 'quarterly' THEN 90
      WHEN 'biannual' THEN 180
      WHEN 'yearly' THEN 365
      ELSE 30
    END;
    
    v_new_end_date := v_subscription.end_date + (v_billing_days || ' days')::INTERVAL;
    
    -- Mettre à jour l'abonnement
    UPDATE subscriptions
    SET 
      end_date = v_new_end_date,
      updated_at = NOW()
    WHERE id = v_subscription.id;
    
    -- Retourner les informations du renouvellement
    subscription_id := v_subscription.id;
    school_group_name := v_subscription.group_name;
    plan_name := v_subscription.plan_name;
    old_end_date := v_subscription.end_date;
    new_end_date := v_new_end_date;
    status := 'renewed';
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION process_auto_renewals() IS 'Traite les renouvellements automatiques des abonnements expirant dans les 7 prochains jours';

-- ============================================
-- PARTIE 5 : FONCTION POUR ACTIVER/DÉSACTIVER AUTO-RENEW
-- ============================================

CREATE OR REPLACE FUNCTION toggle_auto_renew(
  p_subscription_id UUID,
  p_auto_renew BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Mettre à jour le statut auto_renew
  UPDATE subscriptions
  SET 
    auto_renew = p_auto_renew,
    updated_at = NOW()
  WHERE id = p_subscription_id
    AND status = 'active';
  
  -- Vérifier si la mise à jour a réussi
  IF FOUND THEN
    v_result := jsonb_build_object(
      'success', true,
      'message', CASE 
        WHEN p_auto_renew THEN 'Renouvellement automatique activé'
        ELSE 'Renouvellement automatique désactivé'
      END,
      'subscription_id', p_subscription_id,
      'auto_renew', p_auto_renew
    );
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'message', 'Abonnement introuvable ou inactif',
      'subscription_id', p_subscription_id
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON FUNCTION toggle_auto_renew(UUID, BOOLEAN) IS 'Active ou désactive le renouvellement automatique d''un abonnement';

-- ============================================
-- PARTIE 6 : VÉRIFICATION
-- ============================================

-- Afficher les abonnements avec auto-renouvellement
SELECT 
  sg.name as groupe_scolaire,
  sp.name as plan,
  s.status,
  s.start_date,
  s.end_date,
  s.auto_renew as renouvellement_auto,
  CASE 
    WHEN s.auto_renew AND s.status = 'active' THEN '✅ Auto-renouvelé'
    WHEN NOT s.auto_renew AND s.status = 'active' THEN '⚠️ Manuel'
    ELSE '❌ Inactif'
  END as statut_renouvellement
FROM subscriptions s
INNER JOIN school_groups sg ON sg.id = s.school_group_id
INNER JOIN subscription_plans sp ON sp.id = s.plan_id
ORDER BY s.end_date ASC;
```

### Étape 4: Exécuter le Script

1. Colle le script dans l'éditeur SQL
2. Clique sur **Run** (ou appuie sur `Ctrl+Enter`)
3. Attends l'exécution (~5 secondes)

### Étape 5: Vérifier les Résultats

Tu devrais voir:
- ✅ Colonne `auto_renew` ajoutée
- ✅ Index créé
- ✅ Fonctions créées
- ✅ Tableau avec les abonnements et leur statut

**Résultat attendu:**

| groupe_scolaire | plan | status | auto_renew | statut_renouvellement |
|----------------|------|--------|------------|-----------------------|
| Ecole EDJA | Premium | active | true | ✅ Auto-renouvelé |
| Groupe LAMARELLE | Pro | active | true | ✅ Auto-renouvelé |

---

## 🎯 APRÈS L'EXÉCUTION

### 1. Vérifier dans l'Interface

Retourne dans l'application E-Pilot:
1. Va sur **Plans & Tarification**
2. Clique sur l'onglet **Abonnements**
3. Tu devrais voir le badge **"Auto-renouvelé"** sur les abonnements actifs

### 2. Configurer le CRON Job (Optionnel)

Pour automatiser les renouvellements:

1. Dans Supabase Dashboard, va sur **Database → Cron Jobs**
2. Clique sur **Create a new cron job**
3. Configure:
   - **Name:** `Auto-renew subscriptions`
   - **Schedule:** `0 2 * * *` (tous les jours à 2h du matin)
   - **Command:** `SELECT * FROM process_auto_renewals();`
4. Clique sur **Create**

### 3. Tester Manuellement

Pour tester la fonction de renouvellement:

```sql
-- Tester le renouvellement automatique
SELECT * FROM process_auto_renewals();
```

Pour activer/désactiver l'auto-renew d'un abonnement:

```sql
-- Activer
SELECT toggle_auto_renew('subscription-uuid', true);

-- Désactiver
SELECT toggle_auto_renew('subscription-uuid', false);
```

---

## 📊 STATISTIQUES

Pour voir les statistiques d'auto-renouvellement:

```sql
SELECT 
  COUNT(*) FILTER (WHERE auto_renew = true AND status = 'active') as auto_renew_actifs,
  COUNT(*) FILTER (WHERE auto_renew = false AND status = 'active') as manuels_actifs,
  COUNT(*) FILTER (WHERE status = 'active') as total_actifs,
  ROUND(
    COUNT(*) FILTER (WHERE auto_renew = true AND status = 'active')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status = 'active'), 0) * 100, 
    2
  ) as pourcentage_auto_renew
FROM subscriptions;
```

---

## ✅ CHECKLIST

- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans SQL Editor
- [ ] Copier le script `ADD_AUTO_RENEW_COLUMN.sql`
- [ ] Exécuter le script
- [ ] Vérifier les résultats
- [ ] Rafraîchir l'application E-Pilot
- [ ] Vérifier que le badge "Auto-renouvelé" s'affiche
- [ ] Configurer le CRON job (optionnel)
- [ ] Tester la fonction manuellement

---

## 🚨 EN CAS D'ERREUR

### Erreur: "column already exists"
```sql
-- La colonne existe déjà, vérifier:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name = 'auto_renew';
```

### Erreur: "function already exists"
```sql
-- Supprimer et recréer:
DROP FUNCTION IF EXISTS process_auto_renewals();
DROP FUNCTION IF EXISTS toggle_auto_renew(UUID, BOOLEAN);
-- Puis réexécuter la création
```

### Erreur: "permission denied"
```
Tu dois être connecté avec un compte ayant les droits d'administration
sur le projet Supabase.
```

---

## 🎯 RÉSULTAT FINAL

Après l'exécution du script:

✅ **Colonne `auto_renew`** ajoutée à la table `subscriptions`  
✅ **Index** créé pour optimiser les performances  
✅ **Fonction `process_auto_renewals()`** disponible  
✅ **Fonction `toggle_auto_renew()`** disponible  
✅ **Badge "Auto-renouvelé"** s'affiche dans l'interface  
✅ **Fonctionnalité complète** opérationnelle  

---

**Temps total:** ~5 minutes  
**Difficulté:** Facile (copier-coller)  
**Impact:** Fonctionnalité d'auto-renouvellement activée! 🚀✨
