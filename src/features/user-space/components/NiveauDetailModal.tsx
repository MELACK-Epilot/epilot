/**
 * Modal de détail pour un niveau éducatif
 * Affiche des informations détaillées, graphiques et actions spécifiques
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X,
  Users,
  BookOpen,
  UserCheck,
  Target,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Download,
  Eye,
  Edit,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface NiveauData {
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
}

interface ClasseDetail {
  id: string;
  nom: string;
  effectif: number;
  enseignant: string;
  taux_reussite: number;
  salle: string;
}

interface NiveauDetailModalProps {
  niveau: NiveauData | null;
  isOpen: boolean;
  onClose: () => void;
}

const NiveauDetailModal = memo(({ niveau, isOpen, onClose }: NiveauDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!niveau) return null;

  // Données simulées pour les détails
  const classesData: ClasseDetail[] = [
    {
      id: '1',
      nom: `${niveau.nom} A`,
      effectif: Math.floor(niveau.kpis.eleves / niveau.kpis.classes),
      enseignant: 'Mme Dubois',
      taux_reussite: niveau.kpis.taux_reussite + Math.floor(Math.random() * 10) - 5,
      salle: 'A101'
    },
    {
      id: '2',
      nom: `${niveau.nom} B`,
      effectif: Math.floor(niveau.kpis.eleves / niveau.kpis.classes),
      enseignant: 'M. Martin',
      taux_reussite: niveau.kpis.taux_reussite + Math.floor(Math.random() * 10) - 5,
      salle: 'A102'
    },
    {
      id: '3',
      nom: `${niveau.nom} C`,
      effectif: Math.floor(niveau.kpis.eleves / niveau.kpis.classes),
      enseignant: 'Mme Leroy',
      taux_reussite: niveau.kpis.taux_reussite + Math.floor(Math.random() * 10) - 5,
      salle: 'A103'
    }
  ].slice(0, niveau.kpis.classes);

  // Données pour les graphiques
  const evolutionData = [
    { mois: 'Sep', eleves: niveau.kpis.eleves - 20, taux: niveau.kpis.taux_reussite - 5 },
    { mois: 'Oct', eleves: niveau.kpis.eleves - 15, taux: niveau.kpis.taux_reussite - 3 },
    { mois: 'Nov', eleves: niveau.kpis.eleves - 10, taux: niveau.kpis.taux_reussite - 1 },
    { mois: 'Déc', eleves: niveau.kpis.eleves - 5, taux: niveau.kpis.taux_reussite + 1 },
    { mois: 'Jan', eleves: niveau.kpis.eleves, taux: niveau.kpis.taux_reussite }
  ];

  const repartitionData = [
    { name: 'Garçons', value: Math.floor(niveau.kpis.eleves * 0.52), color: '#3B82F6' },
    { name: 'Filles', value: Math.floor(niveau.kpis.eleves * 0.48), color: '#EC4899' }
  ];

  const matieresData = [
    { matiere: 'Français', moyenne: niveau.kpis.taux_reussite + 2 },
    { matiere: 'Mathématiques', moyenne: niveau.kpis.taux_reussite - 3 },
    { matiere: 'Sciences', moyenne: niveau.kpis.taux_reussite + 1 },
    { matiere: 'Histoire-Géo', moyenne: niveau.kpis.taux_reussite - 1 },
    { matiere: 'Anglais', moyenne: niveau.kpis.taux_reussite + 3 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.name === 'Taux' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${niveau.couleur} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <niveau.icone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Détails - {niveau.nom}
                  </DialogTitle>
                  <p className="text-gray-600">
                    {niveau.kpis.eleves} élèves • {niveau.kpis.classes} classes • {niveau.kpis.enseignants} enseignants
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`${
                    niveau.kpis.taux_reussite >= 85 ? 'bg-green-50 text-green-700 border-green-200' :
                    niveau.kpis.taux_reussite >= 75 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {niveau.kpis.taux_reussite >= 85 ? 'Excellent' :
                   niveau.kpis.taux_reussite >= 75 ? 'Satisfaisant' : 'À améliorer'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Contenu avec onglets */}
          <div className="flex-1 overflow-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="classes" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <PieChart className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Actions
                </TabsTrigger>
              </TabsList>

              {/* Onglet Vue d'ensemble */}
              <TabsContent value="overview" className="space-y-6">
                {/* KPIs détaillés */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Élèves</p>
                        <p className="text-xl font-bold text-gray-900">{niveau.kpis.eleves}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Ratio: {(niveau.kpis.eleves / niveau.kpis.enseignants).toFixed(1)} élèves/enseignant
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Classes</p>
                        <p className="text-xl font-bold text-gray-900">{niveau.kpis.classes}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Moyenne: {Math.floor(niveau.kpis.eleves / niveau.kpis.classes)} élèves/classe
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Enseignants</p>
                        <p className="text-xl font-bold text-gray-900">{niveau.kpis.enseignants}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Personnel qualifié</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Target className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Taux Réussite</p>
                        <p className="text-xl font-bold text-gray-900">{niveau.kpis.taux_reussite}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {niveau.kpis.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {niveau.kpis.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      <p className="text-xs text-gray-500">
                        {niveau.kpis.trend === 'up' ? 'En progression' : 
                         niveau.kpis.trend === 'down' ? 'En baisse' : 'Stable'}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Graphique d'évolution */}
                <Card className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Évolution sur l'année</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="mois" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="eleves" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Élèves"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="taux" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Taux"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </TabsContent>

              {/* Onglet Classes */}
              <TabsContent value="classes" className="space-y-4">
                <div className="grid gap-4">
                  {classesData.map((classe) => (
                    <Card key={classe.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${niveau.couleur} rounded-xl flex items-center justify-center`}>
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{classe.nom}</h4>
                            <p className="text-sm text-gray-600">
                              {classe.enseignant} • Salle {classe.salle}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Effectif</p>
                            <p className="text-lg font-bold text-gray-900">{classe.effectif}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Taux Réussite</p>
                            <p className={`text-lg font-bold ${
                              classe.taux_reussite >= 85 ? 'text-green-600' :
                              classe.taux_reussite >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {classe.taux_reussite}%
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Onglet Analytics */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Répartition par genre */}
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Genre</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <RechartsPieChart data={repartitionData}>
                            {repartitionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </RechartsPieChart>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                      {repartitionData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm text-gray-600">
                            {entry.name}: {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Performance par matière */}
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance par Matière</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={matieresData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="matiere" stroke="#6B7280" fontSize={12} />
                          <YAxis stroke="#6B7280" />
                          <Tooltip />
                          <Bar dataKey="moyenne" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Onglet Actions */}
              <TabsContent value="actions" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="h-auto p-4 flex-col gap-2" variant="outline">
                    <FileText className="h-6 w-6 text-blue-500" />
                    <span className="font-medium">Générer Rapport</span>
                    <span className="text-xs text-gray-500">Rapport détaillé du niveau</span>
                  </Button>
                  
                  <Button className="h-auto p-4 flex-col gap-2" variant="outline">
                    <Download className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Exporter Données</span>
                    <span className="text-xs text-gray-500">Export Excel/PDF</span>
                  </Button>
                  
                  <Button className="h-auto p-4 flex-col gap-2" variant="outline">
                    <Mail className="h-6 w-6 text-purple-500" />
                    <span className="font-medium">Contacter Enseignants</span>
                    <span className="text-xs text-gray-500">Email groupé</span>
                  </Button>
                  
                  <Button className="h-auto p-4 flex-col gap-2" variant="outline">
                    <Calendar className="h-6 w-6 text-orange-500" />
                    <span className="font-medium">Planifier Réunion</span>
                    <span className="text-xs text-gray-500">Conseil de niveau</span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

NiveauDetailModal.displayName = 'NiveauDetailModal';

export default NiveauDetailModal;
