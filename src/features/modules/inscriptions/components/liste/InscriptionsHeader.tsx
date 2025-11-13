/**
 * Header de la page Liste des Inscriptions
 * Breadcrumb, titre, année académique, actions
 */

import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InscriptionsHeaderProps {
  onBack: () => void;
  onNewInscription: () => void;
}

export const InscriptionsHeader = ({
  onBack,
  onNewInscription,
}: InscriptionsHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Breadcrumb / Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="group gap-2 text-gray-600 hover:text-white hover:bg-[#1D3557] transition-all duration-300 border border-transparent hover:border-[#1D3557] hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">Retour</span>
        </Button>
        <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
        <span className="text-sm text-gray-500">Gestion des inscriptions</span>
      </div>

      {/* Header Principal */}
      <div className="flex items-center justify-between">
        {/* Titre avec badge */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-xl shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1D3557] to-[#2A9D8F] bg-clip-text text-transparent tracking-tight">
              Inscriptions
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestion complète des inscriptions scolaires
            </p>
          </div>
        </div>

        {/* Bouton Nouvelle inscription */}
        <Button
          onClick={onNewInscription}
          className="gap-2 bg-gradient-to-r from-[#2A9D8F] to-[#1d7a6f] hover:from-[#1d7a6f] hover:to-[#2A9D8F] text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Users className="w-4 h-4" />
          Nouvelle inscription
        </Button>
      </div>

      {/* Ligne de séparation décorative */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </motion.div>
  );
};
