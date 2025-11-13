# 🎯 Système d'Abonnement Hiérarchique E-Pilot Congo

## 📋 Vue d'ensemble

Système complet de gestion des plans d'abonnement avec quotas automatiques pour la plateforme E-Pilot. Permet au Super Admin de créer des plans qui conditionnent les limites des groupes scolaires (écoles, élèves, personnel, stockage).

---

## 🏗️ Architecture Hiérarchique

```
Super Admin E-Pilot (Plateforme)
      ↓
   Crée/Gère Plans d'Abonnement
      ↓
   Associe Plan → Groupe Scolaire
      ↓
Groupe Scolaire (Limites automatiques)
      ↓
   Crée Écoles/Élèves/Personnel
      ↓
   ⚠️ Vérification Quotas Automatique
```

---

## 📊 Structure des Plans d'Abonnement

### **Champs principaux**
```typescript
{
  id: string,
  name: string,              // "Gratuit", "Premium", "Pro", "Institutionnel"
  slug: SubscriptionPlan,    // 'gratuit' | 'premium' | 'pro' | 'institutionnel'
  description: string,
  price: number,             // Prix en FCFA
  currency: 'FCFA' | 'EUR' | 'USD',
  billingCycle: 'monthly' | 'yearly',
  duration: number,          // Durée en mois
  
  // Quotas (Limites)
  maxSchools: number,        // Nombre max d'écoles
  maxStudents: number,       // Nombre max d'élèves
  maxPersonnel: number,      // Nombre max de personnel
  storageLimit: string,      // Ex: "10GB", "50GB", "Illimité"
  
  // Fonctionnalités
  features: string[],        // Liste des modules disponibles
  supportLevel: 'email' | 'priority' | '24/7',
  customBranding: boolean,
  apiAccess: boolean,
  
  // Statut
  isActive: boolean,
  isPopular: boolean,
  discount?: number,         // Pourcentage de réduction
  trialDays?: number,        // Jours d'essai gratuit
}
```

---

## 🗄️ Base de Données

### **1. Table : subscription_plans**

Stocke tous les plans d'abonnement disponibles.

**Colonnes principales :**
- `id` (UUID) - Identifiant unique
- `name` (VARCHAR) - Nom du plan
- `slug` (VARCHAR) - Identifiant unique (gratuit, premium, pro, institutionnel)
- `price` (DECIMAL) - Prix
- `billing_cycle` (VARCHAR) - monthly | yearly
- `duration` (INTEGER) - Durée en mois
- `max_schools`, `max_students`, `max_personnel` (INTEGER) - Quotas
- `storage_limit` (VARCHAR) - Limite de stockage
- `features` (JSONB) - Liste des fonctionnalités
- `is_active` (BOOLEAN) - Plan actif ou non
- `created_at`, `updated_at` (TIMESTAMPTZ)

### **2. Vue : school_groups_with_quotas**

Vue SQL qui combine les groupes scolaires avec leurs quotas d'utilisation en temps réel.

**Données fournies :**
- Limites du plan (max_schools, max_students, max_personnel, storage_limit)
- Utilisation actuelle (current_schools, current_students, current_personnel)
- Pourcentages d'utilisation (schools_usage_percent, students_usage_percent, etc.)
- Statuts des limites (is_schools_limit_reached, is_students_limit_reached, etc.)

### **3. Fonction : check_quota_before_creation**

Fonction PostgreSQL pour vérifier les quotas avant création d'une ressource.

**Paramètres :**
- `p_school_group_id` (UUID) - ID du groupe scolaire
- `p_resource_type` (VARCHAR) - 'school' | 'student' | 'personnel'
- `p_increment` (INTEGER) - Nombre à ajouter (défaut: 1)

**Retour (JSONB) :**
```json
{
  "allowed": true/false,
  "message": "Message d'erreur ou de succès",
  "current": 5,
  "max": 10,
  "plan_name": "Premium"
}
```

---

## 🎨 Composants React

### **1. QuotaProgressBar**
Barre de progression pour afficher l'utilisation d'un quota.

**Props :**
- `label` - Libellé (Ex: "Écoles")
- `current` - Valeur actuelle
- `max` - Valeur maximale
- `unit` - Unité (optionnel)
- `showPercentage` - Afficher le pourcentage

**Statuts visuels :**
- 🟢 **Normal** (< 80%) - Vert
- 🟠 **Warning** (80-99%) - Orange
- 🔴 **Critical** (100%) - Rouge
- 🔵 **Unlimited** (999999) - Bleu

### **2. QuotaCard**
Carte complète affichant tous les quotas d'un groupe scolaire.

**Props :**
- `quotas` - Objet GroupQuotas
- `planName` - Nom du plan (optionnel)
- `onUpgrade` - Callback pour mise à niveau
- `showUpgradeButton` - Afficher le bouton (défaut: true)

**Affiche :**
- 4 barres de progression (Écoles, Élèves, Personnel, Stockage)
- Message d'avertissement si limite atteinte
- Bouton "Mettre à niveau" si nécessaire

### **3. QuotaAlert**
Alerte pour afficher un message de quota dépassé dans les formulaires.

**Props :**
- `resourceType` - 'school' | 'student' | 'personnel'
- `current` - Valeur actuelle
- `max` - Valeur maximale
- `planName` - Nom du plan
- `onUpgrade` - Callback pour mise à niveau

---

## 🎣 Hooks React Query

### **1. usePlans**
Récupère la liste des plans d'abonnement.

```typescript
const { data: plans, isLoading } = usePlans({ 
  query: 'premium', 
  status: 'active' 
});
```

### **2. usePlan**
Récupère un plan spécifique par ID.

```typescript
const { data: plan } = usePlan(planId);
```

### **3. useCreatePlan**
Crée un nouveau plan d'abonnement.

```typescript
const createPlan = useCreatePlan();
await createPlan.mutateAsync({
  name: 'Premium',
  slug: 'premium',
  price: 25000,
  billingCycle: 'monthly',
  duration: 12,
  maxSchools: 3,
  maxStudents: 200,
  maxPersonnel: 20,
  storageLimit: '20GB',
  features: ['Gestion des notes', 'Communication'],
  supportLevel: 'priority',
});
```

### **4. useUpdatePlan**
Met à jour un plan existant.

```typescript
const updatePlan = useUpdatePlan();
await updatePlan.mutateAsync({
  id: planId,
  price: 30000,
  maxSchools: 5,
});
```

### **5. useDeletePlan**
Désactive un plan (archivage).

```typescript
const deletePlan = useDeletePlan();
await deletePlan.mutateAsync(planId);
```

### **6. useGroupQuotas**
Récupère les quotas d'un groupe scolaire.

```typescript
const { data: quotas } = useGroupQuotas(schoolGroupId);
```

### **7. useCheckQuota**
Vérifie si un quota est disponible avant création.

```typescript
const checkQuota = useCheckQuota();
const result = await checkQuota.mutateAsync({
  schoolGroupId: 'xxx',
  resourceType: 'school',
  increment: 1,
});

if (!result.allowed) {
  toast.error(result.message);
}
```

### **8. useCanCreateResource**
Hook helper pour vérifier rapidement si une action est autorisée.

```typescript
const { canCreate, reason, quotas } = useCanCreateResource(
  schoolGroupId,
  'school'
);

if (!canCreate) {
  console.log(reason); // "Limite atteinte : 3/3 écoles"
}
```

---

## 🔄 Flux de Vérification des Quotas

### **Scénario : Création d'une école**

```typescript
// 1. Récupérer les quotas du groupe
const { data: quotas } = useGroupQuotas(schoolGroupId);

// 2. Vérifier si la limite est atteinte
if (quotas.isSchoolsLimitReached) {
  // Afficher QuotaAlert
  return (
    <QuotaAlert
      resourceType="school"
      current={quotas.currentSchools}
      max={quotas.maxSchools}
      planName="Premium"
      onUpgrade={() => navigate('/plans')}
    />
  );
}

// 3. Si OK, permettre la création
const handleSubmit = async (data) => {
  // Vérification finale côté serveur
  const check = await checkQuota.mutateAsync({
    schoolGroupId,
    resourceType: 'school',
  });

  if (!check.allowed) {
    toast.error(check.message);
    return;
  }

  // Créer l'école
  await createSchool.mutateAsync(data);
};
```

---

## 📦 Plans par Défaut

### **1. Gratuit**
- **Prix :** 0 FCFA/mois
- **Écoles :** 1
- **Élèves :** 50
- **Personnel :** 5
- **Stockage :** 5GB
- **Support :** Email
- **Fonctionnalités :** Gestion de base

### **2. Premium** ⭐ (Populaire)
- **Prix :** 25 000 FCFA/mois
- **Écoles :** 3
- **Élèves :** 200
- **Personnel :** 20
- **Stockage :** 20GB
- **Support :** Prioritaire
- **Fonctionnalités :** Gestion avancée + Communication

### **3. Pro**
- **Prix :** 50 000 FCFA/mois
- **Écoles :** 10
- **Élèves :** 1 000
- **Personnel :** 100
- **Stockage :** 100GB
- **Support :** 24/7
- **Fonctionnalités :** Toutes + API + Personnalisation

### **4. Institutionnel**
- **Prix :** 150 000 FCFA/mois
- **Écoles :** Illimité
- **Élèves :** Illimité
- **Personnel :** Illimité
- **Stockage :** Illimité
- **Support :** Dédié 24/7
- **Fonctionnalités :** Toutes + Formation + SLA

---

## 🚀 Installation et Déploiement

### **1. Exécuter le schéma SQL**

```bash
# Dans Supabase SQL Editor
psql -U postgres -d your_database -f SUBSCRIPTION_PLANS_SCHEMA.sql
```

Ou copier-coller le contenu de `SUBSCRIPTION_PLANS_SCHEMA.sql` dans le SQL Editor de Supabase.

### **2. Vérifier les tables créées**

```sql
-- Vérifier la table subscription_plans
SELECT * FROM subscription_plans;

-- Vérifier la vue school_groups_with_quotas
SELECT * FROM school_groups_with_quotas LIMIT 5;

-- Tester la fonction de vérification
SELECT check_quota_before_creation(
  'school_group_id_here'::uuid,
  'school',
  1
);
```

### **3. Mettre à jour les groupes existants**

```sql
-- Associer le plan gratuit par défaut aux groupes existants
UPDATE school_groups
SET plan_id = (SELECT id FROM subscription_plans WHERE slug = 'gratuit' LIMIT 1)
WHERE plan_id IS NULL;
```

---

## 📝 Exemples d'Utilisation

### **Exemple 1 : Afficher les quotas dans un dashboard**

```tsx
import { useGroupQuotas } from '@/features/dashboard/hooks/useQuotas';
import { QuotaCard } from '@/features/dashboard/components/quotas';

function GroupDashboard({ schoolGroupId }: { schoolGroupId: string }) {
  const { data: quotas, isLoading } = useGroupQuotas(schoolGroupId);

  if (isLoading) return <div>Chargement...</div>;

  return (
    <QuotaCard
      quotas={quotas}
      planName="Premium"
      onUpgrade={() => navigate('/plans')}
    />
  );
}
```

### **Exemple 2 : Vérifier avant création**

```tsx
import { useCanCreateResource } from '@/features/dashboard/hooks/useQuotas';
import { QuotaAlert } from '@/features/dashboard/components/quotas';

function CreateSchoolForm({ schoolGroupId }: { schoolGroupId: string }) {
  const { canCreate, reason, quotas } = useCanCreateResource(
    schoolGroupId,
    'school'
  );

  if (!canCreate) {
    return (
      <QuotaAlert
        resourceType="school"
        current={quotas.currentSchools}
        max={quotas.maxSchools}
        planName="Premium"
        onUpgrade={() => navigate('/plans')}
      />
    );
  }

  return <form>{/* Formulaire de création */}</form>;
}
```

### **Exemple 3 : Afficher une barre de progression**

```tsx
import { QuotaProgressBar } from '@/features/dashboard/components/quotas';

function SchoolsQuota() {
  return (
    <QuotaProgressBar
      label="Écoles"
      current={2}
      max={3}
      showPercentage
    />
  );
}
```

---

## ⚠️ Messages d'Erreur

### **Limite atteinte**
```
Limite atteinte : Vous avez atteint la limite de votre plan Premium (3/3 écoles). 
Veuillez passer à un plan supérieur.
```

### **Quota disponible**
```
Quota disponible : 2/3 écoles utilisées (67%)
```

### **Plan illimité**
```
Illimité : Aucune limite sur ce plan
```

---

## 🎨 Couleurs E-Pilot

- **Bleu Foncé** : #1D3557 (principal)
- **Vert Cité** : #2A9D8F (succès, actions)
- **Or Républicain** : #E9C46A (accents)
- **Rouge Sobre** : #E63946 (erreurs, limites)
- **Orange** : #F97316 (avertissements)

---

## 📁 Structure des Fichiers

```
src/features/dashboard/
├── types/
│   └── dashboard.types.ts          # Types Plan, GroupQuotas
├── hooks/
│   ├── usePlans.ts                 # Hooks pour les plans
│   └── useQuotas.ts                # Hooks pour les quotas
├── components/
│   └── quotas/
│       ├── QuotaProgressBar.tsx    # Barre de progression
│       ├── QuotaCard.tsx           # Carte complète
│       ├── QuotaAlert.tsx          # Alerte de limite
│       └── index.ts                # Exports

SUBSCRIPTION_PLANS_SCHEMA.sql       # Schéma SQL complet
SYSTEME_ABONNEMENT_COMPLET.md       # Cette documentation
```

---

## ✅ Checklist de Déploiement

- [ ] Exécuter `SUBSCRIPTION_PLANS_SCHEMA.sql` dans Supabase
- [ ] Vérifier que les 4 plans par défaut sont créés
- [ ] Associer un plan aux groupes scolaires existants
- [ ] Tester la fonction `check_quota_before_creation`
- [ ] Tester la vue `school_groups_with_quotas`
- [ ] Intégrer les composants de quotas dans les formulaires
- [ ] Créer la page de gestion des plans (Super Admin)
- [ ] Ajouter les vérifications de quotas dans les mutations
- [ ] Tester les scénarios de limite atteinte
- [ ] Documenter pour les développeurs

---

## 🎯 Prochaines Étapes

1. **Page Plans** : Interface CRUD complète pour le Super Admin
2. **Intégration formulaires** : Ajouter vérifications dans création école/élève/personnel
3. **Page Abonnements** : Suivi des abonnements actifs
4. **Système de paiement** : Intégration Mobile Money / Carte bancaire
5. **Notifications** : Alertes quand 80% d'un quota est atteint
6. **Historique** : Logs des changements de plan
7. **Analytics** : Tableaux de bord d'utilisation des quotas

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@e-pilot.cg
- 📱 Téléphone : +242 06 XXX XX XX
- 🌐 Documentation : https://docs.e-pilot.cg

---

**Développé avec ❤️ pour E-Pilot Congo 🇨🇬**
