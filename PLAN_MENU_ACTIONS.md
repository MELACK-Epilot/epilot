# 🎯 PLAN FINAL - Menu "Actions"

## ✅ Décision Validée

- **Communication** → Va dans la page **Messagerie** existante
- **Actions** → Nouveau sous-menu dans la sidebar

---

## 📊 Vérification BDD (Cohérence 100%)

### Tables Existantes ✅
1. **`group_documents`** - Hub Documentaire ✅
2. **`resource_requests`** - État des Besoins ✅
3. **`social_feed_posts`** - Réseau des Écoles ✅
4. **`messages`** - Messagerie ✅

### Tables à Créer 🟡
1. **`meeting_requests`** - Demandes de réunion
2. **`file_shares`** - Partage de fichiers (ou utiliser `group_documents`)

---

## 🎨 Structure Finale de la Sidebar

```
📊 Tableau de bord
🏢 Mon Établissement
📚 Mes Modules

▼ 🎯 Actions  ← NOUVEAU
  ├── 📄 Hub Documentaire [3]
  ├── 📋 État des Besoins
  ├── 📤 Partager des Fichiers
  ├── 🌐 Réseau des Écoles
  └── 📅 Demande de Réunion

💬 Messagerie [5]  ← EXISTANT (amélioré)
  └── Contacter Admin
  └── Contacter Écoles
  └── Messages directs

⚙️ Paramètres
```

---

## 📋 Actions à Créer

### 1. Hub Documentaire ✅
- **Table:** `group_documents` ✅
- **Page:** Déjà créée
- **Route:** `/user-space/documents`
- **Statut:** ✅ Terminé

### 2. État des Besoins ✅
- **Table:** `resource_requests` ✅
- **Page:** À créer (migrer du modal)
- **Route:** `/user-space/resource-requests`
- **Statut:** 🟡 À faire

### 3. Partager des Fichiers
- **Table:** `group_documents` (réutiliser)
- **Page:** À créer
- **Route:** `/user-space/share-files`
- **Statut:** 🟡 À faire

### 4. Réseau des Écoles ✅
- **Table:** `social_feed_posts` ✅
- **Page:** À créer
- **Route:** `/user-space/school-network`
- **Statut:** 🟡 À faire

### 5. Demande de Réunion
- **Table:** `meeting_requests` (à créer)
- **Page:** À créer
- **Route:** `/user-space/meeting-requests`
- **Statut:** 🟡 À faire

---

## 💬 Messagerie (Améliorée)

### Page Existante ✅
- **Route:** `/user-space/messages`
- **Composant:** `MessagesPage.tsx`

### Fonctionnalités à Ajouter
1. **Onglet "Contacter Admin"**
   - Formulaire de contact
   - Historique des messages

2. **Onglet "Contacter Écoles"**
   - Liste des écoles
   - Messagerie de groupe

3. **Onglet "Messages Directs"**
   - Chat 1-to-1
   - Notifications

---

## 🚀 Plan d'Implémentation

### Phase 1: Composant Dropdown ✅
```typescript
// Créer SidebarNavItemWithSubmenu.tsx
- Animation dropdown
- État ouvert/fermé
- Indentation sous-items
```

### Phase 2: Pages Actions (5 pages)
1. ✅ **DocumentHubPage** - Déjà fait
2. 🟡 **ResourceRequestsPage** - Migrer modal
3. 🟡 **ShareFilesPage** - Upload et partage
4. 🟡 **SchoolNetworkPage** - Social feed
5. 🟡 **MeetingRequestsPage** - Planification

### Phase 3: Améliorer Messagerie
1. Ajouter onglets
2. Intégrer contact admin
3. Intégrer contact écoles

### Phase 4: Routes & Navigation
1. Ajouter routes dans `userSpaceRoutes.tsx`
2. Mettre à jour sidebar
3. Tester navigation

### Phase 5: Nettoyage
1. Retirer boutons de `EstablishmentPage`
2. Supprimer modals inutilisés
3. Documentation

---

## 📊 Tables BDD à Créer

### meeting_requests
```sql
CREATE TABLE meeting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_group_id UUID NOT NULL REFERENCES school_groups(id),
  school_id UUID REFERENCES schools(id),
  requested_by UUID NOT NULL REFERENCES users(id),
  meeting_type VARCHAR(50) NOT NULL, -- 'admin', 'schools', 'internal'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  proposed_dates JSONB, -- Array de dates proposées
  selected_date TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  meeting_link VARCHAR(500), -- Pour visio
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed
  participants JSONB, -- Array d'IDs participants
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ Checklist

### Composants
- [ ] SidebarNavItemWithSubmenu.tsx
- [ ] Modifier SidebarNav.tsx
- [ ] Modifier types.ts

### Pages
- [x] DocumentHubPage (déjà fait)
- [ ] ResourceRequestsPage
- [ ] ShareFilesPage
- [ ] SchoolNetworkPage
- [ ] MeetingRequestsPage

### BDD
- [x] group_documents (existe)
- [x] resource_requests (existe)
- [x] social_feed_posts (existe)
- [ ] meeting_requests (à créer)

### Routes
- [ ] Ajouter 5 routes
- [ ] Tester navigation
- [ ] Permissions par rôle

### Messagerie
- [ ] Ajouter onglets
- [ ] Contact admin
- [ ] Contact écoles

### Nettoyage
- [ ] Retirer boutons EstablishmentPage
- [ ] Supprimer modals
- [ ] Documentation

---

## 🎯 Prochaine Étape

**Veux-tu que je commence par:**
1. ✅ Créer le composant dropdown
2. ✅ Créer les 5 pages
3. ✅ Créer la table meeting_requests
4. ✅ Tout en même temps

**Dis-moi et je commence!** 🚀
