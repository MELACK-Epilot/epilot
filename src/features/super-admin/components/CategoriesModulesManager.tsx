/**
 * Gestionnaire Avancé des Catégories et Modules - Super Admin
 * Système robuste de niveau mondial avec toutes les fonctionnalités enterprise
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  History, 
  BarChart3,
  Settings,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getCategoryTheme } from '@/config/categories-colors';
import { SmartCategoriesView } from './SmartCategoriesView';

interface Category {
  id: string;
  name: string;
  description: string;
  slug?: string;
  modules_count: number;
  assigned_users_count: number;
  active_groups_count: number;
  created_at: string;
  updated_at: string;
}

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category_name: string;
  assigned_users_count: number;
  enabled_groups_count: number;
  created_at: string;
  updated_at: string;
}

interface SystemLimits {
  categories_max: number;
  modules_per_category_max: number;
  modules_total_max: number;
  category_name_length_max: number;
  module_name_length_max: number;
}

interface IntegrityCheck {
  check_name: string;
  status: string;
  details: string;
}

interface CleanupResult {
  table_name: string;
  count: number;
}

interface SnapshotResult {
  success: boolean;
  snapshot_id: string;
}

export const CategoriesModulesManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [systemLimits, setSystemLimits] = useState<SystemLimits | null>(null);
  const [integrityChecks, setIntegrityChecks] = useState<IntegrityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // États pour les modales
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // États pour les formulaires
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    slug: ''
  });
  const [moduleForm, setModuleForm] = useState({
    name: '',
    description: '',
    slug: '',
    category_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadModules(),
        loadSystemLimits(),
        runIntegrityChecks()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('v_categories_complete')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setCategories(data || []);
  };

  const loadModules = async () => {
    const { data, error } = await supabase
      .from('v_modules_complete')
      .select('*')
      .order('category_name', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    setModules(data || []);
  };

  const loadSystemLimits = async () => {
    const { data, error } = await supabase
      .from('system_limits')
      .select('limit_type, limit_value')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const limits = data?.reduce((acc, item: { limit_type: string; limit_value: number }) => {
      acc[item.limit_type as keyof SystemLimits] = item.limit_value;
      return acc;
    }, {} as SystemLimits);
    
    setSystemLimits(limits || null);
  };

  const runIntegrityChecks = async () => {
    const { data, error } = await (supabase.rpc as any)('validate_data_integrity');
    if (error) throw error;
    setIntegrityChecks(data || []);
  };

  const createSnapshot = async () => {
    try {
      const snapshotName = `Manual_Snapshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
      const { error } = await (supabase.rpc as any)('create_categories_modules_snapshot', {
        p_snapshot_name: snapshotName,
        p_description: 'Snapshot manuel créé par le Super Admin'
      });
      
      if (error) throw error;
      toast.success('Snapshot créé avec succès');
    } catch (error) {
      console.error('Erreur snapshot:', error);
      toast.error('Erreur lors de la création du snapshot');
    }
  };

  const cleanupOrphanedData = async () => {
    try {
      const { data, error } = await (supabase.rpc as any)('cleanup_orphaned_data');
      if (error) throw error;
      
      const totalCleaned = (data as CleanupResult[])?.reduce((sum: number, item: CleanupResult) => sum + item.count, 0) || 0;
      toast.success(`Nettoyage terminé: ${totalCleaned} éléments supprimés`);
      await loadData();
    } catch (error) {
      console.error('Erreur nettoyage:', error);
      toast.error('Erreur lors du nettoyage');
    }
  };

  const handleCreateCategory = async () => {
    try {
      if (editingCategory) {
        // Mode édition
        const updateData = {
          name: categoryForm.name,
          description: categoryForm.description,
          slug: categoryForm.slug
        };
        const { error } = await (supabase
          .from('business_categories') as any)
          .update(updateData)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        toast.success('Catégorie mise à jour avec succès');
      } else {
        // Mode création
        const { error } = await (supabase
          .from('business_categories') as any)
          .insert([categoryForm]);
        
        if (error) throw error;
        toast.success('Catégorie créée avec succès');
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', slug: '' });
      await loadData();
    } catch (error: unknown) {
      console.error('Erreur catégorie:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'opération';
      toast.error(errorMessage);
    }
  };

  const handleCreateModule = async () => {
    try {
      if (editingModule) {
        // Mode édition
        const updateData = {
          name: moduleForm.name,
          description: moduleForm.description,
          slug: moduleForm.slug,
          category_id: moduleForm.category_id
        };
        const { error } = await (supabase
          .from('modules') as any)
          .update(updateData)
          .eq('id', editingModule.id);
        
        if (error) throw error;
        toast.success('Module mis à jour avec succès');
      } else {
        // Mode création
        const { error } = await (supabase
          .from('modules') as any)
          .insert([moduleForm]);
        
        if (error) throw error;
        toast.success('Module créé avec succès');
      }
      
      setShowModuleModal(false);
      setEditingModule(null);
      setModuleForm({ name: '', description: '', slug: '', category_id: '' });
      await loadData();
    } catch (error: unknown) {
      console.error('Erreur module:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'opération';
      toast.error(errorMessage);
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || module.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'text-green-600 bg-green-50';
      case 'ATTENTION': return 'text-yellow-600 bg-yellow-50';
      case 'ERREUR': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateUsagePercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const resetCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', slug: '' });
  };

  const resetModuleModal = () => {
    setEditingModule(null);
    setModuleForm({ name: '', description: '', slug: '', category_id: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du système robuste...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions rapides */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <Shield className="inline h-8 w-8 mr-2 text-blue-600" />
            Gestionnaire Avancé - Catégories & Modules
          </h1>
          <p className="text-gray-600 mt-1">
            Système robuste de niveau mondial avec audit complet
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={createSnapshot} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Snapshot
          </Button>
          <Button onClick={cleanupOrphanedData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Nettoyer
          </Button>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Tableau de bord des métriques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            {systemLimits && (
              <div className="mt-2">
                <Progress 
                  value={calculateUsagePercentage(categories.length, systemLimits.categories_max)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {categories.length}/{systemLimits.categories_max} utilisées
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            {systemLimits && (
              <div className="mt-2">
                <Progress 
                  value={calculateUsagePercentage(modules.length, systemLimits.modules_total_max)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {modules.length}/{systemLimits.modules_total_max} utilisés
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Assignés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + cat.assigned_users_count, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total d'assignations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Intégrité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {integrityChecks.every(check => check.status === 'OK') ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
              )}
              <span className="text-sm font-medium">
                {integrityChecks.every(check => check.status === 'OK') ? 'Saine' : 'Attention'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes d'intégrité */}
      {integrityChecks.some(check => check.status !== 'OK') && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Problèmes d'intégrité détectés :</strong>
            <ul className="mt-2 space-y-1">
              {integrityChecks
                .filter(check => check.status !== 'OK')
                .map((check, index) => (
                  <li key={index} className="text-sm">
                    • {check.check_name}: {check.details}
                  </li>
                ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Légende des couleurs */}
          <Card>
            <CardHeader>
              <CardTitle>Légende des Catégories</CardTitle>
              <CardDescription>Chaque catégorie a sa propre identité visuelle pour faciliter l'identification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map(category => {
                  const theme = getCategoryTheme(category.name);
                  const Icon = theme.icon;
                  
                  return (
                    <div key={category.id} className={`flex items-center gap-2 p-2 rounded-lg ${theme.bgColor} border ${theme.borderColor}`}>
                      <div className={`w-6 h-6 rounded bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className={`text-xs font-medium ${theme.textColor} truncate`}>
                        {category.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition des modules par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Modules</CardTitle>
                <CardDescription>Distribution par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map(category => (
                    <div key={category.id} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{category.modules_count}</Badge>
                        <div className="w-20">
                          <Progress 
                            value={systemLimits ? calculateUsagePercentage(category.modules_count, systemLimits.modules_per_category_max) : 0} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contrôles d'intégrité */}
            <Card>
              <CardHeader>
                <CardTitle>Contrôles d'Intégrité</CardTitle>
                <CardDescription>Vérifications automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrityChecks.map((check, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{check.check_name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(check.status)}>
                          {check.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{check.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gestion des Catégories</h2>
            <Dialog open={showCategoryModal} onOpenChange={(open) => {
              setShowCategoryModal(open);
              if (!open) resetCategoryModal();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Catégorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Modifier la Catégorie' : 'Créer une Catégorie'}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? 'Modifier les informations de la catégorie' : 'Ajouter une nouvelle catégorie métier'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Nom</Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      placeholder="Ex: Gestion Académique"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-slug">Slug</Label>
                    <Input
                      id="category-slug"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                      placeholder="Ex: gestion-academique"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      placeholder="Description détaillée de la catégorie..."
                    />
                  </div>
                  <Button onClick={handleCreateCategory} className="w-full">
                    {editingCategory ? 'Mettre à jour' : 'Créer la Catégorie'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <SmartCategoriesView 
            categories={categories}
            onEditCategory={(category) => {
              setEditingCategory(category);
              setCategoryForm({
                name: category.name,
                description: category.description,
                slug: category.slug || ''
              });
              setShowCategoryModal(true);
            }}
            onViewCategory={(category) => {
              setSelectedCategory(category.id);
              setActiveTab('modules');
            }}
          />
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des Modules</h2>
            <Dialog open={showModuleModal} onOpenChange={(open) => {
              setShowModuleModal(open);
              if (!open) resetModuleModal();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Module
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingModule ? 'Modifier le Module' : 'Créer un Module'}</DialogTitle>
                  <DialogDescription>
                    {editingModule ? 'Modifier les informations du module' : 'Ajouter un nouveau module fonctionnel'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="module-name">Nom</Label>
                    <Input
                      id="module-name"
                      value={moduleForm.name}
                      onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
                      placeholder="Ex: Gestion des Notes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="module-category">Catégorie</Label>
                    <Select 
                      value={moduleForm.category_id} 
                      onValueChange={(value) => setModuleForm({...moduleForm, category_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="module-description">Description</Label>
                    <Textarea
                      id="module-description"
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                      placeholder="Description détaillée du module..."
                    />
                  </div>
                  <Button onClick={handleCreateModule} className="w-full">
                    {editingModule ? 'Mettre à jour' : 'Créer le Module'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtres */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map(module => {
              const theme = getCategoryTheme(module.category_name);
              const Icon = theme.icon;
              
              return (
                <Card key={module.id} className={`module-card flex flex-col border-l-4 ${theme.borderColor} hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                  <CardHeader className="card-header">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2 flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span>{module.name}</span>
                      </CardTitle>
                      <Badge className={`mb-3 w-fit ${theme.badgeColor} border-0`}>
                        {module.category_name}
                      </Badge>
                    </div>
                    <CardDescription className="flex-1 flex items-start">
                      <span className="text-sm leading-relaxed text-gray-600 line-clamp-4">
                        {module.description || 'Aucune description disponible pour ce module. Ce module fait partie du système E-Pilot Congo et offre des fonctionnalités essentielles pour la gestion de votre établissement scolaire.'}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="card-content">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Utilisateurs:</span>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">{module.assigned_users_count}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Groupes:</span>
                        <Badge variant="outline" className="border-gray-300 text-gray-700">{module.enabled_groups_count}</Badge>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={`border-2 transition-all duration-200 ${theme.borderColor} ${theme.textColor}`}
                        style={{
                          backgroundColor: 'transparent'
                        }}
                        onClick={() => {
                          setEditingModule(module);
                          setModuleForm({
                            name: module.name,
                            description: module.description,
                            slug: module.slug,
                            category_id: module.category_id
                          });
                          setShowModuleModal(true);
                        }}
                        onMouseEnter={(e) => {
                          const bgClass = theme.bgColor.replace('bg-', '');
                          e.currentTarget.style.backgroundColor = `var(--${bgClass})`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={`border-2 transition-all duration-200 ${theme.borderColor} ${theme.textColor}`}
                        style={{
                          backgroundColor: 'transparent'
                        }}
                        onClick={() => {
                          toast.info('Paramètres du module: ' + module.name);
                        }}
                        onMouseEnter={(e) => {
                          const bgClass = theme.bgColor.replace('bg-', '');
                          e.currentTarget.style.backgroundColor = `var(--${bgClass})`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <h2 className="text-xl font-semibold">Administration Système</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Limites système */}
            <Card>
              <CardHeader>
                <CardTitle>Limites Système</CardTitle>
                <CardDescription>Configuration des quotas</CardDescription>
              </CardHeader>
              <CardContent>
                {systemLimits && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Catégories max:</span>
                      <Badge>{systemLimits.categories_max}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Modules par catégorie:</span>
                      <Badge>{systemLimits.modules_per_category_max}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Modules total max:</span>
                      <Badge>{systemLimits.modules_total_max}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions système */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Système</CardTitle>
                <CardDescription>Maintenance et sauvegarde</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={createSnapshot} className="w-full" variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Créer un Snapshot
                </Button>
                <Button onClick={cleanupOrphanedData} className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Nettoyer les Données Orphelines
                </Button>
                <Button onClick={runIntegrityChecks} className="w-full" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Vérifier l'Intégrité
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
