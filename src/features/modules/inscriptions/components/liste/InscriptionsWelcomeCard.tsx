/**
 * Card de bienvenue explicative
 * Style bleu foncé avec actions
 */

import { motion } from 'framer-motion';
import { GraduationCap, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExportMenu } from './ExportMenu';
import type { Inscription } from '../../types/inscriptions.types';

interface InscriptionsWelcomeCardProps {
  totalInscriptions: number;
  academicYear: string;
  inscriptions: Inscription[];
  onRefresh: () => void;
  onAcademicYearChange: (year: string) => void;
}

export const InscriptionsWelcomeCard = ({
  totalInscriptions,
  academicYear,
  inscriptions,
  onRefresh,
  onAcademicYearChange,
}: InscriptionsWelcomeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, type: "spring", stiffness: 100 }}
    >
      <Card className="border-none bg-gradient-to-r from-[#2A9D8F] via-[#238b7e] to-[#1d7a6f] shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            {/* Icône et Texte */}
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Gestion des Inscriptions par Niveau
                </h3>
                <p className="text-sm text-white/80 leading-relaxed max-w-3xl">
                  Visualisez et gérez toutes les inscriptions de votre établissement classées par niveau d'enseignement. 
                  Utilisez les filtres ci-dessous pour affiner votre recherche par statut, année académique ou type d'inscription.
                </p>
              </div>
            </div>

            {/* Sélection année à droite */}
            <div className="flex items-center gap-3">
              <Select value={academicYear} onValueChange={onAcademicYearChange}>
                <SelectTrigger className="h-9 w-[160px] bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2022-2023">2022-2023</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats et Actions en bas */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            {/* Stats à gauche */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <span className="text-xs text-white/80">
                  <span className="font-semibold text-white">{totalInscriptions}</span> inscriptions au total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#E9C46A]"></div>
                <span className="text-xs text-white/80">
                  <span className="font-semibold text-white">8</span> niveaux d'enseignement
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                <span className="text-xs text-white/80">
                  Année académique <span className="font-semibold text-white">{academicYear}</span>
                </span>
              </div>
            </div>

            {/* Actions à droite */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 gap-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-all text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualiser
              </Button>
              <ExportMenu
                inscriptions={inscriptions}
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-all text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
