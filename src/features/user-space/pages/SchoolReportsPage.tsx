import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  GraduationCap,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Eye,
  Share2,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface Report {
  id: string;
  title: string;
  category: 'academic' | 'financial' | 'administrative' | 'statistical';
  period: string;
  date: Date;
  status: 'completed' | 'pending' | 'draft';
  downloads: number;
  size: string;
}

export const SchoolReportsPage = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [reports] = useState<Report[]>([
    {
      id: '1',
      title: 'Rapport Académique - Trimestre 1',
      category: 'academic',
      period: 'T1 2024',
      date: new Date('2024-03-15'),
      status: 'completed',
      downloads: 45,
      size: '2.5 MB',
    },
    {
      id: '2',
      title: 'Bilan Financier Annuel 2023',
      category: 'financial',
      period: 'Année 2023',
      date: new Date('2024-01-10'),
      status: 'completed',
      downloads: 78,
      size: '3.8 MB',
    },
    {
      id: '3',
      title: 'Statistiques d\'Inscription 2024',
      category: 'statistical',
      period: 'Année 2024',
      date: new Date('2024-02-20'),
      status: 'completed',
      downloads: 34,
      size: '1.2 MB',
    },
    {
      id: '4',
      title: 'Rapport Administratif - Février',
      category: 'administrative',
      period: 'Février 2024',
      date: new Date('2024-03-01'),
      status: 'pending',
      downloads: 12,
      size: '1.8 MB',
    },
    {
      id: '5',
      title: 'Analyse des Performances - T2',
      category: 'academic',
      period: 'T2 2024',
      date: new Date('2024-06-15'),
      status: 'draft',
      downloads: 0,
      size: '0.5 MB',
    },
    {
      id: '6',
      title: 'Budget Prévisionnel 2024-2025',
      category: 'financial',
      period: '2024-2025',
      date: new Date('2024-05-01'),
      status: 'completed',
      downloads: 56,
      size: '2.1 MB',
    },
  ]);

  const categories = [
    { value: 'all', label: 'Tous', icon: FileText, color: 'bg-gray-100 text-gray-800' },
    { value: 'academic', label: 'Académique', icon: GraduationCap, color: 'bg-blue-100 text-blue-800' },
    { value: 'financial', label: 'Financier', icon: DollarSign, color: 'bg-green-100 text-green-800' },
    { value: 'administrative', label: 'Administratif', icon: Users, color: 'bg-purple-100 text-purple-800' },
    { value: 'statistical', label: 'Statistique', icon: BarChart3, color: 'bg-orange-100 text-orange-800' },
  ];

  const statusConfig = {
    completed: { label: 'Complété', color: 'bg-green-100 text-green-800 border-green-200' },
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };

  const filteredReports = reports.filter(report => 
    selectedCategory === 'all' || report.category === selectedCategory
  );

  const handleAction = (action: string, reportTitle: string) => {
    toast({
      title: action,
      description: `Action effectuée pour "${reportTitle}"`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="h-8 w-8 text-[#2A9D8F]" />
              Rapports et Documents
            </h1>
            <p className="text-gray-600 mt-1">Consultez et téléchargez tous les rapports de l'école</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <Button className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1f7a6f] text-white">
              <FileText className="h-4 w-4 mr-2" />
              Nouveau rapport
            </Button>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <FileText className="h-8 w-8 text-blue-600 mb-3" />
              <div className="text-3xl font-bold text-blue-600">{reports.length}</div>
              <div className="text-sm text-gray-600">Total Rapports</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <Download className="h-8 w-8 text-green-600 mb-3" />
              <div className="text-3xl font-bold text-green-600">
                {reports.reduce((acc, r) => acc + r.downloads, 0)}
              </div>
              <div className="text-sm text-gray-600">Téléchargements</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-3" />
              <div className="text-3xl font-bold text-purple-600">
                {reports.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Complétés</div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <Calendar className="h-8 w-8 text-orange-600 mb-3" />
              <div className="text-3xl font-bold text-orange-600">
                {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
              </div>
              <div className="text-sm text-gray-600">Période actuelle</div>
            </Card>
          </motion.div>
        </div>

        {/* Filtres par catégorie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Badge
                    key={category.value}
                    className={`cursor-pointer px-4 py-2 ${
                      selectedCategory === category.value
                        ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                        : category.color
                    }`}
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.label}
                  </Badge>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Tabs pour différentes vues */}
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grid">
              <PieChart className="h-4 w-4 mr-2" />
              Vue Grille
            </TabsTrigger>
            <TabsTrigger value="list">
              <LineChart className="h-4 w-4 mr-2" />
              Vue Liste
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Chronologie
            </TabsTrigger>
          </TabsList>

          {/* Vue Grille */}
          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report, index) => {
                const category = categories.find(c => c.value === report.category);
                const Icon = category?.icon || FileText;
                const status = statusConfig[report.status];

                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category?.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-2">{report.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{report.period}</p>

                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#2A9D8F]" />
                            {report.date.toLocaleDateString('fr-FR')}
                          </span>
                          <span>{report.size}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-[#2A9D8F]" />
                          <span>{report.downloads} téléchargements</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAction('Aperçu', report.title)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-[#2A9D8F] hover:bg-[#238b7e]"
                          onClick={() => handleAction('Téléchargement', report.title)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Vue Liste */}
          <TabsContent value="list">
            <Card>
              <div className="divide-y">
                {filteredReports.map((report, index) => {
                  const category = categories.find(c => c.value === report.category);
                  const Icon = category?.icon || FileText;
                  const status = statusConfig[report.status];

                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category?.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{report.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>{report.period}</span>
                              <span>•</span>
                              <span>{report.date.toLocaleDateString('fr-FR')}</span>
                              <span>•</span>
                              <span>{report.size}</span>
                              <span>•</span>
                              <span>{report.downloads} téléchargements</span>
                            </div>
                          </div>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('Aperçu', report.title)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('Partager', report.title)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('Imprimer', report.title)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#2A9D8F] hover:bg-[#238b7e]"
                            onClick={() => handleAction('Téléchargement', report.title)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Vue Chronologie */}
          <TabsContent value="timeline">
            <Card className="p-6">
              <div className="space-y-6">
                {filteredReports
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((report, index) => {
                    const category = categories.find(c => c.value === report.category);
                    const Icon = category?.icon || FileText;
                    const status = statusConfig[report.status];

                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category?.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {index < filteredReports.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900">{report.title}</h3>
                              <p className="text-sm text-gray-600">{report.period}</p>
                            </div>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {report.date.toLocaleDateString('fr-FR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              {report.downloads} téléchargements
                            </span>
                            <span>{report.size}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction('Aperçu', report.title)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Button>
                            <Button
                              size="sm"
                              className="bg-[#2A9D8F] hover:bg-[#238b7e]"
                              onClick={() => handleAction('Téléchargement', report.title)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
