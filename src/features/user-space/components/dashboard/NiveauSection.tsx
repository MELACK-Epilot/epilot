/**
 * Section pour un niveau scolaire (Maternelle, Primaire, Collège, Lycée)
 */

import { memo } from 'react';
import { Users, BookOpen, GraduationCap, Target, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from './KPICard';

interface NiveauSectionProps {
  niveau: {
    id: string;
    nom: string;
    couleur: string;
    icone: any;
    kpis: {
      eleves: number;
      classes: number;
      enseignants: number;
      taux_reussite: number;
      revenus: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  onNiveauClick: (niveau: any) => void;
}

// Fonction pour obtenir le design par niveau
const getNiveauDesign = (niveauId: string) => {
  const designs = {
    maternelle: {
      eleves: {
        gradient: "from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]",
        iconBg: "bg-[#1D3557]/20",
        iconColor: "text-blue-100"
      },
      classes: {
        gradient: "from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]",
        iconBg: "bg-[#1D3557]/20",
        iconColor: "text-blue-100"
      },
      enseignants: {
        gradient: "from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]",
        iconBg: "bg-[#1D3557]/20",
        iconColor: "text-blue-100"
      },
      taux: {
        gradient: "from-[#1D3557] via-[#2A4A6F] to-[#0d1f3d]",
        iconBg: "bg-[#1D3557]/20",
        iconColor: "text-blue-100"
      }
    },
    primaire: {
      eleves: {
        gradient: "from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]",
        iconBg: "bg-[#2A9D8F]/20",
        iconColor: "text-emerald-100"
      },
      classes: {
        gradient: "from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]",
        iconBg: "bg-[#2A9D8F]/20",
        iconColor: "text-emerald-100"
      },
      enseignants: {
        gradient: "from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]",
        iconBg: "bg-[#2A9D8F]/20",
        iconColor: "text-emerald-100"
      },
      taux: {
        gradient: "from-[#2A9D8F] via-[#3FBFAE] to-[#1d7a6f]",
        iconBg: "bg-[#2A9D8F]/20",
        iconColor: "text-emerald-100"
      }
    },
    college: {
      eleves: {
        gradient: "from-[#E9C46A] via-[#F4D98D] to-[#d4a849]",
        iconBg: "bg-[#E9C46A]/20",
        iconColor: "text-yellow-100"
      },
      classes: {
        gradient: "from-[#E9C46A] via-[#F4D98D] to-[#d4a849]",
        iconBg: "bg-[#E9C46A]/20",
        iconColor: "text-yellow-100"
      },
      enseignants: {
        gradient: "from-[#E9C46A] via-[#F4D98D] to-[#d4a849]",
        iconBg: "bg-[#E9C46A]/20",
        iconColor: "text-yellow-100"
      },
      taux: {
        gradient: "from-[#E9C46A] via-[#F4D98D] to-[#d4a849]",
        iconBg: "bg-[#E9C46A]/20",
        iconColor: "text-yellow-100"
      }
    },
    lycee: {
      eleves: {
        gradient: "from-[#E63946] via-[#F25C68] to-[#c91f2b]",
        iconBg: "bg-[#E63946]/20",
        iconColor: "text-red-100"
      },
      classes: {
        gradient: "from-[#E63946] via-[#F25C68] to-[#c91f2b]",
        iconBg: "bg-[#E63946]/20",
        iconColor: "text-red-100"
      },
      enseignants: {
        gradient: "from-[#E63946] via-[#F25C68] to-[#c91f2b]",
        iconBg: "bg-[#E63946]/20",
        iconColor: "text-red-100"
      },
      taux: {
        gradient: "from-[#E63946] via-[#F25C68] to-[#c91f2b]",
        iconBg: "bg-[#E63946]/20",
        iconColor: "text-red-100"
      }
    }
  };
  
  return designs[niveauId as keyof typeof designs] || designs.primaire;
};

export const NiveauSection = memo(({ niveau, onNiveauClick }: NiveauSectionProps) => {
  const design = getNiveauDesign(niveau.id);
  const IconeNiveau = niveau.icone;

  return (
    <Card className="p-8 bg-white border-0 shadow-lg rounded-3xl hover:shadow-2xl transition-all duration-500">
      {/* En-tête du niveau */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${niveau.couleur} rounded-2xl flex items-center justify-center shadow-lg`}>
            <IconeNiveau className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{niveau.nom}</h2>
            <p className="text-gray-600">
              {niveau.kpis.eleves} élèves • {niveau.kpis.classes} classes • {niveau.kpis.enseignants} enseignants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge 
            variant={niveau.kpis.taux_reussite >= 75 ? "default" : "destructive"}
            className="px-4 py-2 text-sm"
          >
            {niveau.kpis.taux_reussite >= 75 ? '✓ Performant' : '⚠ À surveiller'}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onNiveauClick(niveau)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Voir Détails
          </Button>
        </div>
      </div>

      {/* Grille des KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="ÉLÈVES"
          value={niveau.kpis.eleves}
          icon={Users}
          gradient={design.eleves.gradient}
          iconBg={design.eleves.iconBg}
          iconColor={design.eleves.iconColor}
        />

        <KPICard
          title="CLASSES"
          value={niveau.kpis.classes}
          icon={BookOpen}
          gradient={design.classes.gradient}
          iconBg={design.classes.iconBg}
          iconColor={design.classes.iconColor}
        />

        <KPICard
          title="ENSEIGNANTS"
          value={niveau.kpis.enseignants}
          icon={GraduationCap}
          gradient={design.enseignants.gradient}
          iconBg={design.enseignants.iconBg}
          iconColor={design.enseignants.iconColor}
        />

        <KPICard
          title="TAUX RÉUSSITE"
          value={`${niveau.kpis.taux_reussite}%`}
          icon={Target}
          gradient={design.taux.gradient}
          iconBg={design.taux.iconBg}
          iconColor={design.taux.iconColor}
        />
      </div>
    </Card>
  );
});

NiveauSection.displayName = 'NiveauSection';
