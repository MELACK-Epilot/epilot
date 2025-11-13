/**
 * Page Rapports - Génération et exports de rapports
 * @module Reports
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
  Clock
} from 'lucide-react';

export const Reports = () => {
  // Données mockées
  const reportTypes = [
    {
      id: 1,
      title: 'Rapport Financier',
      description: 'Vue d\'ensemble des revenus et dépenses',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      lastGenerated: '2025-10-28',
      frequency: 'Mensuel',
    },
    {
      id: 2,
      title: 'Rapport Utilisateurs',
      description: 'Statistiques d\'activité des utilisateurs',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      lastGenerated: '2025-10-27',
      frequency: 'Hebdomadaire',
    },
    {
      id: 3,
      title: 'Rapport Performance',
      description: 'Métriques de performance de la plateforme',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      lastGenerated: '2025-10-29',
      frequency: 'Quotidien',
    },
    {
      id: 4,
      title: 'Rapport Abonnements',
      description: 'Suivi des abonnements et renouvellements',
      icon: Calendar,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      lastGenerated: '2025-10-26',
      frequency: 'Mensuel',
    },
  ];

  const recentReports = [
    {
      id: 1,
      name: 'Rapport_Financier_Octobre_2025.pdf',
      type: 'PDF',
      size: '2.4 MB',
      date: '2025-10-28',
      downloads: 12,
    },
    {
      id: 2,
      name: 'Statistiques_Utilisateurs_S43.xlsx',
      type: 'Excel',
      size: '1.8 MB',
      date: '2025-10-27',
      downloads: 8,
    },
    {
      id: 3,
      name: 'Performance_Dashboard_29-10.json',
      type: 'JSON',
      size: '456 KB',
      date: '2025-10-29',
      downloads: 3,
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'Excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'JSON':
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-[#1D3557]" />
            Rapports
          </h1>
          <p className="text-gray-500 mt-1">Générez et exportez vos rapports personnalisés</p>
        </div>
      </div>

      {/* Types de rapports */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Types de rapports disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className={`${report.bg} p-3 rounded-lg w-fit mb-4`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{report.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Dernier: {new Date(report.lastGenerated).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-[#2A9D8F] hover:bg-[#1D3557]" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Générer
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Rapports récents */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports récents</CardTitle>
          <CardDescription>Consultez et téléchargez vos rapports générés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getFileIcon(report.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{report.size}</span>
                      <span>•</span>
                      <span>{new Date(report.date).toLocaleDateString('fr-FR')}</span>
                      <span>•</span>
                      <span>{report.downloads} téléchargements</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{report.type}</Badge>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formats d'export */}
      <Card>
        <CardHeader>
          <CardTitle>Formats d'export disponibles</CardTitle>
          <CardDescription>Choisissez le format adapté à vos besoins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <FileText className="h-8 w-8 text-red-600" />
              <div>
                <h4 className="font-medium text-gray-900">PDF</h4>
                <p className="text-sm text-gray-500">Document imprimable</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Excel</h4>
                <p className="text-sm text-gray-500">Données analysables</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">JSON</h4>
                <p className="text-sm text-gray-500">Intégration API</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
