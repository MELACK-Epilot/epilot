-- =====================================================
-- PHASE 3 - PARTIE 1 : TABLES DE FACTURATION
-- Tables: invoices, invoice_items
-- Création: 6 novembre 2025
-- =====================================================

-- Table des factures
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    school_group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,

    -- Informations de facturation
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE NULL,

    -- Montants
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),

    -- Statuts
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),

    -- Période facturée
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Métadonnées
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT valid_dates CHECK (due_date >= invoice_date),
    CONSTRAINT valid_period CHECK (period_end >= period_start),
    CONSTRAINT valid_amounts CHECK (total_amount = subtotal + tax_amount - discount_amount)
);

-- Table des éléments de facture
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Description de l'élément
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),

    -- Référence (optionnel)
    reference_type VARCHAR(50), -- 'subscription', 'module', 'service', etc.
    reference_id UUID,

    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT valid_total CHECK (total_price = quantity * unit_price)
);

-- =====================================================
-- INDEXES POUR PERFORMANCES
-- =====================================================

-- Index sur invoice_number pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Index sur statut pour filtrage
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Index sur school_group_id pour filtrage par groupe
CREATE INDEX IF NOT EXISTS idx_invoices_school_group ON invoices(school_group_id);

-- Index sur dates pour recherche temporelle
CREATE INDEX IF NOT EXISTS idx_invoices_dates ON invoices(invoice_date, due_date, paid_date);

-- Index composite pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_invoices_group_status ON invoices(school_group_id, status);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer le numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    next_number INTEGER;
BEGIN
    -- Obtenir le prochain numéro pour l'année en cours
    SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 2) AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE current_year || '-%';

    -- Retourner le numéro formaté (YYYY-NNNN)
    RETURN current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le total d'une facture
CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    subtotal DECIMAL(12,2) := 0;
    tax_rate DECIMAL(5,2);
    discount_amount DECIMAL(12,2);
    total DECIMAL(12,2);
BEGIN
    -- Calculer le sous-total depuis les éléments
    SELECT COALESCE(SUM(total_price), 0)
    INTO subtotal
    FROM invoice_items
    WHERE invoice_id = invoice_uuid;

    -- Récupérer les autres montants
    SELECT i.tax_rate, i.discount_amount
    INTO tax_rate, discount_amount
    FROM invoices i
    WHERE i.id = invoice_uuid;

    -- Calculer le total
    total := subtotal + (subtotal * tax_rate / 100) - discount_amount;

    RETURN GREATEST(total, 0); -- Pas de total négatif
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS AUTOMATIQUES
-- =====================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();

-- Trigger pour définir le numéro de facture automatiquement
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- =====================================================
-- SÉCURITÉ RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur les tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Politique pour les factures : Super Admin voit tout, Admin Groupe voit ses groupes
CREATE POLICY "Invoices access policy" ON invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        ) OR
        school_group_id IN (
            SELECT school_group_id FROM user_school_groups
            WHERE user_id = auth.uid()
        )
    );

-- Politique pour les éléments de facture : accès basé sur la facture parente
CREATE POLICY "Invoice items access policy" ON invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_items.invoice_id
            AND (
                EXISTS (
                    SELECT 1 FROM user_roles
                    WHERE user_id = auth.uid()
                    AND role = 'super_admin'
                ) OR
                i.school_group_id IN (
                    SELECT school_group_id FROM user_school_groups
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- =====================================================
-- VUES POUR RAPPORTS
-- =====================================================

-- Vue des factures avec détails du groupe
CREATE OR REPLACE VIEW invoice_details AS
SELECT
    i.*,
    sg.name as school_group_name,
    sg.code as school_group_code,
    s.plan_name,
    s.amount as subscription_amount,
    CASE
        WHEN i.status = 'paid' THEN 'Payée'
        WHEN i.status = 'overdue' AND i.due_date < CURRENT_DATE THEN 'En retard'
        WHEN i.status = 'sent' THEN 'Envoyée'
        WHEN i.status = 'draft' THEN 'Brouillon'
        WHEN i.status = 'cancelled' THEN 'Annulée'
        ELSE 'Inconnue'
    END as status_label
FROM invoices i
JOIN school_groups sg ON sg.id = i.school_group_id
LEFT JOIN subscriptions s ON s.id = i.subscription_id;

-- Vue des statistiques de facturation
CREATE OR REPLACE VIEW invoice_stats AS
SELECT
    DATE_TRUNC('month', invoice_date) as month,
    COUNT(*) as total_invoices,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices,
    SUM(total_amount) as total_amount,
    SUM(total_amount) FILTER (WHERE status = 'paid') as paid_amount,
    AVG(total_amount) as average_invoice_amount
FROM invoices
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Insérer quelques factures de test (optionnel - commenter en production)
-- Cette section peut être supprimée après les tests

/*
-- Exemple de facture pour test
INSERT INTO invoices (
    subscription_id,
    school_group_id,
    invoice_date,
    due_date,
    subtotal,
    tax_rate,
    tax_amount,
    total_amount,
    status,
    period_start,
    period_end,
    notes
) VALUES (
    (SELECT id FROM subscriptions LIMIT 1),
    (SELECT id FROM school_groups LIMIT 1),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    100000.00,
    0.00,
    0.00,
    100000.00,
    'draft',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
    'Facture de test'
);

-- Élément de facture correspondant
INSERT INTO invoice_items (
    invoice_id,
    description,
    quantity,
    unit_price,
    total_price,
    reference_type,
    reference_id
) VALUES (
    (SELECT id FROM invoices ORDER BY created_at DESC LIMIT 1),
    'Abonnement Premium - Novembre 2025',
    1,
    100000.00,
    100000.00,
    'subscription',
    (SELECT subscription_id FROM invoices ORDER BY created_at DESC LIMIT 1)
);
*/

-- =====================================================
-- FIN DE LA CRÉATION DES TABLES DE FACTURATION
-- =====================================================
