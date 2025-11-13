# 🔍 COMMENT VOIR LES GRAPHIQUES SUR LA PAGE FINANCES

**Date** : 6 novembre 2025

---

## ✅ MODIFICATIONS APPLIQUÉES

Les graphiques ont été ajoutés à la page Finances :
1. ✅ Graphique Évolution Revenus (12 mois)
2. ✅ Graphique Répartition par Plan (Donut)

---

## 🔄 POUR VOIR LES MODIFICATIONS

### **Méthode 1 : Rafraîchir le Navigateur** (Recommandé)

1. Ouvrir votre navigateur
2. Aller sur : `http://localhost:5173/dashboard/finances`
3. Appuyer sur **`F5`** ou **`Ctrl + R`**
4. Ou faire un **hard refresh** : **`Ctrl + Shift + R`**

### **Méthode 2 : Redémarrer le Serveur**

1. Dans le terminal, arrêter le serveur : **`Ctrl + C`**
2. Redémarrer : `npm run dev`
3. Rafraîchir le navigateur

---

## 📊 CE QUE VOUS DEVRIEZ VOIR

### **Page Finances Complète** :

```
┌─────────────────────────────────────────────┐
│ 📊 Finances                                  │
│ Vue d'ensemble de la santé financière       │
│ [Période ▼] [Exporter ▼]                   │
├─────────────────────────────────────────────┤
│ KPIs PRINCIPAUX (4 cards)                   │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │Groupes│ │Abonts│ │Plans │ │Revenus│      │
│ └──────┘ └──────┘ └──────┘ └──────┘       │
├─────────────────────────────────────────────┤
│ 📈 Métriques Avancées (4 cards)            │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │ ARPU │ │Convert│ │ Churn│ │ LTV  │      │
│ └──────┘ └──────┘ └──────┘ └──────┘       │
│ ℹ️ Explications des métriques              │
├─────────────────────────────────────────────┤
│ 📊 GRAPHIQUES (2 colonnes)    ← NOUVEAU    │
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │ 📈 Évolution     │ │ 📦 Répartition   │ │
│ │    Revenus       │ │    par Plan      │ │
│ │                  │ │                  │ │
│ │ [Graphique Ligne]│ │ [Graphique Donut]│ │
│ │                  │ │                  │ │
│ │ 12 derniers mois │ │ Abonnements actifs│ │
│ │                  │ │                  │ │
│ │ Total | Moyenne  │ │ Liste des plans  │ │
│ └──────────────────┘ └──────────────────┘ │
├─────────────────────────────────────────────┤
│ ⚠️ Alertes financières (si applicable)      │
├─────────────────────────────────────────────┤
│ 🚀 Accès Rapide (4 cards)                  │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │Plans │ │Abonts│ │Paiemt│ │Dépens│      │
│ └──────┘ └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────────────┘
```

---

## 🎯 DÉTAILS DES GRAPHIQUES

### **Graphique 1 : Évolution Revenus** 📈

**Position** : Colonne gauche, après les KPIs avancés

**Contenu** :
- Titre : "Évolution des Revenus"
- Sous-titre : "12 derniers mois"
- Graphique ligne turquoise
- Statistiques en haut à droite :
  - Revenu du dernier mois
  - Croissance vs mois précédent (%)
- Statistiques en bas :
  - Revenu Total
  - Moyenne Mensuelle
  - Dernier Mois

**Interactivité** :
- Hover sur les points → Tooltip avec détails
- Responsive : Passe en colonne sur mobile

---

### **Graphique 2 : Répartition par Plan** 📊

**Position** : Colonne droite, à côté du graphique revenus

**Contenu** :
- Titre : "Répartition par Plan"
- Sous-titre : "Abonnements actifs"
- Graphique donut avec couleurs :
  - Gratuit : Gris (#6B7280)
  - Premium : Turquoise (#2A9D8F)
  - Pro : Bleu foncé (#1D3557)
  - Institutionnel : Jaune/Or (#E9C46A)
- Pourcentages sur le graphique
- Liste détaillée en bas :
  - Nom du plan
  - Nombre d'abonnements (%)
  - Revenus générés
  - % des revenus
- Résumé total en bas (fond gris)

**Interactivité** :
- Hover sur les parts → Tooltip avec détails
- Légende interactive
- Responsive : Passe en colonne sur mobile

---

## 🔍 DÉPANNAGE

### **Problème 1 : Les graphiques ne s'affichent pas**

**Solutions** :
1. Vider le cache du navigateur : `Ctrl + Shift + Delete`
2. Hard refresh : `Ctrl + Shift + R`
3. Redémarrer le serveur de développement
4. Vérifier la console (F12) pour les erreurs

### **Problème 2 : Erreur "recharts is not defined"**

**Solution** :
```bash
npm install recharts
npm run dev
```

### **Problème 3 : Erreur "date-fns is not defined"**

**Solution** :
```bash
npm install date-fns
npm run dev
```

### **Problème 4 : Les graphiques sont vides**

**Raisons possibles** :
- Pas de données dans la base de données
- Vérifier qu'il y a des paiements dans la table `payments`
- Vérifier qu'il y a des abonnements actifs dans `subscriptions`

**Vérification SQL** :
```sql
-- Vérifier les paiements
SELECT COUNT(*) FROM payments WHERE status = 'completed';

-- Vérifier les abonnements
SELECT COUNT(*) FROM subscriptions WHERE status = 'active';
```

### **Problème 5 : Erreur TypeScript**

**Solution** :
```bash
npm run type-check
```

Si des erreurs apparaissent, elles seront listées et pourront être corrigées.

---

## 📱 RESPONSIVE

Les graphiques s'adaptent automatiquement :

**Desktop (≥1024px)** :
- 2 colonnes côte à côte

**Tablet (768px - 1023px)** :
- 2 colonnes côte à côte (plus étroites)

**Mobile (<768px)** :
- 1 colonne (graphiques empilés)

---

## 🎨 PERSONNALISATION

### **Changer la Période du Graphique Revenus** :

Dans `FinancesDashboard.tsx` ligne 40 :
```typescript
const { data: revenueData } = useRevenueChart(6); // 6 mois au lieu de 12
```

### **Changer les Couleurs des Plans** :

Dans `usePlanDistribution.ts` ligne 18 :
```typescript
const PLAN_COLORS = {
  gratuit: '#VOTRE_COULEUR',
  premium: '#VOTRE_COULEUR',
  pro: '#VOTRE_COULEUR',
  institutionnel: '#VOTRE_COULEUR',
};
```

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Le serveur de développement est démarré (`npm run dev`)
- [ ] Le navigateur est ouvert sur `http://localhost:5173`
- [ ] La page `/dashboard/finances` est chargée
- [ ] Le cache du navigateur est vidé
- [ ] La page est rafraîchie (F5)
- [ ] Les 4 KPIs principaux s'affichent
- [ ] Les 4 KPIs avancés s'affichent
- [ ] Le graphique Évolution Revenus s'affiche
- [ ] Le graphique Répartition par Plan s'affiche
- [ ] Les tooltips fonctionnent au hover
- [ ] Le responsive fonctionne (tester en réduisant la largeur)

---

## 📞 SUPPORT

Si les graphiques ne s'affichent toujours pas après avoir suivi toutes ces étapes :

1. Vérifier la console du navigateur (F12)
2. Copier les erreurs
3. Vérifier les fichiers créés :
   - `src/features/dashboard/hooks/useRevenueChart.ts`
   - `src/features/dashboard/hooks/usePlanDistribution.ts`
   - `src/features/dashboard/components/finance/RevenueChart.tsx`
   - `src/features/dashboard/components/finance/PlanDistributionChart.tsx`

---

**Les graphiques sont là, il suffit de rafraîchir !** 🎉
