/**
 * Modal de Génération de Rapport
 * Confirmation avant téléchargement avec choix du format
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, Calendar, Building2, User, Mail, Phone, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DashboardKPIs, SchoolLevel } from '../hooks/useDirectorDashboard';
import type { SchoolInfo } from '../hooks/useSchoolInfo';
import { useState } from 'react';

interface ReportGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'global' | 'academic' | 'financial' | 'personnel' | 'students';
  period: string;
  globalKPIs: DashboardKPIs;
  schoolLevels: SchoolLevel[];
  schoolInfo?: SchoolInfo;
  onGenerate: (format: 'pdf' | 'excel' | 'csv') => void;
}

export const ReportGenerateModal = ({
  isOpen,
  onClose,
  reportType,
  period,
  globalKPIs,
  schoolLevels,
  schoolInfo,
  onGenerate,
}: ReportGenerateModalProps) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

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

  const formatIcons = {
    pdf: '📄',
    excel: '📊',
    csv: '📋',
  };

  const formatDescriptions = {
    pdf: 'Document PDF professionnel avec mise en page',
    excel: 'Fichier Excel avec plusieurs feuilles',
    csv: 'Fichier CSV simple pour import',
  };

  const handleGenerate = () => {
    onGenerate(selectedFormat);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Download className="w-6 h-6 text-[#2A9D8F]" />
            Générer le Rapport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* En-tête avec logo et infos école */}
          <div className="bg-gradient-to-r from-[#2A9D8F]/10 to-blue-50 rounded-xl p-6 border border-[#2A9D8F]/20">
            <div className="flex items-start gap-4">
              {/* Logo */}
              {schoolInfo?.school.logo ? (
                <img 
                  src={schoolInfo.school.logo} 
                  alt="Logo" 
                  className="h-20 w-20 object-contain rounded-lg bg-white p-2"
                />
              ) : (
                <div className="h-20 w-20 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-lg flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              )}

              {/* Informations */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {schoolInfo?.school.name || 'École'}
                </h3>
                
                {schoolInfo?.school.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>{schoolInfo.school.address}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {schoolInfo?.school.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{schoolInfo.school.phone}</span>
                    </div>
                  )}
                  {schoolInfo?.school.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{schoolInfo.school.email}</span>
                    </div>
                  )}
                </div>

                {schoolInfo?.schoolGroup.name && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Groupe Scolaire</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {schoolInfo.schoolGroup.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="text-right">
                <p className="text-xs text-gray-500">Date de génération</p>
                <p className="font-semibold text-gray-900">
                  {new Date().toLocaleDateString('fr-FR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Informations du rapport */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2A9D8F]" />
              Détails du Rapport
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Type de rapport</p>
                <p className="font-semibold text-gray-900">{reportTitles[reportType]}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Période</p>
                <p className="font-semibold text-gray-900">
                  {periodNames[period as keyof typeof periodNames]}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Données incluses</p>
                <p className="font-semibold text-gray-900">{schoolLevels.length} niveaux</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Responsable</p>
                <p className="font-semibold text-gray-900">
                  {schoolInfo?.director.firstName} {schoolInfo?.director.lastName}
                </p>
              </div>
            </div>

            {/* Aperçu des données */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Aperçu des données</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{globalKPIs.totalStudents}</p>
                  <p className="text-xs text-gray-600">Élèves</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{globalKPIs.totalClasses}</p>
                  <p className="text-xs text-gray-600">Classes</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{globalKPIs.totalTeachers}</p>
                  <p className="text-xs text-gray-600">Enseignants</p>
                </div>
              </div>
            </div>
          </div>

          {/* Choix du format */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-lg mb-4">Format d'export</h4>
            
            <div className="grid grid-cols-3 gap-3">
              {(['pdf', 'excel', 'csv'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedFormat === format
                      ? 'border-[#2A9D8F] bg-[#2A9D8F]/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{formatIcons[format]}</div>
                    <p className="font-semibold text-gray-900 uppercase mb-1">{format}</p>
                    <p className="text-xs text-gray-600">{formatDescriptions[format]}</p>
                    {selectedFormat === format && (
                      <Badge className="mt-2 bg-[#2A9D8F]">Sélectionné</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Contenu du rapport</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• En-tête avec logo et coordonnées de l'école</li>
                  <li>• Informations du groupe scolaire</li>
                  <li>• Données détaillées par niveau</li>
                  <li>• Statistiques et indicateurs clés</li>
                  <li>• Signature du responsable</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button 
            onClick={handleGenerate}
            className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1d7a6f]"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger {selectedFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
