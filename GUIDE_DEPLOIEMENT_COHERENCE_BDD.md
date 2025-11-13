# 🚀 GUIDE DÉPLOIEMENT - COHÉRENCE BDD ↔ DASHBOARD

## 🎯 OBJECTIF

Déployer les corrections de cohérence entre la base de données Supabase et le Dashboard Financier E-Pilot.

---

## ✅ **ÉTAPES DE DÉPLOIEMENT**

### **ÉTAPE 1 : SAUVEGARDER LES DONNÉES** 🔒

```sql
-- 1. Sauvegarder les vues existantes
CREATE TABLE financial_stats_backup_20251030 AS SELECT * FROM financial_stats;
CREATE TABLE plan_stats_backup_20251030 AS SELECT * FROM plan_stats;

-- 2. Vérifier les sauvegardes
SELECT COUNT(*) as financial_backup_count FROM financial_stats_backup_20251030;
SELECT COUNT(*) as plan_backup_count FROM plan_stats_backup_20251030;
```

### **ÉTAPE 2 : EXÉCUTER LE SCRIPT DE CORRECTION** 🔧

1. **Ouvrir Supabase Dashboard** :
   - Aller sur https://supabase.com/dashboard
   - Sélectionner le projet E-Pilot Congo
   - Aller dans **SQL Editor**

2. **Exécuter le script** :
   - Copier le contenu de `FIX_FINANCIAL_VIEWS_COHERENCE.sql`
   - Coller dans l'éditeur SQL
   - Cliquer sur **Run**

3. **Vérifier l'exécution** :
   ```sql
   -- Vérifier que les vues sont créées
   SELECT table_name FROM information_schema.views 
   WHERE table_name IN ('financial_stats', 'plan_stats');
   
   -- Tester les données
   SELECT * FROM financial_stats LIMIT 1;
   SELECT * FROM plan_stats LIMIT 3;
   ```

### **ÉTAPE 3 : TESTER LA COHÉRENCE** 🧪

1. **Dans la console du navigateur** :
   ```javascript
   // Tester la connexion Supabase
   const { data: financial } = await supabase
     .from('financial_stats')
     .select('*')
     .single();
   
   console.log('Champs financial_stats:', Object.keys(financial));
   
   const { data: plans } = await supabase
     .from('plan_stats')
     .select('*')
     .limit(3);
   
   console.log('Champs plan_stats:', Object.keys(plans[0]));
   ```

2. **Vérifier les champs requis** :
   ```javascript
   const requiredFinancialFields = [
     'total_subscriptions', 'active_subscriptions', 'mrr', 'arr',
     'retention_rate', 'churn_rate', 'conversion_rate', 'lifetime_value'
   ];
   
   const missingFields = requiredFinancialFields.filter(
     field => !(field in financial)
   );
   
   console.log('Champs manquants:', missingFields);
   ```

### **ÉTAPE 4 : REDÉMARRER L'APPLICATION** 🔄

1. **Vider le cache React Query** :
   ```bash
   # Dans le terminal de développement
   # Arrêter le serveur (Ctrl+C)
   # Relancer
   npm run dev
   ```

2. **Ou vider le cache manuellement** :
   ```javascript
   // Dans la console du navigateur
   queryClient.clear();
   window.location.reload();
   ```

### **ÉTAPE 5 : TESTER LE DASHBOARD** ✅

1. **Aller sur la page Finances** :
   - URL : `http://localhost:5173/dashboard/finances`
   - Onglet : **Vue d'ensemble**

2. **Vérifier les 4 KPIs** :
   - ✅ Taux de Rétention (avec %)
   - ✅ Taux d'Attrition (avec %)
   - ✅ Revenu Moyen par Groupe (FCFA)
   - ✅ Valeur Vie Client (FCFA)

3. **Vérifier les nouvelles fonctionnalités** :
   - ✅ Comparaisons "vs mois dernier"
   - ✅ Barres de progression objectifs
   - ✅ Alertes automatiques

4. **Tester l'export CSV** :
   - Cliquer sur **Exporter**
   - Vérifier que le fichier contient toutes les données

---

## 🔍 **VÉRIFICATIONS POST-DÉPLOIEMENT**

### **Checklist Technique** ✅

- [ ] Vue `financial_stats` créée avec 19 champs
- [ ] Vue `plan_stats` créée avec 7 champs  
- [ ] Hook `useFinancialStats` fonctionne sans erreur
- [ ] Hook `usePlanRevenue` fonctionne sans erreur
- [ ] Aucune erreur TypeScript dans la console
- [ ] Aucune erreur React Query

### **Checklist Fonctionnelle** ✅

- [ ] 4 KPIs affichent des valeurs réalistes
- [ ] Comparaisons période précédente visibles
- [ ] Barres de progression objectifs animées
- [ ] Alertes s'affichent si > 5 paiements en retard
- [ ] Graphiques LineChart et PieChart fonctionnels
- [ ] Export CSV contient toutes les données

### **Checklist Performance** ✅

- [ ] Temps de chargement < 2 secondes
- [ ] Pas de requêtes SQL lentes (< 100ms)
- [ ] Cache React Query actif (2 min)
- [ ] Animations fluides (60fps)

---

## 🚨 **RÉSOLUTION DE PROBLÈMES**

### **Problème 1 : Vue `financial_stats` vide**

**Symptôme** : `SELECT * FROM financial_stats` retourne 0 ligne

**Cause** : Pas de données dans les tables `subscriptions` ou `payments`

**Solution** :
```sql
-- Vérifier les tables source
SELECT COUNT(*) FROM subscriptions;
SELECT COUNT(*) FROM payments;

-- Si vides, insérer des données de test
INSERT INTO subscriptions (id, status, school_group_id, plan_id, created_at)
VALUES 
  (gen_random_uuid(), 'active', gen_random_uuid(), 
   (SELECT id FROM subscription_plans WHERE slug = 'premium'), NOW()),
  (gen_random_uuid(), 'cancelled', gen_random_uuid(), 
   (SELECT id FROM subscription_plans WHERE slug = 'gratuit'), NOW() - INTERVAL '30 days');

INSERT INTO payments (id, subscription_id, amount, status, paid_at, created_at)
VALUES 
  (gen_random_uuid(), 
   (SELECT id FROM subscriptions WHERE status = 'active' LIMIT 1),
   25000, 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');
```

### **Problème 2 : Erreurs TypeScript**

**Symptôme** : `Property 'mrr' does not exist on type...`

**Cause** : Cache TypeScript ou types non mis à jour

**Solution** :
```bash
# Redémarrer le serveur TypeScript
# Dans VS Code : Ctrl+Shift+P > "TypeScript: Restart TS Server"

# Ou redémarrer Vite
npm run dev
```

### **Problème 3 : Hook retourne des valeurs par défaut**

**Symptôme** : Tous les KPIs affichent 0

**Cause** : Erreur dans la requête Supabase

**Solution** :
```javascript
// Tester la requête manuellement
const { data, error } = await supabase
  .from('financial_stats')
  .select('*')
  .single();

console.log('Data:', data);
console.log('Error:', error);

// Si erreur RLS, vérifier les permissions
```

### **Problème 4 : Graphiques vides**

**Symptôme** : LineChart et PieChart n'affichent rien

**Cause** : Données `useRevenueByPeriod` ou `usePlanRevenue` vides

**Solution** :
```sql
-- Vérifier les données pour les graphiques
SELECT 
  DATE_TRUNC('month', paid_at) as period,
  SUM(amount) as revenue,
  COUNT(*) as count
FROM payments 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY period DESC;
```

---

## 📊 **DONNÉES DE TEST**

### **Script d'insertion de données de test** :

```sql
-- 1. Créer des groupes scolaires de test
INSERT INTO school_groups (id, name, code, region, city, admin_id, plan, status)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Groupe Scolaire Excellence', 'GSE001', 'Brazzaville', 'Brazzaville', 
   (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1), 'premium', 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Institut Moderne', 'IM002', 'Pointe-Noire', 'Pointe-Noire',
   (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1), 'pro', 'active');

-- 2. Créer des abonnements
INSERT INTO subscriptions (id, school_group_id, plan_id, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001',
   (SELECT id FROM subscription_plans WHERE slug = 'premium'), 'active', NOW() - INTERVAL '60 days', NOW()),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002',
   (SELECT id FROM subscription_plans WHERE slug = 'pro'), 'active', NOW() - INTERVAL '45 days', NOW()),
  (gen_random_uuid(), gen_random_uuid(),
   (SELECT id FROM subscription_plans WHERE slug = 'gratuit'), 'cancelled', NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days');

-- 3. Créer des paiements
INSERT INTO payments (id, subscription_id, amount, status, paid_at, created_at, reference)
VALUES 
  -- Paiements ce mois
  (gen_random_uuid(), (SELECT id FROM subscriptions WHERE status = 'active' LIMIT 1 OFFSET 0),
   25000, 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'PAY-' || EXTRACT(epoch FROM NOW())::text),
  (gen_random_uuid(), (SELECT id FROM subscriptions WHERE status = 'active' LIMIT 1 OFFSET 1),
   50000, 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'PAY-' || EXTRACT(epoch FROM NOW())::text),
  
  -- Paiements mois dernier
  (gen_random_uuid(), (SELECT id FROM subscriptions WHERE status = 'active' LIMIT 1 OFFSET 0),
   25000, 'completed', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', 'PAY-' || EXTRACT(epoch FROM NOW())::text),
  (gen_random_uuid(), (SELECT id FROM subscriptions WHERE status = 'active' LIMIT 1 OFFSET 1),
   50000, 'completed', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', 'PAY-' || EXTRACT(epoch FROM NOW())::text),
  
  -- Paiements en retard
  (gen_random_uuid(), (SELECT id FROM subscriptions WHERE status = 'active' LIMIT 1 OFFSET 0),
   25000, 'pending', NULL, NOW() - INTERVAL '35 days', 'PAY-' || EXTRACT(epoch FROM NOW())::text);
```

---

## 📈 **RÉSULTATS ATTENDUS**

### **Après déploiement réussi** :

1. **KPI Taux de Rétention** : ~66.7% (2 actifs / 3 total)
2. **KPI Taux d'Attrition** : ~33.3% (1 annulé / 3 total)  
3. **KPI ARPU** : ~37,500 FCFA (75,000 / 2 groupes actifs)
4. **KPI LTV** : ~450,000 FCFA (37,500 × 12)

5. **Comparaisons** : "+0% vs mois dernier" (même montant)
6. **Objectifs** : Barres de progression visibles
7. **Alertes** : Aucune (< 5 paiements en retard)

### **Export CSV contient** :
```csv
RAPPORT FINANCIER - E-PILOT CONGO
Généré le,30/10/2025 13:30:00
Période,Mensuel

KPIs PRINCIPAUX
Taux de Rétention,66.7%
Taux d'Attrition,33.3%
Revenu Moyen par Groupe,37500 FCFA
Valeur Vie Client,450000 FCFA

REVENUS
Revenus Totaux,150000 FCFA
Revenus Mensuels,75000 FCFA
Revenus Annuels,150000 FCFA

ABONNEMENTS
Total,3
Actifs,2
En attente,0
Expirés,0
Annulés,1

PAIEMENTS EN RETARD
Nombre,1
Montant,25000 FCFA

PERFORMANCE PAR PLAN
Plan,Abonnements,Revenu (FCFA),Part (%)
Premium,1,50000,33.3
Pro,1,100000,66.7
Gratuit,1,0,0.0
```

---

## ✅ **VALIDATION FINALE**

### **Commande de validation complète** :

```sql
-- Test complet de cohérence
WITH validation AS (
  SELECT 
    'financial_stats' as table_name,
    (SELECT COUNT(*) FROM financial_stats) as record_count,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'financial_stats' 
     AND column_name IN ('mrr', 'arr', 'retention_rate', 'conversion_rate', 'lifetime_value')) as required_fields
  UNION ALL
  SELECT 
    'plan_stats' as table_name,
    (SELECT COUNT(*) FROM plan_stats) as record_count,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'plan_stats' 
     AND column_name IN ('growth')) as required_fields
)
SELECT 
  table_name,
  record_count,
  required_fields,
  CASE 
    WHEN table_name = 'financial_stats' AND required_fields = 5 THEN '✅ OK'
    WHEN table_name = 'plan_stats' AND required_fields = 1 THEN '✅ OK'
    ELSE '❌ ERREUR'
  END as status
FROM validation;
```

**Résultat attendu** :
```
table_name      | record_count | required_fields | status
----------------|--------------|-----------------|--------
financial_stats | 1            | 5               | ✅ OK
plan_stats      | 4            | 1               | ✅ OK
```

---

## 🎉 **CONCLUSION**

**APRÈS CE DÉPLOIEMENT, LE DASHBOARD FINANCIER SERA :**

- ✅ **100% cohérent** avec la base de données
- ✅ **Performant** (calculs côté SQL)
- ✅ **Complet** (tous les KPIs fonctionnels)
- ✅ **Moderne** (comparaisons + objectifs + alertes)
- ✅ **Prêt pour la production** 🚀

**Temps estimé de déploiement : 15-30 minutes**

**Prêt à déployer !** 🇨🇬

---

**FIN DU GUIDE** 🎊
