/**
 * Modal de Prévisualisation de Rapport
 * Affiche un aperçu détaillé avant génération
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, Calendar, Building2 } from 'lucide-react';
import type { DashboardKPIs, SchoolLevel } from '../hooks/useDirectorDashboard';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'global' | 'academic' | 'financial' | 'personnel' | 'students';
  period: string;
  globalKPIs: DashboardKPIs;
  schoolLevels: SchoolLevel[];
  schoolInfo?: SchoolInfo;
  onGenerate: () => void;
}

interface SchoolInfo {
  school: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  schoolGroup: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  director: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export const ReportPreviewModal = ({
  isOpen,
  onClose,
  reportType,
  period,
  globalKPIs,
  schoolLevels,
  schoolInfo,
  onGenerate,
}: ReportPreviewModalProps) => {
  const reportTitles = {
    global: 'Rapport Global',
    academic: 'Rapport Académique',
    financial: 'Rapport Financier',
    personnel: 'Rapport Personnel',
    students: 'Rapport Élèves',
  };

  const periodNames = {
    week: 'Hebdomadaire',
    month: 'Mensuel',
    quarter: 'Trimestriel',
    year: 'Annuel',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <FileText className="w-6 h-6 text-[#2A9D8F]" />
            Aperçu - {reportTitles[reportType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* En-tête du rapport */}
          <div className="bg-gradient-to-r from-[#2A9D8F]/10 to-blue-50 rounded-xl p-6 border border-[#2A9D8F]/20">
            <div className="flex items-start gap-4 mb-4">
              {/* Logo */}
              {schoolInfo?.school.logo ? (
                <div className="h-16 w-16 rounded-lg bg-white p-2 border border-gray-200 flex items-center justify-center overflow-hidden">
                  <img 
                    src={schoolInfo.school.logo} 
                    alt={`Logo ${schoolInfo.school.name}`}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      console.error('❌ Logo loading error:', schoolInfo.school.logo);
                      // Fallback si l'image ne charge pas
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `
                        <div class="h-16 w-16 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-lg flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </div>
              ) : (
                <div className="h-16 w-16 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-lg flex items-center justify-center shadow-md">
                  {schoolInfo?.school.name ? (
                    <div className="text-white font-bold text-xl">
                      {schoolInfo.school.name.split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase()}
                    </div>
                  ) : (
                    <Building2 className="w-8 h-8 text-white" />
                  )}
                </div>
              )}

              {/* Informations école */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {schoolInfo?.school.name || 'École'}
                </h3>
                {schoolInfo?.school.address && (
                  <p className="text-sm text-gray-600">{schoolInfo.school.address}</p>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  {schoolInfo?.school.phone && <span>{schoolInfo.school.phone}</span>}
                  {schoolInfo?.school.email && (
                    <>
                      <span>•</span>
                      <span>{schoolInfo.school.email}</span>
                    </>
                  )}
                </div>
                {schoolInfo?.schoolGroup.name && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Groupe Scolaire</p>
                    <p className="text-sm font-semibold text-gray-700">{schoolInfo.schoolGroup.name}</p>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="text-right">
                <p className="text-sm text-gray-600">Généré le</p>
                <p className="font-semibold">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            
            {/* Rapport */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{reportTitles[reportType]}</h4>
                <p className="text-sm text-gray-600">Période: {periodNames[period as keyof typeof periodNames]}</p>
              </div>
              {schoolInfo?.director && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Responsable</p>
                  <p className="font-semibold text-gray-900">
                    {schoolInfo.director.firstName} {schoolInfo.director.lastName}
                  </p>
                  {schoolInfo.director.email && (
                    <p className="text-xs text-gray-600 mt-1">{schoolInfo.director.email}</p>
                  )}
                  {schoolInfo.director.phone && (
                    <p className="text-xs text-gray-600">{schoolInfo.director.phone}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contenu selon le type */}
          {reportType === 'global' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Vue d'Ensemble</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatBox label="Élèves" value={globalKPIs.totalStudents} />
                <StatBox label="Classes" value={globalKPIs.totalClasses} />
                <StatBox label="Enseignants" value={globalKPIs.totalTeachers} />
                <StatBox label="Taux Réussite" value={`${globalKPIs.averageSuccessRate}%`} />
                <StatBox label="Revenus" value={`${globalKPIs.totalRevenue.toLocaleString()} FCFA`} />
                <StatBox label="Croissance" value={`+${globalKPIs.monthlyGrowth}%`} />
              </div>
            </div>
          )}

          {reportType === 'academic' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Performances Académiques</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatBox label="Taux de Réussite Global" value={`${globalKPIs.averageSuccessRate}%`} />
                <StatBox label="Nombre de Niveaux" value={schoolLevels.length} />
              </div>
              
              <h5 className="font-semibold text-md">Détails par Niveau</h5>
              <div className="space-y-2">
                {schoolLevels.map(level => (
                  <div key={level.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{level.name}</span>
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600">
                        Élèves: <span className="font-semibold text-gray-900">{level.students_count}</span>
                      </span>
                      <span className="text-gray-600">
                        Taux: <span className="font-semibold text-green-600">{level.success_rate}%</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportType === 'financial' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Situation Financière</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Revenus Totaux" value={`${globalKPIs.totalRevenue.toLocaleString()} FCFA`} />
                <StatBox label="Croissance" value={`+${globalKPIs.monthlyGrowth}%`} color="green" />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Tendance:</strong> Croissance positive de {globalKPIs.monthlyGrowth}% sur la période
                </p>
              </div>
            </div>
          )}

          {reportType === 'personnel' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Effectifs Personnel</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Total Enseignants" value={globalKPIs.totalTeachers} />
                <StatBox label="Ratio Élèves/Prof" value={`${Math.round(globalKPIs.totalStudents / globalKPIs.totalTeachers)}:1`} />
              </div>
              
              <h5 className="font-semibold text-md mt-6">Répartition par Niveau</h5>
              <div className="space-y-2">
                {schoolLevels.map(level => (
                  <div key={level.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{level.name}</span>
                    <span className="text-gray-600">
                      <span className="font-semibold text-gray-900">{level.teachers_count}</span> enseignants
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportType === 'students' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b pb-2">Effectifs Élèves</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Total Élèves" value={globalKPIs.totalStudents} />
                <StatBox label="Moyenne par Classe" value={Math.round(globalKPIs.totalStudents / globalKPIs.totalClasses)} />
              </div>
              
              <h5 className="font-semibold text-md mt-6">Répartition par Niveau</h5>
              <div className="space-y-2">
                {schoolLevels.map(level => (
                  <div key={level.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{level.name}</span>
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600">
                        Élèves: <span className="font-semibold text-blue-600">{level.students_count}</span>
                      </span>
                      <span className="text-gray-600">
                        Classes: <span className="font-semibold text-gray-900">{level.classes_count}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Signature professionnelle */}
        {schoolInfo && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div>
                <p className="font-semibold text-gray-900">{schoolInfo.school.name}</p>
                {schoolInfo.schoolGroup.name && (
                  <p>Groupe: {schoolInfo.schoolGroup.name}</p>
                )}
              </div>
              <div className="text-right">
                <p>Document généré par E-Pilot</p>
                <p>{new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
          <Button 
            onClick={() => {
              onGenerate();
              onClose();
            }}
            className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1d7a6f]"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Composant StatBox pour afficher les statistiques
const StatBox = ({ label, value, color = 'gray' }: { label: string; value: string | number; color?: string }) => {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-lg p-4`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};
