-- =====================================================
-- HUB DOCUMENTAIRE SOCIAL - GROUPE SCOLAIRE
-- Description: Système de gestion et partage de documents
-- avec fonctionnalités sociales (commentaires, réactions)
-- =====================================================

-- =====================================================
-- TABLE: group_documents
-- Description: Documents partagés dans le groupe scolaire
-- =====================================================

CREATE TABLE IF NOT EXISTS group_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- NULL = tout le groupe
  
  -- Métadonnées du document
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- Administratif, Pédagogique, Financier, RH, Autre
  tags TEXT[] DEFAULT '{}', -- Array de tags pour recherche
  
  -- Informations du fichier
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Chemin dans Supabase Storage
  file_size INTEGER NOT NULL, -- Taille en bytes
  file_type VARCHAR(100) NOT NULL, -- MIME type
  
  -- Auteur
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Visibilité
  visibility VARCHAR(50) DEFAULT 'group', -- 'group', 'school', 'private'
  is_pinned BOOLEAN DEFAULT false, -- Documents épinglés en haut
  is_archived BOOLEAN DEFAULT false, -- Documents archivés
  
  -- Statistiques
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_category CHECK (category IN ('Administratif', 'Pédagogique', 'Financier', 'RH', 'Technique', 'Autre')),
  CONSTRAINT valid_visibility CHECK (visibility IN ('group', 'school', 'private')),
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800) -- Max 50MB
);

-- =====================================================
-- TABLE: document_comments
-- Description: Commentaires sur les documents
-- =====================================================

CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  document_id UUID NOT NULL REFERENCES group_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE, -- Pour les réponses
  
  -- Contenu
  comment TEXT NOT NULL,
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT comment_not_empty CHECK (LENGTH(TRIM(comment)) > 0),
  CONSTRAINT comment_max_length CHECK (LENGTH(comment) <= 2000)
);

-- =====================================================
-- TABLE: document_reactions
-- Description: Réactions sur les documents (Vu, Important, Utile)
-- =====================================================

CREATE TABLE IF NOT EXISTS document_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  document_id UUID NOT NULL REFERENCES group_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Type de réaction
  reaction_type VARCHAR(50) NOT NULL, -- 'vu', 'important', 'utile', 'like'
  
  -- Date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_reaction_type CHECK (reaction_type IN ('vu', 'important', 'utile', 'like')),
  CONSTRAINT unique_user_reaction UNIQUE(document_id, user_id, reaction_type)
);

-- =====================================================
-- TABLE: document_views
-- Description: Suivi des vues de documents
-- =====================================================

CREATE TABLE IF NOT EXISTS document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  document_id UUID NOT NULL REFERENCES group_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Date
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT unique_user_view UNIQUE(document_id, user_id)
);

-- =====================================================
-- INDEXES pour optimiser les performances
-- =====================================================

-- Documents
CREATE INDEX IF NOT EXISTS idx_group_documents_school_group ON group_documents(school_group_id);
CREATE INDEX IF NOT EXISTS idx_group_documents_school ON group_documents(school_id);
CREATE INDEX IF NOT EXISTS idx_group_documents_uploaded_by ON group_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_group_documents_category ON group_documents(category);
CREATE INDEX IF NOT EXISTS idx_group_documents_created ON group_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_documents_pinned ON group_documents(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_documents_tags ON group_documents USING GIN(tags);

-- Commentaires
CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_comments_user ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent ON document_comments(parent_comment_id);

-- Réactions
CREATE INDEX IF NOT EXISTS idx_document_reactions_document ON document_reactions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reactions_user ON document_reactions(user_id);

-- Vues
CREATE INDEX IF NOT EXISTS idx_document_views_document ON document_views(document_id);
CREATE INDEX IF NOT EXISTS idx_document_views_user ON document_views(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_updated_at
  BEFORE UPDATE ON group_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER trigger_update_comment_updated_at
  BEFORE UPDATE ON document_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();

-- Trigger: Incrémenter views_count
CREATE OR REPLACE FUNCTION increment_document_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_documents
  SET views_count = views_count + 1
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_views
  AFTER INSERT ON document_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_document_views();

-- Trigger: Mettre à jour comments_count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_documents
    SET comments_count = comments_count + 1
    WHERE id = NEW.document_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_documents
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.document_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_count_insert
  AFTER INSERT ON document_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_count();

CREATE TRIGGER trigger_update_comments_count_delete
  AFTER DELETE ON document_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_count();

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

ALTER TABLE group_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_views ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture des documents
-- Les utilisateurs peuvent voir les documents de leur groupe
CREATE POLICY "Users can view group documents"
  ON group_documents
  FOR SELECT
  USING (
    -- Documents du groupe
    (visibility = 'group' AND school_group_id IN (
      SELECT school_group_id FROM users WHERE id = auth.uid()
    ))
    OR
    -- Documents de leur école
    (visibility = 'school' AND school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    ))
    OR
    -- Documents qu'ils ont uploadés
    (uploaded_by = auth.uid())
    OR
    -- Admin de groupe voit tout
    (auth.uid() IN (
      SELECT id FROM users 
      WHERE school_group_id = group_documents.school_group_id
      AND role = 'admin_groupe'
    ))
  );

-- Policy: Création de documents
-- Proviseurs, directeurs, comptables peuvent créer
CREATE POLICY "Authorized users can create documents"
  ON group_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE school_group_id = group_documents.school_group_id
      AND role IN ('admin_groupe', 'proviseur', 'directeur', 'directeur_etudes', 'comptable')
    )
  );

-- Policy: Modification de documents
-- Seul l'auteur ou admin de groupe peut modifier
CREATE POLICY "Authors and admins can update documents"
  ON group_documents
  FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR
    auth.uid() IN (
      SELECT id FROM users 
      WHERE school_group_id = group_documents.school_group_id
      AND role = 'admin_groupe'
    )
  );

-- Policy: Suppression de documents
-- Seul l'auteur ou admin de groupe peut supprimer
CREATE POLICY "Authors and admins can delete documents"
  ON group_documents
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR
    auth.uid() IN (
      SELECT id FROM users 
      WHERE school_group_id = group_documents.school_group_id
      AND role = 'admin_groupe'
    )
  );

-- Policy: Commentaires - Lecture
CREATE POLICY "Users can view comments"
  ON document_comments
  FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM group_documents
      WHERE school_group_id IN (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy: Commentaires - Création
CREATE POLICY "Users can create comments"
  ON document_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND document_id IN (
      SELECT id FROM group_documents
      WHERE school_group_id IN (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy: Commentaires - Modification
CREATE POLICY "Users can update their comments"
  ON document_comments
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Commentaires - Suppression
CREATE POLICY "Users can delete their comments"
  ON document_comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin_groupe'
    )
  );

-- Policy: Réactions - Lecture
CREATE POLICY "Users can view reactions"
  ON document_reactions
  FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM group_documents
      WHERE school_group_id IN (
        SELECT school_group_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy: Réactions - Création
CREATE POLICY "Users can create reactions"
  ON document_reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Réactions - Suppression
CREATE POLICY "Users can delete their reactions"
  ON document_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Policy: Vues - Création
CREATE POLICY "Users can record views"
  ON document_views
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE group_documents IS 'Documents partagés dans le groupe scolaire avec fonctionnalités sociales';
COMMENT ON TABLE document_comments IS 'Commentaires et discussions sur les documents';
COMMENT ON TABLE document_reactions IS 'Réactions des utilisateurs sur les documents (vu, important, utile, like)';
COMMENT ON TABLE document_views IS 'Suivi des vues de documents pour statistiques';

COMMENT ON COLUMN group_documents.visibility IS 'Visibilité: group (tout le groupe), school (une école), private (privé)';
COMMENT ON COLUMN group_documents.is_pinned IS 'Documents épinglés apparaissent en haut du feed';
COMMENT ON COLUMN group_documents.tags IS 'Tags pour faciliter la recherche et le filtrage';
COMMENT ON COLUMN document_comments.parent_comment_id IS 'Pour créer des fils de discussion (réponses aux commentaires)';
