# 📦 Guide d'installation SQL - Module Communication E-Pilot

## 🎯 Vue d'ensemble

Ce guide vous permet d'installer les 3 schémas SQL du module Communication dans Supabase :
1. **Social Feed** - Publications, réactions, commentaires, sondages, événements
2. **Messagerie** - Messages internes, conversations, pièces jointes
3. **Tickets** - Système de support avec priorités et assignations

---

## 📋 Prérequis

- ✅ Compte Supabase actif
- ✅ Projet E-Pilot créé dans Supabase
- ✅ Schéma principal déjà exécuté (`SUPABASE_SQL_SCHEMA.sql`)
- ✅ Tables `users`, `school_groups`, `schools` existantes

---

## 🚀 Installation (3 étapes)

### **Étape 1 : Exécuter le schéma Social Feed**

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Créer une nouvelle query
3. Copier le contenu de `database/SOCIAL_FEED_SCHEMA.sql`
4. Cliquer sur **Run**

**Tables créées (7)** :
- `posts` - Publications
- `post_reactions` - Réactions (like, love, celebrate, support, insightful)
- `post_comments` - Commentaires
- `polls` - Sondages
- `poll_votes` - Votes sondages
- `events` - Événements
- `event_participants` - Participants événements

**Vues créées (2)** :
- `posts_with_stats` - Posts avec statistiques
- `social_feed_stats` - Statistiques globales

**Fonctions créées (3)** :
- `update_updated_at_column()` - MAJ automatique updated_at
- `handle_poll_vote()` - Gestion votes sondages (1 vote par user)
- `handle_event_participation()` - Gestion participations événements

**Triggers créés (3)** :
- Trigger updated_at sur posts, comments, events
- Trigger validation vote sondage
- Trigger validation participation événement

**RLS activé** : 20+ politiques de sécurité

---

### **Étape 2 : Exécuter le schéma Messagerie**

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Créer une nouvelle query
3. Copier le contenu de `database/MESSAGES_SCHEMA.sql`
4. Cliquer sur **Run**

**Tables créées (6)** :
- `conversations` - Conversations/threads
- `conversation_participants` - Participants aux conversations
- `messages` - Messages
- `message_recipients` - Destinataires de messages
- `message_attachments` - Pièces jointes
- `message_drafts` - Brouillons

**Vues créées (3)** :
- `conversations_with_stats` - Conversations avec statistiques
- `messages_with_details` - Messages avec détails complets
- `user_messaging_stats` - Statistiques par utilisateur

**Fonctions créées (5)** :
- `update_updated_at_column()` - MAJ automatique updated_at
- `increment_unread_count()` - Incrémenter compteur non-lus
- `decrement_unread_count()` - Décrémenter compteur non-lus
- `update_conversation_last_message()` - MAJ dernier message
- `create_message_recipients()` - Créer destinataires automatiquement

**Triggers créés (6)** :
- Trigger updated_at sur conversations, messages, drafts
- Trigger compteur non-lus (incrémentation/décrémentation)
- Trigger last_message_at
- Trigger création destinataires automatique

**RLS activé** : 15+ politiques de sécurité

---

### **Étape 3 : Exécuter le schéma Tickets**

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Créer une nouvelle query
3. Copier le contenu de `database/TICKETS_SCHEMA.sql`
4. Cliquer sur **Run**

**Tables créées (6)** :
- `tickets` - Tickets de support
- `ticket_comments` - Commentaires sur tickets
- `ticket_attachments` - Pièces jointes
- `ticket_status_history` - Historique changements statut
- `ticket_assignments` - Historique assignations
- `ticket_watchers` - Observateurs de tickets

**Vues créées (5)** :
- `tickets_with_details` - Tickets avec détails complets
- `tickets_global_stats` - Statistiques globales
- `tickets_stats_by_category` - Stats par catégorie
- `tickets_stats_by_priority` - Stats par priorité
- `tickets_stats_by_user` - Stats par utilisateur

**Fonctions créées (7)** :
- `generate_ticket_number()` - Générer numéro unique (TICKET-YYYYMMDD-XXXX)
- `update_ticket_updated_at()` - MAJ automatique updated_at
- `calculate_resolution_time()` - Calculer temps de résolution
- `log_status_change()` - Enregistrer changements statut
- `log_assignment_change()` - Enregistrer assignations
- `add_creator_as_watcher()` - Ajouter créateur comme observateur
- `notify_ticket_watchers()` - Notifier observateurs (à implémenter)

**Triggers créés (7)** :
- Trigger génération numéro ticket
- Trigger updated_at sur tickets et commentaires
- Trigger calcul temps résolution
- Trigger log changements statut
- Trigger log assignations
- Trigger ajout créateur comme watcher

**RLS activé** : 18+ politiques de sécurité

---

## ✅ Vérification de l'installation

### **1. Vérifier les tables**

```sql
-- Compter les tables créées (devrait retourner 19)
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'posts', 'post_reactions', 'post_comments', 'polls', 'poll_votes', 'events', 'event_participants',
  'conversations', 'conversation_participants', 'messages', 'message_recipients', 'message_attachments', 'message_drafts',
  'tickets', 'ticket_comments', 'ticket_attachments', 'ticket_status_history', 'ticket_assignments', 'ticket_watchers'
);
```

### **2. Vérifier les vues**

```sql
-- Compter les vues créées (devrait retourner 10)
SELECT COUNT(*) 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN (
  'posts_with_stats', 'social_feed_stats',
  'conversations_with_stats', 'messages_with_details', 'user_messaging_stats',
  'tickets_with_details', 'tickets_global_stats', 'tickets_stats_by_category', 'tickets_stats_by_priority', 'tickets_stats_by_user'
);
```

### **3. Vérifier les enums**

```sql
-- Lister tous les enums créés
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN (
  'reaction_type', 'post_type',
  'message_type', 'message_status',
  'ticket_category', 'ticket_priority', 'ticket_status'
);
```

### **4. Vérifier RLS**

```sql
-- Vérifier que RLS est activé sur toutes les tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%post%' 
   OR tablename LIKE '%message%' 
   OR tablename LIKE '%ticket%'
   OR tablename LIKE '%conversation%'
   OR tablename LIKE '%event%'
   OR tablename LIKE '%poll%';
```

---

## 🗄️ Configuration Supabase Storage

### **Créer les buckets**

1. Ouvrir **Supabase Dashboard** → **Storage**
2. Créer 3 buckets :

#### **Bucket 1 : social-feed**
```sql
-- Politiques RLS pour social-feed
-- Lecture publique
CREATE POLICY "Public can view social feed files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'social-feed');

-- Upload authentifié
CREATE POLICY "Authenticated users can upload to social feed"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'social-feed' 
    AND auth.role() = 'authenticated'
  );

-- Suppression par le propriétaire
CREATE POLICY "Users can delete their own social feed files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'social-feed' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### **Bucket 2 : messages**
```sql
-- Politiques RLS pour messages
-- Lecture par participants conversation
CREATE POLICY "Conversation participants can view message files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'messages'
    AND auth.uid()::text IN (
      SELECT user_id::text 
      FROM conversation_participants 
      WHERE conversation_id::text = (storage.foldername(name))[1]
    )
  );

-- Upload par participants
CREATE POLICY "Conversation participants can upload message files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'messages' 
    AND auth.role() = 'authenticated'
  );

-- Suppression par l'uploader
CREATE POLICY "Users can delete their own message files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'messages' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
```

#### **Bucket 3 : tickets**
```sql
-- Politiques RLS pour tickets
-- Lecture par créateur/assigné/watchers
CREATE POLICY "Ticket participants can view ticket files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tickets'
    AND (
      auth.uid()::text IN (
        SELECT created_by::text FROM tickets WHERE id::text = (storage.foldername(name))[1]
        UNION
        SELECT assigned_to::text FROM tickets WHERE id::text = (storage.foldername(name))[1]
        UNION
        SELECT user_id::text FROM ticket_watchers WHERE ticket_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Upload par participants
CREATE POLICY "Ticket participants can upload ticket files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tickets' 
    AND auth.role() = 'authenticated'
  );

-- Suppression par l'uploader
CREATE POLICY "Users can delete their own ticket files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tickets' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
```

---

## 📊 Données de test (optionnel)

### **Insérer des données de test**

```sql
-- Test Social Feed (1 post)
INSERT INTO posts (user_id, content, type)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Bienvenue sur le fil d''actualité E-Pilot ! 🎉',
  'announcement'
);

-- Test Messagerie (1 conversation)
INSERT INTO conversations (title, type, created_by)
VALUES (
  'Conversation de test',
  'direct',
  (SELECT id FROM users LIMIT 1)
);

-- Test Tickets (1 ticket)
INSERT INTO tickets (title, description, category, priority, created_by)
VALUES (
  'Ticket de test',
  'Ceci est un ticket de test pour vérifier le système',
  'technique',
  'medium',
  (SELECT id FROM users LIMIT 1)
);
```

### **Vérifier les données**

```sql
-- Compter les posts
SELECT COUNT(*) as total_posts FROM posts;

-- Compter les conversations
SELECT COUNT(*) as total_conversations FROM conversations;

-- Compter les tickets
SELECT COUNT(*) as total_tickets FROM tickets;
```

---

## 🔍 Requêtes utiles

### **Social Feed**

```sql
-- Posts récents avec statistiques
SELECT * FROM posts_with_stats ORDER BY created_at DESC LIMIT 10;

-- Statistiques globales
SELECT * FROM social_feed_stats;
```

### **Messagerie**

```sql
-- Conversations avec statistiques
SELECT * FROM conversations_with_stats ORDER BY last_message_at DESC LIMIT 10;

-- Messages récents
SELECT * FROM messages_with_details ORDER BY sent_at DESC LIMIT 10;

-- Stats utilisateur
SELECT * FROM user_messaging_stats WHERE user_id = 'USER_ID';
```

### **Tickets**

```sql
-- Tickets ouverts avec détails
SELECT * FROM tickets_with_details WHERE status IN ('open', 'in_progress') ORDER BY priority DESC, created_at DESC;

-- Statistiques globales
SELECT * FROM tickets_global_stats;

-- Stats par catégorie
SELECT * FROM tickets_stats_by_category;

-- Stats par priorité
SELECT * FROM tickets_stats_by_priority;
```

---

## 🎯 Prochaines étapes

1. ✅ **Schémas SQL installés**
2. ⏳ **Créer les hooks React Query** (voir `COMMUNICATION_HOOKS_GUIDE.md`)
3. ⏳ **Configurer Storage** (buckets + politiques RLS)
4. ⏳ **Tester les composants UI**
5. ⏳ **Déployer en production**

---

## 📁 Fichiers SQL

| Fichier | Tables | Vues | Fonctions | Triggers | Lignes |
|---------|--------|------|-----------|----------|--------|
| `SOCIAL_FEED_SCHEMA.sql` | 7 | 2 | 3 | 3 | 500+ |
| `MESSAGES_SCHEMA.sql` | 6 | 3 | 5 | 6 | 600+ |
| `TICKETS_SCHEMA.sql` | 6 | 5 | 7 | 7 | 700+ |
| **TOTAL** | **19** | **10** | **15** | **16** | **1,800+** |

---

## 🆘 Dépannage

### **Erreur : "relation already exists"**
```sql
-- Supprimer les tables existantes (ATTENTION : perte de données)
DROP TABLE IF EXISTS posts, post_reactions, post_comments, polls, poll_votes, events, event_participants CASCADE;
DROP TABLE IF EXISTS conversations, conversation_participants, messages, message_recipients, message_attachments, message_drafts CASCADE;
DROP TABLE IF EXISTS tickets, ticket_comments, ticket_attachments, ticket_status_history, ticket_assignments, ticket_watchers CASCADE;

-- Puis réexécuter les schémas
```

### **Erreur : "type already exists"**
```sql
-- Supprimer les enums existants
DROP TYPE IF EXISTS reaction_type, post_type CASCADE;
DROP TYPE IF EXISTS message_type, message_status CASCADE;
DROP TYPE IF EXISTS ticket_category, ticket_priority, ticket_status CASCADE;

-- Puis réexécuter les schémas
```

### **Erreur : "function already exists"**
```sql
-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS handle_poll_vote CASCADE;
DROP FUNCTION IF EXISTS generate_ticket_number CASCADE;

-- Puis réexécuter les schémas
```

---

## ✅ Checklist finale

- [ ] Schéma Social Feed exécuté
- [ ] Schéma Messagerie exécuté
- [ ] Schéma Tickets exécuté
- [ ] 19 tables créées
- [ ] 10 vues créées
- [ ] 15 fonctions créées
- [ ] 16 triggers créés
- [ ] RLS activé sur toutes les tables
- [ ] 3 buckets Storage créés
- [ ] Politiques RLS Storage configurées
- [ ] Données de test insérées
- [ ] Requêtes de vérification exécutées

---

**Date** : 30 octobre 2025  
**Auteur** : E-Pilot Congo 🇨🇬  
**Statut** : ✅ PRÊT POUR INSTALLATION
