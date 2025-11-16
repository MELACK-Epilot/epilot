/**
 * Page Rapports - Proviseur/Directeur
 * Génération et consultation de rapports détaillés
 * Données 100% réelles depuis Supabase
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  GraduationCap,
  DollarSign,
  BookOpen,
  Filter,
  Eye,
  BarChart3,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDirectorDashboard } from '../hooks/useDirectorDashboard';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSchoolInfo } from '../hooks/useSchoolInfo';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { ReportGenerateModal } from '../components/ReportGenerateModal';
import { generatePDF, generateExcel, generateCSV } from '../utils/reportExports';

// Types de rapports disponibles
type ReportType = 
  | 'global' 
  | 'academic' 
  | 'financial' 
  | 'personnel' 
  | 'students';

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

interface Report {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
  gradient: string;
}

export const ReportsPage = () => {
  const { data: user } = useCurrentUser();
  const { 
    globalKPIs, 
    schoolLevels, 
    isLoading 
  } = useDirectorDashboard();
  
  // Charger les infos de l'école
  const { data: schoolInfo } = useSchoolInfo();

  // Charger les filtres depuis le cache
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(() => {
    const cached = localStorage.getItem('reports-period');
    return (cached as ReportPeriod) || 'month';
  });
  
  const [selectedType, setSelectedType] = useState<ReportType | 'all'>(() => {
    const cached = localStorage.getItem('reports-type');
    return (cached as ReportType | 'all') || 'all';
  });

  // États pour les modals
  const [previewReport, setPreviewReport] = useState<ReportType | null>(null);
  const [generateReport, setGenerateReport] = useState<ReportType | null>(null);

  // Sauvegarder les filtres dans le cache
  useEffect(() => {
    localStorage.setItem('reports-period', selectedPeriod);
  }, [selectedPeriod]);

  useEffect(() => {
    localStorage.setItem('reports-type', selectedType);
  }, [selectedType]);

  // Définition des rapports disponibles
  const availableReports: Report[] = useMemo(() => [
    {
      id: 'global',
      type: 'global',
      title: 'Rapport Global',
      description: 'Vue d\'ensemble complète de l\'établissement',
      icon: BarChart3,
      color: 'text-blue-600',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'academic',
      type: 'academic',
      title: 'Rapport Académique',
      description: 'Performances scolaires et taux de réussite',
      icon: GraduationCap,
      color: 'text-green-600',
      gradient: 'from-green-600 to-emerald-600',
    },
    {
      id: 'financial',
      type: 'financial',
      title: 'Rapport Financier',
      description: 'Revenus, dépenses et croissance',
      icon: DollarSign,
      color: 'text-yellow-600',
      gradient: 'from-yellow-600 to-orange-600',
    },
    {
      id: 'personnel',
      type: 'personnel',
      title: 'Rapport Personnel',
      description: 'Effectifs enseignants et répartition',
      icon: Users,
      color: 'text-purple-600',
      gradient: 'from-purple-600 to-pink-600',
    },
    {
      id: 'students',
      type: 'students',
      title: 'Rapport Élèves',
      description: 'Effectifs élèves par niveau et classe',
      icon: BookOpen,
      color: 'text-teal-600',
      gradient: 'from-teal-600 to-cyan-600',
    },
  ], []);

  // Filtrer les rapports selon le type sélectionné
  const filteredReports = useMemo(() => {
    if (selectedType === 'all') return availableReports;
    return availableReports.filter(r => r.type === selectedType);
  }, [availableReports, selectedType]);

  // Générer les données du rapport global
  const globalReportData = useMemo(() => ({
    period: selectedPeriod,
    generatedAt: new Date().toISOString(),
    school: {
      name: 'École',
      totalStudents: globalKPIs.totalStudents,
      totalClasses: globalKPIs.totalClasses,
      totalTeachers: globalKPIs.totalTeachers,
    },
    academic: {
      successRate: globalKPIs.averageSuccessRate,
      levels: schoolLevels.length,
    },
    financial: {
      revenue: globalKPIs.totalRevenue,
      growth: globalKPIs.monthlyGrowth,
    },
  }), [selectedPeriod, user, globalKPIs, schoolLevels]);

  // Fonction pour générer un rapport PDF
  const handleGenerateReport = (reportType: ReportType, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    console.log(`📊 Génération du rapport ${reportType} en ${format.toUpperCase()}`);
    
    const reportData = {
      type: reportType,
      period: selectedPeriod as ReportPeriod,
      globalKPIs,
      schoolLevels,
    };
    
    try {
      let fileName = '';
      
      if (format === 'pdf') {
        fileName = generatePDF(reportData);
      } else if (format === 'excel') {
        fileName = generateExcel(reportData);
      } else if (format === 'csv') {
        fileName = generateCSV(reportData);
      }
      
      console.log(`✅ Rapport généré: ${fileName}`);
      alert(`✅ Rapport téléchargé avec succès!\n\nFichier: ${fileName}`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      alert('❌ Erreur lors de la génération du rapport. Vérifiez la console.');
    }
  };

  // Fonction pour prévisualiser un rapport
  const handlePreviewReport = (reportType: ReportType) => {
    console.log('👁️ Prévisualisation du rapport:', reportType);
    setPreviewReport(reportType);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-500 relative overflow-hidden group">
          {/* Éléments décoratifs */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-purple-100/20 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-1">
                    Rapports
                  </h1>
                  <p className="text-gray-600 text-lg font-medium">
                    Générez et consultez vos rapports détaillés
                  </p>
                </div>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Élèves</p>
                    <p className="text-2xl font-bold text-gray-900">{globalKPIs.totalStudents}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Taux Réussite</p>
                    <p className="text-2xl font-bold text-gray-900">{globalKPIs.averageSuccessRate}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Enseignants</p>
                    <p className="text-2xl font-bold text-gray-900">{globalKPIs.totalTeachers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Croissance</p>
                    <p className="text-2xl font-bold text-gray-900">+{globalKPIs.monthlyGrowth}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Filtre par type */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                  className={selectedType === 'all' ? 'bg-[#2A9D8F] hover:bg-[#238b7e]' : ''}
                >
                  Tous
                </Button>
                {availableReports.map(report => (
                  <Button
                    key={report.id}
                    variant={selectedType === report.type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(report.type)}
                    className={selectedType === report.type ? 'bg-[#2A9D8F] hover:bg-[#238b7e]' : ''}
                  >
                    <report.icon className="w-4 h-4 mr-2" />
                    {report.title.replace('Rapport ', '')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filtre par période */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div className="flex gap-2">
                {(['week', 'month', 'quarter', 'year'] as ReportPeriod[]).map(period => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className={selectedPeriod === period ? 'bg-[#2A9D8F] hover:bg-[#238b7e]' : ''}
                  >
                    {period === 'week' && 'Semaine'}
                    {period === 'month' && 'Mois'}
                    {period === 'quarter' && 'Trimestre'}
                    {period === 'year' && 'Année'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grille de rapports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(report => (
            <Card 
              key={report.id}
              className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-[#2A9D8F]/30 group"
            >
              {/* Icône et badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${report.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <report.icon className="w-7 h-7 text-white" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {selectedPeriod === 'week' && 'Hebdo'}
                  {selectedPeriod === 'month' && 'Mensuel'}
                  {selectedPeriod === 'quarter' && 'Trimestriel'}
                  {selectedPeriod === 'year' && 'Annuel'}
                </Badge>
              </div>

              {/* Titre et description */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {report.title}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {report.description}
              </p>

              {/* Données du rapport */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                {report.type === 'global' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Élèves</span>
                      <span className="font-semibold">{globalKPIs.totalStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Classes</span>
                      <span className="font-semibold">{globalKPIs.totalClasses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Enseignants</span>
                      <span className="font-semibold">{globalKPIs.totalTeachers}</span>
                    </div>
                  </>
                )}
                
                {report.type === 'academic' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taux Réussite</span>
                      <span className="font-semibold">{globalKPIs.averageSuccessRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Niveaux</span>
                      <span className="font-semibold">{schoolLevels.length}</span>
                    </div>
                    
                    {/* Détails par niveau */}
                    {schoolLevels.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Par niveau</p>
                        {schoolLevels.slice(0, 3).map(level => (
                          <div key={level.id} className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{level.name}</span>
                            <span className="font-semibold text-green-600">{level.success_rate}%</span>
                          </div>
                        ))}
                        {schoolLevels.length > 3 && (
                          <p className="text-xs text-gray-500 mt-1">+{schoolLevels.length - 3} autres...</p>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {report.type === 'financial' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenus</span>
                      <span className="font-semibold">{globalKPIs.totalRevenue.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Croissance</span>
                      <span className="font-semibold text-green-600">+{globalKPIs.monthlyGrowth}%</span>
                    </div>
                  </>
                )}
                
                {report.type === 'personnel' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-semibold">{globalKPIs.totalTeachers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ratio Élèves/Prof</span>
                      <span className="font-semibold">
                        {Math.round(globalKPIs.totalStudents / globalKPIs.totalTeachers)}:1
                      </span>
                    </div>
                  </>
                )}
                
                {report.type === 'students' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-semibold">{globalKPIs.totalStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Par classe (moy)</span>
                      <span className="font-semibold">
                        {Math.round(globalKPIs.totalStudents / globalKPIs.totalClasses)}
                      </span>
                    </div>
                    
                    {/* Détails par niveau */}
                    {schoolLevels.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Par niveau</p>
                        {schoolLevels.slice(0, 3).map(level => (
                          <div key={level.id} className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{level.name}</span>
                            <span className="font-semibold text-blue-600">{level.students_count} élèves</span>
                          </div>
                        ))}
                        {schoolLevels.length > 3 && (
                          <p className="text-xs text-gray-500 mt-1">+{schoolLevels.length - 3} autres...</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePreviewReport(report.type)}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
                <Button
                  onClick={() => setGenerateReport(report.type)}
                  className="flex-1 bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1d7a6f]"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Générer
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Message si aucun rapport */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun rapport disponible
            </h3>
            <p className="text-gray-500">
              Modifiez vos filtres pour voir les rapports disponibles
            </p>
          </div>
        )}
      </div>

      {/* Modal de prévisualisation */}
      {previewReport && (
        <ReportPreviewModal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          reportType={previewReport}
          period={selectedPeriod}
          globalKPIs={globalKPIs}
          schoolLevels={schoolLevels}
          onGenerate={() => {
            setPreviewReport(null);
            setGenerateReport(previewReport);
          }}
        />
      )}

      {/* Modal de génération */}
      {generateReport && (
        <ReportGenerateModal
          isOpen={!!generateReport}
          onClose={() => setGenerateReport(null)}
          reportType={generateReport}
          period={selectedPeriod}
          globalKPIs={globalKPIs}
          schoolLevels={schoolLevels}
          schoolInfo={schoolInfo}
          onGenerate={(format) => handleGenerateReport(generateReport, format)}
        />
      )}
    </div>
  );
};
