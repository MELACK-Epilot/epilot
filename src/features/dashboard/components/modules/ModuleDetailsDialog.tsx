import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Package, 
  BookOpen, 
  Building2, 
  Settings, 
  CheckCircle2, 
  ExternalLink, 
  PlayCircle, 
  Users, 
  Clock,
  Rocket 
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ModuleWithCategory, useModuleUsageBySchool } from '../../hooks/useSchoolGroupModules';

interface ModuleDetailsDialogProps {
  module: ModuleWithCategory | null;
  schoolGroupId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ModuleDetailsDialog = ({
  module,
  schoolGroupId,
  isOpen,
  onClose,
}: ModuleDetailsDialogProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: usageData, isLoading: usageLoading } = useModuleUsageBySchool(
    schoolGroupId,
    module?.id
  );

  const handleNavigateToSchool = (schoolId: string) => {
    onClose();
    navigate(`/dashboard/schools/${schoolId}`);
  };

  const handleLaunchModule = () => {
    if (!module) return;
    onClose();
    // Navigation vers le module (convention de nommage standard)
    navigate(`/dashboard/modules/${module.slug}`);
  };

  if (!module) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{
                backgroundColor: module.category?.color ? `${module.category.color}20` : '#E5E7EB',
              }}
            >
              <Package
                className="h-8 w-8"
                style={{
                  color: module.category?.color || '#6B7280',
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900">{module.name}</h2>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      v{module.version}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{module.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {module.category?.name}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Inclus dans le plan {(module as any).required_plan}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={handleLaunchModule}
                  className="bg-[#2A9D8F] hover:bg-[#238276] text-white shadow-sm gap-2"
                  size="lg"
                >
                  <Rocket className="h-4 w-4" />
                  Accéder au module
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 border-b border-gray-100">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="schools" className="gap-2">
                <Building2 className="h-4 w-4" />
                Écoles & Usage
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden bg-gray-50/50">
            <ScrollArea className="h-full">
              <div className="p-6">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Features */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4">Fonctionnalités principales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {module.features && module.features.length > 0 ? (
                        module.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic col-span-2">Aucune fonctionnalité listée.</p>
                      )}
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold mb-4">Documentation</h3>
                      <p className="text-gray-600 mb-4">
                        Accédez aux guides complets pour maîtriser ce module.
                      </p>
                      {(module as any).documentationUrl ? (
                        <Button variant="outline" className="w-full gap-2" onClick={() => window.open((module as any).documentationUrl, '_blank')}>
                          <BookOpen className="h-4 w-4" />
                          Lire la documentation
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full gap-2" disabled>
                          <BookOpen className="h-4 w-4" />
                          Bientôt disponible
                        </Button>
                      )}
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold mb-4">Tutoriels Vidéo</h3>
                      <p className="text-gray-600 mb-4">
                        Regardez nos vidéos explicatives étape par étape.
                      </p>
                      {(module as any).videoUrl ? (
                        <Button variant="outline" className="w-full gap-2" onClick={() => window.open((module as any).videoUrl, '_blank')}>
                          <PlayCircle className="h-4 w-4" />
                          Voir les tutoriels
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full gap-2" disabled>
                          <PlayCircle className="h-4 w-4" />
                          Bientôt disponible
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schools" className="mt-0">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Utilisation par école</h3>
                        <p className="text-sm text-gray-500">
                          Suivez l'adoption de ce module dans vos établissements
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {usageData?.length || 0} Écoles
                      </Badge>
                    </div>
                    
                    {usageLoading ? (
                      <div className="p-12 text-center text-gray-500">Chargement des données...</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>École</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead className="text-center">Utilisateurs Actifs</TableHead>
                            <TableHead>Dernière activité</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usageData?.map((school) => (
                            <TableRow key={school.school_id} className="hover:bg-gray-50/50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                    {school.school_name.substring(0, 2).toUpperCase()}
                                  </div>
                                  {school.school_name}
                                </div>
                              </TableCell>
                              <TableCell>{school.city}</TableCell>
                              <TableCell className="text-center">
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                  <Users className="h-3 w-3" />
                                  {school.active_users_count}
                                </div>
                              </TableCell>
                              <TableCell>
                                {school.last_active_at ? (
                                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(school.last_active_at), 'dd MMM yyyy', { locale: fr })}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleNavigateToSchool(school.school_id)}
                                >
                                  Détails
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!usageData || usageData.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                Aucune école trouvée dans ce groupe.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="config" className="mt-0">
                  <div className="bg-white rounded-xl p-12 text-center border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration Globale</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Les paramètres de configuration avancés pour ce module seront bientôt disponibles ici. Vous pourrez définir des règles par défaut pour toutes vos écoles.
                    </p>
                    <Button disabled>
                      Configurer le module
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
