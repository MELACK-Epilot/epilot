/**
 * SCHÉMA BASE DE DONNÉES - SOCIAL FEED E-PILOT
 * Module de communication et réseau social pour admins
 * République du Congo 🇨🇬
 */

-- =====================================================
-- 1. TABLE PRINCIPALE : POSTS
-- =====================================================

CREATE TABLE IF NOT EXISTS social_feed_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contenu
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('announcement', 'discussion', 'poll', 'event')),
  
  -- Auteur
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(50) NOT NULL,
  author_school_group VARCHAR(255),
  author_avatar TEXT,
  
  -- Métadonnées
  attachments JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_social_feed_posts_author ON social_feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_posts_type ON social_feed_posts(type);
CREATE INDEX IF NOT EXISTS idx_social_feed_posts_created ON social_feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_feed_posts_pinned ON social_feed_posts(is_pinned) WHERE is_pinned = true;

-- Commentaire
COMMENT ON TABLE social_feed_posts IS 'Publications du réseau social (annonces, discussions, sondages, événements)';

-- =====================================================
-- 2. TABLE : RÉACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS social_feed_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  post_id UUID REFERENCES social_feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Type de réaction
  type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'love', 'celebrate', 'support', 'insightful')),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : un user ne peut réagir qu'une fois par type par post
  UNIQUE(post_id, user_id, type)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_social_feed_reactions_post ON social_feed_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_reactions_user ON social_feed_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_reactions_type ON social_feed_reactions(type);

-- Commentaire
COMMENT ON TABLE social_feed_reactions IS 'Réactions aux publications (like, love, celebrate, support, insightful)';

-- =====================================================
-- 3. TABLE : COMMENTAIRES
-- =====================================================

CREATE TABLE IF NOT EXISTS social_feed_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  post_id UUID REFERENCES social_feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Auteur (dénormalisé pour performance)
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  user_avatar TEXT,
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Métadonnées
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_social_feed_comments_post ON social_feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_comments_user ON social_feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_comments_created ON social_feed_comments(created_at DESC);

-- Commentaire
COMMENT ON TABLE social_feed_comments IS 'Commentaires sur les publications';

-- =====================================================
-- 4. TABLE : SONDAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS social_feed_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relation
  post_id UUID REFERENCES social_feed_posts(id) ON DELETE CASCADE UNIQUE,
  
  -- Question
  question TEXT NOT NULL,
  
  -- Options (JSONB pour flexibilité)
  -- Format: [{ "id": "opt1", "text": "Option 1", "votes": 0 }, ...]
  options JSONB NOT NULL,
  
  -- Dates
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_social_feed_polls_post ON social_feed_polls(post_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_polls_ends ON social_feed_polls(ends_at);

-- Commentaire
COMMENT ON TABLE social_feed_polls IS 'Sondages associés aux publications';

-- =====================================================
-- 5. TABLE : VOTES SONDAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS social_feed_poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  poll_id UUID REFERENCES social_feed_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Option choisie
  option_id VARCHAR(50) NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : un user ne peut voter qu'une fois par sondage
  UNIQUE(poll_id, user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_social_feed_poll_votes_poll ON social_feed_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_poll_votes_user ON social_feed_poll_votes(user_id);

-- Commentaire
COMMENT ON TABLE social_feed_poll_votes IS 'Votes des utilisateurs sur les sondages';

-- =====================================================
-- 6. TABLE : ÉVÉNEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS social_feed_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relation
  post_id UUID REFERENCES social_feed_posts(id) ON DELETE CASCADE UNIQUE,
  
  -- Détails événement
  title VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  description TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_social_feed_events_post ON social_feed_events(post_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_events_date ON social_feed_events(date);

-- Commentaire
COMMENT ON TABLE social_feed_events IS 'Événements associés aux publications';

-- =====================================================
-- 7. TABLE : PARTICIPANTS ÉVÉNEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS social_feed_event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  event_id UUID REFERENCES social_feed_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Statut
  status VARCHAR(20) NOT NULL CHECK (status IN ('going', 'interested', 'not_going')) DEFAULT 'interested',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : un user ne peut s'inscrire qu'une fois par événement
  UNIQUE(event_id, user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_social_feed_event_participants_event ON social_feed_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_event_participants_user ON social_feed_event_participants(user_id);

-- Commentaire
COMMENT ON TABLE social_feed_event_participants IS 'Participants aux événements';

-- =====================================================
-- 8. VUE : STATISTIQUES GLOBALES
-- =====================================================

CREATE OR REPLACE VIEW social_feed_stats AS
SELECT
  (SELECT COUNT(*) FROM social_feed_posts) AS total_posts,
  (SELECT COUNT(*) FROM social_feed_comments) AS total_comments,
  (SELECT COUNT(*) FROM social_feed_reactions) AS total_reactions,
  (SELECT COUNT(DISTINCT author_id) FROM social_feed_posts WHERE created_at > NOW() - INTERVAL '7 days') AS active_members;

-- Commentaire
COMMENT ON VIEW social_feed_stats IS 'Statistiques globales du réseau social';

-- =====================================================
-- 9. VUE : POSTS AVEC STATS
-- =====================================================

CREATE OR REPLACE VIEW social_feed_posts_with_stats AS
SELECT
  p.*,
  (SELECT COUNT(*) FROM social_feed_reactions WHERE post_id = p.id) AS reactions_count,
  (SELECT COUNT(*) FROM social_feed_comments WHERE post_id = p.id) AS comments_count,
  (SELECT json_agg(json_build_object('type', type, 'count', count)) 
   FROM (
     SELECT type, COUNT(*) as count 
     FROM social_feed_reactions 
     WHERE post_id = p.id 
     GROUP BY type
   ) reactions_by_type) AS reactions_breakdown
FROM social_feed_posts p;

-- Commentaire
COMMENT ON VIEW social_feed_posts_with_stats IS 'Posts avec statistiques de réactions et commentaires';

-- =====================================================
-- 10. FONCTION : METTRE À JOUR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_social_feed_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour posts
DROP TRIGGER IF EXISTS trigger_update_social_feed_posts_updated_at ON social_feed_posts;
CREATE TRIGGER trigger_update_social_feed_posts_updated_at
  BEFORE UPDATE ON social_feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_feed_updated_at();

-- Commentaire
COMMENT ON FUNCTION update_social_feed_updated_at() IS 'Met à jour automatiquement le champ updated_at';

-- =====================================================
-- 11. FONCTION : INCRÉMENTER VOTES SONDAGE
-- =====================================================

CREATE OR REPLACE FUNCTION increment_poll_vote()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter le compteur de votes pour l'option choisie
  UPDATE social_feed_polls
  SET options = (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'id' = NEW.option_id 
        THEN jsonb_set(elem, '{votes}', to_jsonb((elem->>'votes')::int + 1))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(options) elem
  )
  WHERE id = NEW.poll_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour votes
DROP TRIGGER IF EXISTS trigger_increment_poll_vote ON social_feed_poll_votes;
CREATE TRIGGER trigger_increment_poll_vote
  AFTER INSERT ON social_feed_poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION increment_poll_vote();

-- Commentaire
COMMENT ON FUNCTION increment_poll_vote() IS 'Incrémente automatiquement le compteur de votes du sondage';

-- =====================================================
-- 12. FONCTION : DÉCRÉMENTER VOTES SONDAGE
-- =====================================================

CREATE OR REPLACE FUNCTION decrement_poll_vote()
RETURNS TRIGGER AS $$
BEGIN
  -- Décrémenter le compteur de votes pour l'option
  UPDATE social_feed_polls
  SET options = (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'id' = OLD.option_id 
        THEN jsonb_set(elem, '{votes}', to_jsonb(GREATEST((elem->>'votes')::int - 1, 0)))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(options) elem
  )
  WHERE id = OLD.poll_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour suppression votes
DROP TRIGGER IF EXISTS trigger_decrement_poll_vote ON social_feed_poll_votes;
CREATE TRIGGER trigger_decrement_poll_vote
  AFTER DELETE ON social_feed_poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_poll_vote();

-- Commentaire
COMMENT ON FUNCTION decrement_poll_vote() IS 'Décrémente automatiquement le compteur de votes du sondage';

-- =====================================================
-- 13. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE social_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feed_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feed_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_feed_event_participants ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture publique (tous les admins peuvent voir)
CREATE POLICY "Admins can view all posts" ON social_feed_posts
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

-- Politique : Création (tous les admins peuvent créer)
CREATE POLICY "Admins can create posts" ON social_feed_posts
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

-- Politique : Modification (seulement l'auteur ou super_admin)
CREATE POLICY "Authors and super_admin can update posts" ON social_feed_posts
  FOR UPDATE USING (
    author_id = auth.uid() OR 
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

-- Politique : Suppression (seulement l'auteur ou super_admin)
CREATE POLICY "Authors and super_admin can delete posts" ON social_feed_posts
  FOR DELETE USING (
    author_id = auth.uid() OR 
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

-- Politique : Réactions (lecture publique, création/suppression par user)
CREATE POLICY "Admins can view all reactions" ON social_feed_reactions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Admins can create reactions" ON social_feed_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Users can delete their reactions" ON social_feed_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Politique : Commentaires (lecture publique, création par admins, modification/suppression par auteur)
CREATE POLICY "Admins can view all comments" ON social_feed_comments
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Admins can create comments" ON social_feed_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Authors can update their comments" ON social_feed_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authors and super_admin can delete comments" ON social_feed_comments
  FOR DELETE USING (
    user_id = auth.uid() OR 
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

-- Politique : Sondages (lecture publique, gestion par auteur du post)
CREATE POLICY "Admins can view all polls" ON social_feed_polls
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Post authors can manage polls" ON social_feed_polls
  FOR ALL USING (
    post_id IN (SELECT id FROM social_feed_posts WHERE author_id = auth.uid())
  );

-- Politique : Votes sondages
CREATE POLICY "Admins can view all votes" ON social_feed_poll_votes
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Admins can vote" ON social_feed_poll_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Users can delete their votes" ON social_feed_poll_votes
  FOR DELETE USING (user_id = auth.uid());

-- Politique : Événements
CREATE POLICY "Admins can view all events" ON social_feed_events
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Post authors can manage events" ON social_feed_events
  FOR ALL USING (
    post_id IN (SELECT id FROM social_feed_posts WHERE author_id = auth.uid())
  );

-- Politique : Participants événements
CREATE POLICY "Admins can view all participants" ON social_feed_event_participants
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Admins can register to events" ON social_feed_event_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'admin_groupe'))
  );

CREATE POLICY "Users can update their participation" ON social_feed_event_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can cancel their participation" ON social_feed_event_participants
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 14. DONNÉES DE TEST
-- =====================================================

-- Insérer un post de test (à adapter avec vos IDs users)
-- INSERT INTO social_feed_posts (author_id, author_name, author_role, author_school_group, content, type)
-- VALUES (
--   'votre-user-id',
--   'Super Admin E-Pilot',
--   'Administrateur Système',
--   'E-Pilot Congo',
--   'Bienvenue sur le réseau social E-Pilot ! 🇨🇬',
--   'announcement'
-- );

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================

-- Résumé :
-- ✅ 7 tables créées (posts, reactions, comments, polls, poll_votes, events, event_participants)
-- ✅ 2 vues (stats, posts_with_stats)
-- ✅ 3 fonctions (update_updated_at, increment_poll_vote, decrement_poll_vote)
-- ✅ 3 triggers (update, increment, decrement)
-- ✅ 15+ index pour performance
-- ✅ RLS activé sur toutes les tables
-- ✅ 20+ politiques de sécurité

COMMENT ON SCHEMA public IS 'Schéma Social Feed E-Pilot Congo - Module de communication pour admins';
