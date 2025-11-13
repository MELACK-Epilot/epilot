/**
 * Page Liste des Inscriptions - VERSION REFACTORISÉE
 * Fichier principal simplifié avec composants modulaires
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useInscriptions } from '../hooks/queries/useInscriptions';
import { InscriptionFormComplet } from '../components/InscriptionFormComplet';
import { InscriptionsHeader } from '../components/liste/InscriptionsHeader';
import { InscriptionsWelcomeCard } from '../components/liste/InscriptionsWelcomeCard';
import { InscriptionsStatsCards } from '../components/liste/InscriptionsStatsCards';
import { InscriptionsFilters } from '../components/liste/InscriptionsFilters';
import { InscriptionsTable } from '../components/liste/InscriptionsTable';
import type { InscriptionFilters } from '../types/inscription.types';

export const InscriptionsListe = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [filters, setFilters] = useState<InscriptionFilters>({
    search: '',
    niveau: 'all',
    status: 'all',
    academic_year: '2024-2025',
    type_inscription: 'all',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: inscriptions = [], isLoading, refetch } = useInscriptions({
    academicYear: filters.academic_year || '2024-2025',
  });

  const filteredInscriptions = useMemo(() => {
    return inscriptions.filter((inscription) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = `${inscription.studentFirstName} ${inscription.studentLastName}`.toLowerCase();
        const inscriptionNumber = inscription.inscriptionNumber?.toLowerCase() || '';
        if (!fullName.includes(searchLower) && !inscriptionNumber.includes(searchLower)) {
          return false;
        }
      }
      if (filters.niveau && filters.niveau !== 'all' && inscription.requestedLevel !== filters.niveau) {
        return false;
      }
      if (filters.status && filters.status !== 'all' && inscription.status !== filters.status) {
        return false;
      }
      if (filters.type_inscription && filters.type_inscription !== 'all' && inscription.typeInscription && inscription.typeInscription !== filters.type_inscription) {
        return false;
      }
      return true;
    });
  }, [inscriptions, filters]);

  const stats = useMemo(() => {
    const niveaux = {
      maternel: 0,
      primaire: 0,
      college_general: 0,
      college_technique: 0,
      lycee_general: 0,
      lycee_technique: 0,
      formation: 0,
      universite: 0,
    };

    filteredInscriptions.forEach((inscription) => {
      const niveau = inscription.requestedLevel?.toUpperCase() || '';
      if (niveau.includes('MATERNELLE') || niveau.includes('PETITE') || niveau.includes('MOYENNE') || niveau.includes('GRANDE')) {
        niveaux.maternel++;
      } else if (niveau.includes('CP') || niveau.includes('CE') || niveau.includes('CM')) {
        niveaux.primaire++;
      } else if (niveau.includes('6EME') || niveau.includes('5EME') || niveau.includes('4EME') || niveau.includes('3EME')) {
        niveaux.college_general++;
      } else if ((niveau.includes('6EME') || niveau.includes('5EME') || niveau.includes('4EME') || niveau.includes('3EME')) && niveau.includes('TECHNIQUE')) {
        niveaux.college_technique++;
      } else if ((niveau.includes('2NDE') || niveau.includes('1ERE') || niveau.includes('TERMINALE')) && !niveau.includes('TECHNIQUE')) {
        niveaux.lycee_general++;
      } else if ((niveau.includes('2NDE') || niveau.includes('1ERE') || niveau.includes('TERMINALE')) && niveau.includes('TECHNIQUE')) {
        niveaux.lycee_technique++;
      } else if (niveau.includes('CAP') || niveau.includes('BEP') || niveau.includes('BAC PRO') || niveau.includes('FORMATION')) {
        niveaux.formation++;
      } else if (niveau.includes('LICENCE') || niveau.includes('MASTER') || niveau.includes('DOCTORAT') || niveau.includes('UNIVERSITE')) {
        niveaux.universite++;
      }
    });

    return {
      total: filteredInscriptions.length,
      ...niveaux,
    };
  }, [filteredInscriptions]);

  const handleView = (id: string) => {
    window.location.href = `/inscriptions/${id}`;
  };

  const handleEdit = (id: string) => {
    setSelectedInscription(id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    toast.info('Suppression en cours de développement');
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      niveau: 'all',
      status: 'all',
      academic_year: '2024-2025',
      type_inscription: 'all',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <InscriptionsHeader
        onBack={() => navigate(-1)}
        onNewInscription={() => {
          setSelectedInscription(null);
          setIsFormOpen(true);
        }}
      />

      <InscriptionsWelcomeCard
        totalInscriptions={stats.total}
        academicYear={filters.academic_year || '2024-2025'}
        inscriptions={filteredInscriptions}
        onRefresh={() => refetch()}
        onAcademicYearChange={(year: string) => setFilters({ ...filters, academic_year: year })}
      />

      <InscriptionsStatsCards stats={stats} />

      <InscriptionsFilters
        filters={filters}
        showFilters={showFilters}
        onFiltersChange={setFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onResetFilters={handleResetFilters}
      />

      <InscriptionsTable
        inscriptions={filteredInscriptions}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <InscriptionFormComplet
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedInscription(null);
            refetch();
          }
        }}
        inscriptionId={selectedInscription || undefined}
        schoolId={user?.schoolId || user?.schoolGroupId || ''}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedInscription(null);
          refetch();
          toast.success('Inscription enregistrée avec succès !');
        }}
      />
    </div>
  );
};
