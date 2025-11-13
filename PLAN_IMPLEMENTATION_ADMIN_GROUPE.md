# 📋 Plan d'Implémentation - Espace Admin Groupe

**Date** : 1er novembre 2025

---

## 🎯 Pages à Implémenter

### 1. ✅ Tableau de bord (En cours)
- Filtrer stats par `school_group_id`
- Afficher uniquement SES données
- Quotas du plan

### 2. 🏫 Écoles
- CRUD complet
- Vérification quotas
- Liste filtrée par `school_group_id`

### 3. 👥 Utilisateurs
- CRUD complet
- Génération mot de passe temporaire
- Email automatique
- Filtré par `school_group_id`

### 4. 👨‍🎓 Élèves
- CRUD complet
- Import CSV/Excel
- Matricule auto-généré
- Filtré par écoles du groupe

### 5. 💰 Finances
- Vue SES finances uniquement
- Pas de données globales
- Filtré par `school_group_id`

### 6. 💬 Communication
- Messages dans SON groupe
- Filtré par `school_group_id`

### 7. 📊 Rapports
- Rapports SES données
- Filtré par `school_group_id`

### 8. 📝 Journal d'Activité
- Activités de SON groupe
- Filtré par `school_group_id`

### 9. 🗑️ Corbeille
- Éléments supprimés de SON groupe
- Filtré par `school_group_id`

### 10. ⚙️ Profil
- Modification informations personnelles
- Changement mot de passe
- Pas de modification plan/groupe

---

## 🔧 Modifications Nécessaires

### Hook `useDashboardStats`
```typescript
// Ajouter filtrage par school_group_id
const { user } = useAuth();

// Filtrer toutes les requêtes
.eq('school_group_id', user.schoolGroupId)
```

### Composants à Créer
- `QuotaProgressBar` - Affichage quotas
- `QuotaGuard` - Bloquer si quota atteint
- `PlanBadge` - Badge du plan actuel

---

## 📊 Ordre d'Implémentation

1. **Dashboard** (Priorité 1)
2. **Écoles** (Priorité 1)
3. **Utilisateurs** (Priorité 1)
4. **Élèves** (Priorité 2)
5. **Plan & Quotas** (Priorité 2)
6. **Finances** (Priorité 3)
7. **Communication** (Priorité 3)
8. **Rapports** (Priorité 3)
9. **Journal** (Priorité 3)
10. **Corbeille** (Priorité 3)

---

**Commençons par le Dashboard !** 🚀
