/**
 * Page Catégories Métiers - Version complète avec données réelles
 * @module Categories
 */

import { useState } from 'react';
import { Plus, Search, MoreVertical, Edit, Trash2, Tag, Layers, Eye, Package, TrendingUp, Activity, AlertCircle, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '../components/DataTable';
import { AnimatedCard, AnimatedContainer, AnimatedItem } from '../components/AnimatedCard';
import { CategoryFormDialog } from '../components/CategoryFormDialog';
import { useCategories, useCategoryStats, useDeleteCategory, useCategoryModules } from '../hooks/useCategories';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  status: 'active' | 'inactive';
  moduleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const Categories = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { data: categories, isLoading, error, isError } = useCategories({ query: searchQuery, status: statusFilter });
  const { data: stats } = useCategoryStats();
  const { data: categoryModules } = useCategoryModules(selectedCategory?.id || '');
  const deleteCategory = useDeleteCategory();

  const handleViewDetails = (category: Category) => {
    setSelectedCategory(category);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await deleteCategory.mutateAsync(id);
        toast.success('Catégorie supprimée avec succès');
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  // Gestion d'erreur
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Erreur de chargement</h3>
              <p className="text-sm text-red-700">
                {error?.message || 'Impossible de charger les catégories. Veuillez réessayer.'}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Données pour les graphiques
  const distributionData = categories?.slice(0, 6).map((cat) => ({
    name: cat.name,
    value: cat.moduleCount || 0,
    color: cat.color,
  })) || [];

  const barChartData = categories?.slice(0, 8).map((cat) => ({
    name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
    modules: cat.moduleCount || 0,
  })) || [];

  const columns = [
    {
      accessorKey: 'name',
      header: 'Catégorie',
      cell: ({ row }: any) => {
        const cat = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
              <Tag className="w-5 h-5" style={{ color: cat.color }} />
            </div>
            <div>
              <div className="font-medium text-gray-900">{cat.name}</div>
              <div className="text-xs text-gray-500">{cat.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: any) => (
        <div className="text-sm text-gray-600 max-w-md truncate">{row.original.description}</div>
      ),
    },
    {
      accessorKey: 'moduleCount',
      header: 'Modules',
      cell: ({ row }: any) => {
        const count = row.original.moduleCount || 0;
        return (
          <Badge 
            variant="outline" 
            className={count > 0 ? 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20' : ''}
          >
            <Package className="h-3 w-3 mr-1" />
            {count} module{count > 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge className={status === 'active' ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' : 'bg-gray-100 text-gray-600'}>
            {status === 'active' ? 'Actif' : 'Inactif'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const cat = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewDetails(cat)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(cat)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(cat.id)} className="text-[#E63946]">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Tag className="h-8 w-8 text-[#1D3557]" />
            Catégories Métiers
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez les catégories de modules pédagogiques
          </p>
        </div>
        <Button 
          className="bg-[#2A9D8F] hover:bg-[#1D3557]"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une catégorie
        </Button>
      </div>

      {/* Stats Cards - Design Moderne avec Glassmorphism */}
      <AnimatedContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.05}>
        <AnimatedItem>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1D3557] to-[#0d1f3d] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Total Catégories</p>
              <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#2A9D8F] to-[#1d7a6f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Tag className="h-6 w-6 text-white" />
                </div>
                <Activity className="h-5 w-5 text-white/60" />
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Actives</p>
              <p className="text-3xl font-bold text-white">{stats?.active || 0}</p>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Tag className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Inactives</p>
              <p className="text-3xl font-bold text-white">{stats?.inactive || 0}</p>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#E9C46A] to-[#d4a84f] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-white/90 text-xs font-semibold bg-white/10 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  +12%
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Total Modules</p>
              <p className="text-3xl font-bold text-white">{stats?.totalModules || 0}</p>
            </div>
          </div>
        </AnimatedItem>
      </AnimatedContainer>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des modules par catégorie */}
        <AnimatedCard delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Répartition des modules</CardTitle>
              <CardDescription>Par catégorie (Top 6)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={distributionData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    labelLine={false}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Graphique en barres */}
        <AnimatedCard delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Modules par catégorie</CardTitle>
              <CardDescription>Top 8 catégories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888" fontSize={11} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="modules" fill="#2A9D8F" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Affichage Grid ou Table */}
      {viewMode === 'grid' ? (
        <AnimatedContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" stagger={0.05}>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
            ))
          ) : categories && categories.length > 0 ? (
            categories.map((cat) => (
              <AnimatedItem key={cat.id}>
                <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{ backgroundColor: cat.color }}
                  />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <Tag className="w-6 h-6" style={{ color: cat.color }} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(cat)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(cat)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(cat.id)} className="text-[#E63946]">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{cat.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{cat.slug}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{cat.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={cat.moduleCount && cat.moduleCount > 0 ? 'bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/20' : ''}
                      >
                        <Package className="h-3 w-3 mr-1" />
                        {cat.moduleCount || 0} module{(cat.moduleCount || 0) > 1 ? 's' : ''}
                      </Badge>
                      <Badge className={cat.status === 'active' ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' : 'bg-gray-100 text-gray-600'}>
                        {cat.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Aucune catégorie trouvée</p>
            </div>
          )}
        </AnimatedContainer>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <DataTable columns={columns} data={categories || []} isLoading={isLoading} />
        </div>
      )}

      {/* Dialog Vue Détaillée */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-6 w-6" style={{ color: selectedCategory?.color }} />
              {selectedCategory?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informations de la catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Slug</p>
                    <p className="font-medium">{selectedCategory?.slug}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <Badge className={selectedCategory?.status === 'active' ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' : 'bg-gray-100 text-gray-600'}>
                      {selectedCategory?.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Couleur</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: selectedCategory?.color }} />
                      <span className="font-medium">{selectedCategory?.color}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nombre de modules</p>
                    <p className="font-medium">{selectedCategory?.moduleCount || 0} module(s)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des modules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#2A9D8F]" />
                  Modules associés ({categoryModules?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryModules && categoryModules.length > 0 ? (
                  <div className="space-y-3">
                    {categoryModules.map((module: any) => (
                      <div 
                        key={module.id} 
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" 
                          style={{ backgroundColor: `${module.color || selectedCategory?.color}15` }}
                        >
                          <Package className="w-5 h-5" style={{ color: module.color || selectedCategory?.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{module.name}</h4>
                            {module.is_premium && (
                              <Badge className="bg-[#E9C46A]/10 text-[#E9C46A] text-xs">Premium</Badge>
                            )}
                            {module.is_core && (
                              <Badge className="bg-[#1D3557]/10 text-[#1D3557] text-xs">Core</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500">v{module.version}</span>
                            <Badge variant="outline" className="text-xs">
                              {module.required_plan}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                module.status === 'active' ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' : 
                                module.status === 'beta' ? 'bg-[#E9C46A]/10 text-[#E9C46A]' : 
                                'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {module.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucun module associé à cette catégorie</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Fermer
            </Button>
            <Button 
              className="bg-[#2A9D8F] hover:bg-[#1D3557]"
              onClick={() => {
                setIsDetailDialogOpen(false);
                handleEdit(selectedCategory!);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Création */}
      <CategoryFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
      />

      {/* Dialog Modification */}
      <CategoryFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        category={selectedCategory}
        mode="edit"
      />
    </div>
  );
};

export default Categories;
