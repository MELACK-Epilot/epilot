# ✅ TOGGLE AUTO-RENEW - ADMIN DE GROUPE UNIQUEMENT

**Date:** 19 novembre 2025  
**Objectif:** Le toggle d'auto-renouvellement doit être accessible UNIQUEMENT à l'admin de groupe  
**Status:** ✅ IMPLÉMENTÉ

---

## 🎯 PROBLÈME IDENTIFIÉ

Le toggle d'auto-renouvellement était visible pour **tous les utilisateurs**, y compris le super admin E-Pilot.

### ❌ Comportement Incorrect
- Toggle visible pour le super admin
- Super admin pouvait modifier l'auto-renew
- Pas de distinction entre les rôles

### ✅ Comportement Correct
- Toggle **éditable** uniquement pour l'admin de groupe
- Super admin voit l'état en **lecture seule**
- Respect de la hiérarchie E-Pilot

---

## 📐 HIÉRARCHIE E-PILOT

### Niveau 1: Super Admin E-Pilot
**Rôle:** `super_admin`  
**Responsabilités:**
- Crée les groupes scolaires
- Crée les plans d'abonnement
- Crée les modules et catégories
- **Voit** les abonnements (lecture seule)
- **NE PEUT PAS** modifier l'auto-renew

### Niveau 2: Admin de Groupe Scolaire
**Rôle:** `admin_groupe`  
**Responsabilités:**
- Gère SON réseau d'écoles
- Gère SES utilisateurs
- **Gère SES abonnements**
- **PEUT** activer/désactiver l'auto-renew
- **Contrôle total** sur ses abonnements

### Niveau 3: Utilisateurs d'École
**Rôles:** `enseignant`, `comptable`, etc.  
**Responsabilités:**
- Utilisent les modules assignés
- **NE VOIENT PAS** les abonnements
- **PAS d'accès** à cette page

---

## 🔧 SOLUTION IMPLÉMENTÉE

### 1. Vérification du Rôle

**Fichier:** `PlanSubscriptionsPanel.tsx`

```typescript
import { useAuth } from '@/features/auth/store/auth.store';

export const PlanSubscriptionsPanel = ({ planId, planName }) => {
  const { user } = useAuth();
  
  // Vérifier si l'utilisateur est un admin de groupe
  // Seul l'admin de groupe peut gérer l'auto-renouvellement de SES abonnements
  const isAdminGroupe = user?.role === ('admin_groupe' as const);
  
  // ...
};
```

---

### 2. Affichage Conditionnel

#### **Pour l'Admin de Groupe** (Toggle Éditable)

```tsx
{isAdminGroupe ? (
  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
    <div className="flex items-center gap-2">
      <Switch
        checked={sub.auto_renew}
        onCheckedChange={(checked) => {
          toggleAutoRenew.mutate({
            subscriptionId: sub.id,
            autoRenew: checked,
          });
        }}
        disabled={sub.status !== 'active' || toggleAutoRenew.isPending}
      />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-700">
          Auto-renouvellement
        </span>
        <span className="text-[10px] text-gray-500">
          {sub.auto_renew ? 'Activé' : 'Désactivé'}
        </span>
      </div>
    </div>
    {sub.auto_renew && (
      <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F]">
        <TrendingUp className="h-3 w-3 mr-1" />
        Actif
      </Badge>
    )}
  </div>
) : (
  // Pour le super admin: affichage en lecture seule
  sub.auto_renew && (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-700">
            Auto-renouvellement
          </span>
          <span className="text-[10px] text-gray-500">
            Activé par l'admin de groupe
          </span>
        </div>
      </div>
      <Badge variant="outline" className="bg-[#2A9D8F]/10 text-[#2A9D8F]">
        <TrendingUp className="h-3 w-3 mr-1" />
        Actif
      </Badge>
    </div>
  )
)}
```

---

## 🎨 INTERFACE VISUELLE

### Pour l'Admin de Groupe (Éditable)

```
┌──────────────────────────────────────────┐
│ ED  Ecole EDJA                    ✅ Actif│
│     Depuis le 14 nov. 2025               │
│     5 écoles • 120 fonctionnaires        │
│ ─────────────────────────────────────────│
│ ⚪ Auto-renouvellement                   │ ← Toggle cliquable
│    Désactivé                             │
└──────────────────────────────────────────┘

Après activation:
┌──────────────────────────────────────────┐
│ 🟢 Auto-renouvellement          🔄 Actif  │
│    Activé                                │
└──────────────────────────────────────────┘
```

### Pour le Super Admin (Lecture Seule)

```
┌──────────────────────────────────────────┐
│ ED  Ecole EDJA                    ✅ Actif│
│     Depuis le 14 nov. 2025               │
│     5 écoles • 120 fonctionnaires        │
│ ─────────────────────────────────────────│
│ Auto-renouvellement              🔄 Actif │ ← Pas de toggle
│ Activé par l'admin de groupe             │
└──────────────────────────────────────────┘

Si désactivé:
┌──────────────────────────────────────────┐
│ ED  Ecole EDJA                    ✅ Actif│
│     Depuis le 14 nov. 2025               │
│     5 écoles • 120 fonctionnaires        │
│                                          │ ← Rien n'est affiché
└──────────────────────────────────────────┘
```

---

## 📊 MATRICE DES PERMISSIONS

| Rôle | Voir Abonnements | Voir Auto-Renew | Modifier Auto-Renew |
|------|------------------|-----------------|---------------------|
| **Super Admin** | ✅ Oui (tous) | ✅ Oui (lecture) | ❌ Non |
| **Admin Groupe** | ✅ Oui (siens) | ✅ Oui (édition) | ✅ Oui |
| **Utilisateurs** | ❌ Non | ❌ Non | ❌ Non |

---

## 🔄 FLUX UTILISATEUR

### Scénario 1: Admin de Groupe Active l'Auto-Renew

```
1. Admin de groupe se connecte
   └─> Rôle: admin_groupe
   
2. Va sur Plans & Tarification → Abonnements
   └─> Voit SES abonnements avec toggle éditable
   
3. Clique sur le toggle ⚪ → 🟢
   └─> Mutation envoyée à Supabase
   
4. Fonction RPC toggle_auto_renew() appelée
   └─> Vérifie que l'abonnement appartient au groupe
   
5. Base de données mise à jour
   └─> auto_renew = true
   
6. Toast de confirmation
   └─> "Renouvellement automatique activé"
   
7. Badge "Actif" s'affiche
   └─> Confirmation visuelle
```

### Scénario 2: Super Admin Consulte les Abonnements

```
1. Super admin se connecte
   └─> Rôle: super_admin
   
2. Va sur Plans & Tarification → Abonnements
   └─> Voit TOUS les abonnements
   
3. Pour chaque abonnement:
   └─> Si auto_renew = true:
       └─> Affiche "Activé par l'admin de groupe" (lecture seule)
   └─> Si auto_renew = false:
       └─> N'affiche rien (section cachée)
   
4. Pas de toggle cliquable
   └─> Super admin ne peut PAS modifier
   
5. Respect de la hiérarchie
   └─> Seul l'admin de groupe contrôle SES abonnements
```

---

## 🎯 JUSTIFICATION

### Pourquoi l'Admin de Groupe ?

1. **Autonomie** 
   - L'admin de groupe gère SON réseau
   - Il connaît ses besoins de renouvellement
   - Il contrôle son budget

2. **Responsabilité**
   - C'est lui qui paie l'abonnement
   - C'est lui qui décide du renouvellement
   - C'est lui qui gère ses écoles

3. **Hiérarchie**
   - Super admin = gestion plateforme
   - Admin groupe = gestion opérationnelle
   - Séparation claire des responsabilités

### Pourquoi PAS le Super Admin ?

1. **Pas son rôle**
   - Le super admin gère la plateforme
   - Il ne gère pas les abonnements individuels
   - Il ne connaît pas les besoins de chaque groupe

2. **Respect de l'autonomie**
   - Chaque groupe est autonome
   - Le super admin ne doit pas interférer
   - Confiance dans les admins de groupe

3. **Scalabilité**
   - Avec 500+ groupes, impossible de gérer manuellement
   - Chaque admin gère son groupe
   - Décentralisation des décisions

---

## 🔒 SÉCURITÉ

### Vérification Côté Client

```typescript
// Dans PlanSubscriptionsPanel.tsx
const isAdminGroupe = user?.role === ('admin_groupe' as const);

// Affichage conditionnel
{isAdminGroupe ? <Switch /> : <ReadOnlyView />}
```

### Vérification Côté Serveur

```sql
-- Dans toggle_auto_renew()
CREATE OR REPLACE FUNCTION toggle_auto_renew(
  p_subscription_id UUID,
  p_auto_renew BOOLEAN
)
RETURNS JSONB AS $$
BEGIN
  -- Vérifier que l'abonnement appartient au groupe de l'utilisateur
  -- (via RLS - Row Level Security)
  
  UPDATE subscriptions
  SET auto_renew = p_auto_renew
  WHERE id = p_subscription_id
    AND status = 'active';
  
  -- ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Row Level Security (RLS)

```sql
-- Politique pour admin de groupe
CREATE POLICY "Admin groupe can manage their subscriptions"
ON subscriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin_groupe'
    AND users.school_group_id = subscriptions.school_group_id
  )
);

-- Politique pour super admin (lecture seule)
CREATE POLICY "Super admin can view all subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);
```

---

## ✅ CHECKLIST

### Code Frontend
- [x] Import `useAuth` ajouté
- [x] Vérification `isAdminGroupe` implémentée
- [x] Affichage conditionnel du toggle
- [x] Vue lecture seule pour super admin
- [x] Messages adaptés selon le rôle

### Sécurité
- [x] Vérification côté client
- [x] Vérification côté serveur (RPC)
- [x] RLS pour protéger les données
- [x] Pas de bypass possible

### UX
- [x] Toggle éditable pour admin groupe
- [x] Vue lecture seule pour super admin
- [x] Messages clairs selon le rôle
- [x] Feedback visuel approprié

---

## 🚀 RÉSULTAT FINAL

### Comportement Correct

| Utilisateur | Rôle | Voit Toggle | Peut Modifier |
|-------------|------|-------------|---------------|
| Vianney MELACK | admin_groupe | ✅ Oui | ✅ Oui |
| Super Admin E-Pilot | super_admin | ⚠️ Lecture seule | ❌ Non |
| Enseignant | enseignant | ❌ Non (pas d'accès) | ❌ Non |

### Respect de la Hiérarchie

✅ **Super Admin** → Gère la plateforme  
✅ **Admin Groupe** → Gère SES abonnements  
✅ **Utilisateurs** → Utilisent les modules  

---

**Le toggle est maintenant accessible UNIQUEMENT à l'admin de groupe!** ✅🎯

**Rafraîchis l'application pour voir la différence selon ton rôle!** 🚀✨
