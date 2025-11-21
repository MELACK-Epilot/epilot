# 🗑️ GUIDE - SUPPRIMER UNE ALERTE

**Date:** 21 novembre 2025  
**Widget:** SuperAdminAlertsWidget

---

## 🎯 COMMENT SUPPRIMER UNE ALERTE

### Méthode 1: Masquer Temporairement ✅ (Implémenté)

**Bouton X ajouté** dans chaque alerte pour la masquer temporairement.

**Fonctionnement:**
1. Cliquez sur le bouton **X** (en haut à droite de l'alerte)
2. L'alerte disparaît immédiatement
3. Un toast "Alerte masquée" s'affiche
4. L'alerte reste masquée jusqu'au rafraîchissement de la page

**Code:**
```typescript
const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

const handleDismissAlert = (alertId: string, e: React.MouseEvent) => {
  e.stopPropagation();
  setDismissedAlerts(prev => new Set(prev).add(alertId));
  toast.success('Alerte masquée');
};
```

**Avantages:**
- ✅ Simple et rapide
- ✅ Pas de modification en base de données
- ✅ Réversible (rafraîchir la page)

**Inconvénients:**
- ❌ Temporaire (revient au refresh)
- ❌ Pas persisté entre sessions

---

### Méthode 2: Résoudre le Problème ✅ (Recommandé)

**Les alertes sont générées automatiquement** depuis les données Supabase. Pour supprimer définitivement une alerte, résolvez le problème sous-jacent:

#### A. Abonnement Expirant
**Alerte:** "Abonnement expire dans X jours"

**Solution:**
1. Cliquez sur "Voir les détails"
2. Accédez à la page du groupe scolaire
3. Renouvelez l'abonnement
4. L'alerte disparaîtra automatiquement

**Action en base:**
```sql
UPDATE subscriptions 
SET end_date = end_date + INTERVAL '1 year'
WHERE id = 'subscription_id';
```

#### B. Faible Adoption
**Alerte:** "Faible adoption: XX%"

**Solution:**
1. Contactez le groupe scolaire
2. Formez les utilisateurs
3. Activez plus de modules
4. Quand l'adoption > 50%, l'alerte disparaît

**Calcul:**
```typescript
const adoptionRate = (activeUsers / totalUsers) * 100;
// Alerte si < 50%
```

#### C. Groupe Inactif
**Alerte:** "Groupe inactif depuis X jours"

**Solution:**
1. Contactez le groupe
2. Relancez l'utilisation
3. Quand une activité est détectée, l'alerte disparaît

**Détection:**
```sql
SELECT * FROM school_groups 
WHERE updated_at < NOW() - INTERVAL '30 days';
```

---

### Méthode 3: Masquer Définitivement (À Implémenter)

**Pour masquer définitivement une alerte**, il faudrait créer une table `dismissed_alerts`:

```sql
CREATE TABLE dismissed_alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  alert_type VARCHAR(50),
  entity_id UUID,
  dismissed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Hook modifié:**
```typescript
const { data: alerts } = useSuperAdminAlerts();
const { data: dismissed } = useDismissedAlerts();

// Filtrer les alertes masquées
const visibleAlerts = alerts.filter(a => 
  !dismissed.some(d => 
    d.alert_type === a.type && 
    d.entity_id === a.entity_id
  )
);
```

**Mutation:**
```typescript
const dismissAlert = useMutation({
  mutationFn: async (alert: SuperAdminAlert) => {
    await supabase.from('dismissed_alerts').insert({
      user_id: user.id,
      alert_type: alert.type,
      entity_id: alert.entity_id,
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['super-admin-alerts']);
  },
});
```

---

## 🎨 INTERFACE UTILISATEUR

### Bouton X Ajouté

**Position:** En haut à droite de chaque alerte

**Apparence:**
- Icône: X (croix)
- Couleur: Gris (hover: rouge)
- Taille: 16x16px
- Tooltip: "Masquer cette alerte"

**Comportement:**
- Clic → Alerte disparaît
- Toast → "Alerte masquée"
- Animation: Fade out

---

## 📊 TYPES D'ALERTES

### 1. Abonnement Expirant
- **Type:** `subscription_expiring`
- **Sévérité:** CRITICAL (< 3 jours) ou WARNING (< 7 jours)
- **Action:** Renouveler l'abonnement

### 2. Faible Adoption
- **Type:** `low_adoption`
- **Sévérité:** CRITICAL (< 25%) ou WARNING (< 50%)
- **Action:** Former les utilisateurs

### 3. Groupe Inactif
- **Type:** `inactive_group`
- **Sévérité:** WARNING
- **Action:** Relancer le groupe

### 4. Paiement Échoué
- **Type:** `payment_failed`
- **Sévérité:** CRITICAL
- **Action:** Contacter le groupe

---

## 🔄 CYCLE DE VIE D'UNE ALERTE

```
1. GÉNÉRATION
   ↓
   Données Supabase détectent un problème
   (abonnement expire, adoption < 50%, etc.)
   ↓
2. AFFICHAGE
   ↓
   Alerte apparaît dans le widget
   avec badge de sévérité
   ↓
3. ACTION UTILISATEUR
   ↓
   Option A: Masquer (bouton X)
   → Alerte disparaît temporairement
   
   Option B: Résoudre (bouton "Voir détails")
   → Accès à la page du groupe
   → Résolution du problème
   ↓
4. DISPARITION
   ↓
   Si masquée: Revient au refresh
   Si résolue: Disparaît définitivement
```

---

## ✅ RECOMMANDATIONS

### Pour Masquer Temporairement
```typescript
// Cliquez sur le bouton X
// L'alerte disparaît jusqu'au refresh
```

### Pour Supprimer Définitivement
```typescript
// Résolvez le problème sous-jacent:
1. Abonnement expirant → Renouveler
2. Faible adoption → Former les users
3. Groupe inactif → Relancer
```

### Pour Masquer Définitivement
```typescript
// Nécessite implémentation:
1. Créer table dismissed_alerts
2. Créer hook useDismissedAlerts
3. Créer mutation dismissAlert
4. Filtrer les alertes masquées
```

---

## 🎯 RÉSUMÉ

**Actuellement disponible:**
- ✅ Bouton X pour masquer temporairement
- ✅ Toast de confirmation
- ✅ Filtrage des alertes masquées

**Recommandé:**
- ✅ Résoudre le problème sous-jacent
- ✅ L'alerte disparaîtra automatiquement

**À implémenter (optionnel):**
- ⏳ Table `dismissed_alerts` pour masquage permanent
- ⏳ Persistance entre sessions
- ⏳ Bouton "Tout masquer"

---

**Le bouton X est maintenant disponible dans chaque alerte !** 🎉

Cliquez simplement sur le **X** en haut à droite de l'alerte pour la masquer temporairement.

---

**Guide créé par:** IA Expert UX  
**Date:** 21 novembre 2025  
**Statut:** ✅ FONCTIONNEL
