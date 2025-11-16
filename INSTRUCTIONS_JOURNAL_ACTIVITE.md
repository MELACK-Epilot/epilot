# 📋 Instructions - Page Journal d'Activité

## ✅ CE QUI A ÉTÉ FAIT

### 1. Page Complète Créée
- ✅ `ActivityLogsPageReal.tsx` - Page moderne et professionnelle
- ✅ Design avec gradient et cartes stylées
- ✅ Statistiques en temps réel
- ✅ Filtres avancés (recherche, action, entité)
- ✅ Export CSV
- ✅ Affichage détaillé des logs

### 2. Route Configurée
- ✅ Route `/user/activity-logs` ajoutée dans `App.tsx`
- ✅ Protection par rôle (proviseur, directeur, directeur_etudes)
- ✅ Navigation configurée dans `NavigationContext.tsx`

### 3. Fichiers SQL Créés
- ✅ `create_activity_logs_table.sql` - Création de la table
- ✅ `seed_activity_logs.sql` - Données de test

---

## 🚀 ÉTAPES POUR ACTIVER LA PAGE

### Étape 1 : Créer la table dans Supabase

1. **Ouvre Supabase SQL Editor**
2. **Copie le contenu de** `supabase/migrations/create_activity_logs_table.sql`
3. **Exécute le script** (bouton RUN)
4. **Vérifie** que la table `activity_logs` est créée

### Étape 2 : Insérer des données de test

1. **Dans Supabase SQL Editor**
2. **Copie le contenu de** `supabase/migrations/seed_activity_logs.sql`
3. **Exécute le script** (bouton RUN)
4. **Vérifie** qu'il y a des données dans la table

### Étape 3 : Tester la page

1. **Connecte-toi** en tant que Proviseur/Directeur
2. **Va sur** `/user/activity-logs`
3. **Tu devrais voir** :
   - Statistiques (Total, Aujourd'hui, Cette semaine, Utilisateurs actifs)
   - Liste des logs avec détails
   - Filtres fonctionnels
   - Bouton Export CSV

---

## 📊 STRUCTURE DE LA TABLE

```sql
activity_logs
├── id (UUID)
├── user_id (UUID) → users.id
├── action (TEXT) - create, update, delete, view, export, login, etc.
├── entity (TEXT) - user, student, class, grade, payment, document, etc.
├── entity_id (UUID) - ID de l'entité concernée
├── details (TEXT) - Description de l'action
├── ip_address (TEXT) - Adresse IP
├── user_agent (TEXT) - Navigateur
├── timestamp (TIMESTAMPTZ) - Date/heure de l'action
└── created_at (TIMESTAMPTZ) - Date de création
```

---

## 🎨 FONCTIONNALITÉS DE LA PAGE

### Statistiques
- **Total Actions** : Nombre total de logs
- **Aujourd'hui** : Logs du jour
- **Cette Semaine** : Logs des 7 derniers jours
- **Utilisateurs Actifs** : Nombre d'utilisateurs uniques

### Filtres
- **Recherche** : Par utilisateur, action ou détails
- **Action** : create, update, delete, view, export
- **Entité** : user, student, class, grade, payment

### Affichage des Logs
Chaque log affiche :
- Avatar utilisateur avec icône d'action
- Nom et rôle de l'utilisateur
- Type d'action (badge coloré)
- Entité concernée
- Détails de l'action
- Date/heure (format français)
- Adresse IP
- ID de l'entité

### Export
- Export CSV avec toutes les colonnes
- Nom de fichier : `journal-activite-YYYY-MM-DD.csv`

---

## 🔧 PERSONNALISATION

### Ajouter de nouveaux types d'actions

Dans `ActivityLogsPageReal.tsx`, modifie `ACTION_CONFIG` :

```typescript
const ACTION_CONFIG = {
  // Ajoute tes actions ici
  mon_action: { 
    icon: MonIcon, 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    label: 'Mon Action' 
  },
};
```

### Modifier les filtres

Dans le composant, section filtres :

```typescript
<SelectItem value="ma_nouvelle_entite">Ma Nouvelle Entité</SelectItem>
```

---

## 📝 ENREGISTRER DES LOGS AUTOMATIQUEMENT

Pour enregistrer automatiquement les actions des utilisateurs, utilise le système d'audit :

```typescript
import { AuditTrail, AuditAction } from '@/lib/security/auditTrail';

// Exemple : Enregistrer une création
await AuditTrail.logSuccess(
  userId,
  AuditAction.SCHOOL_CREATE,
  {
    resource: 'schools',
    resourceId: school.id,
    metadata: { schoolName: school.name }
  }
);
```

Ou directement dans Supabase :

```sql
INSERT INTO activity_logs (user_id, action, entity, entity_id, details, ip_address)
VALUES (
  'user-uuid',
  'create',
  'student',
  'student-uuid',
  'Création d''un nouvel élève',
  '192.168.1.1'
);
```

---

## 🎯 PROCHAINES ÉTAPES

### Améliorations Possibles

1. **Filtres Avancés**
   - Filtre par date (date picker)
   - Filtre par utilisateur spécifique
   - Filtre par sévérité

2. **Export Avancé**
   - Export PDF avec mise en forme
   - Export Excel avec graphiques
   - Planification d'exports automatiques

3. **Visualisations**
   - Graphiques d'activité par jour
   - Top utilisateurs les plus actifs
   - Répartition par type d'action

4. **Notifications**
   - Alertes sur actions critiques
   - Résumé quotidien par email
   - Notifications temps réel

5. **Recherche Avancée**
   - Recherche full-text
   - Recherche par plage de dates
   - Recherche par IP

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de dire que c'est terminé, vérifie :

- [ ] La table `activity_logs` existe dans Supabase
- [ ] Il y a des données de test dans la table
- [ ] La page `/user/activity-logs` est accessible
- [ ] Les statistiques s'affichent correctement
- [ ] Les filtres fonctionnent
- [ ] L'export CSV fonctionne
- [ ] Le design est professionnel
- [ ] Les données sont en temps réel
- [ ] Les permissions RLS sont configurées
- [ ] La navigation fonctionne (lien dans le menu)

---

## 🐛 DÉPANNAGE

### La page est vide
→ Vérifie que la table `activity_logs` existe et contient des données

### Erreur "Cannot read property 'map'"
→ Le hook `useActivityLogs` ne retourne pas de données
→ Vérifie les permissions RLS dans Supabase

### Les filtres ne fonctionnent pas
→ Vérifie que le hook `useActivityLogs` accepte les filtres
→ Vérifie la console pour les erreurs

### L'export CSV ne fonctionne pas
→ Vérifie que `filteredLogs` contient des données
→ Vérifie la console pour les erreurs

---

**Date** : 16 novembre 2025  
**Statut** : Page créée, en attente de la création de la table Supabase  
**Prochaine étape** : Exécuter les scripts SQL dans Supabase
