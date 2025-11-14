/**
 * Vue intelligente des catégories avec relations
 * Interface principale avec performance optimale
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Grid3X3, List, Network } from 'lucide-react';
import { SmartCategoryCard } from './SmartCategoryCard';
import { CategoryRelationsLegend } from './CategoryRelationsLegend';
import { CATEGORY_GROUPS, getCategoryGroup, getCategoryConnectivityScore } from '@/config/categories-relations';

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

interface SmartCategoriesViewProps {
  categories: Category[];
  onEditCategory?: (category: Category) => void;
  onViewCategory?: (category: Category) => void;
}

export const SmartCategoriesView: React.FC<SmartCategoriesViewProps> = ({
  categories,
  onEditCategory,
  onViewCategory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'modules' | 'connectivity'>('connectivity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrage et tri des catégories
  const filteredAndSortedCategories = React.useMemo(() => {
    let filtered = categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          category.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === 'all' || getCategoryGroup(category.name) === selectedGroup;
      return matchesSearch && matchesGroup;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'modules':
          return b.modules_count - a.modules_count;
        case 'connectivity':
          return getCategoryConnectivityScore(b.name) - getCategoryConnectivityScore(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [categories, searchTerm, selectedGroup, sortBy]);

  // Grouper les catégories par groupe métier
  const categoriesByGroup = React.useMemo(() => {
    const grouped: Record<string, typeof categories> = {};
    
    Object.keys(CATEGORY_GROUPS).forEach(groupId => {
      grouped[groupId] = categories.filter(cat => getCategoryGroup(cat.name) === groupId);
    });
    
    return grouped;
  }, [categories]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="relations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="relations" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Relations Intelligentes
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Groupes Métier
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Guide & Légende
          </TabsTrigger>
        </TabsList>

        {/* Vue Relations Intelligentes */}
        <TabsContent value="relations" className="space-y-6">
          {/* Contrôles de filtrage */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher une catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous les groupes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {Object.entries(CATEGORY_GROUPS).map(([groupId, group]) => (
                    <SelectItem key={groupId} value={groupId}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: 'name' | 'modules' | 'connectivity') => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connectivity">Par Connectivité</SelectItem>
                  <SelectItem value="name">Par Nom</SelectItem>
                  <SelectItem value="modules">Par Modules</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredAndSortedCategories.length}</div>
              <div className="text-sm text-blue-700">Catégories Affichées</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredAndSortedCategories.reduce((sum, cat) => sum + cat.modules_count, 0)}
              </div>
              <div className="text-sm text-green-700">Modules Total</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(filteredAndSortedCategories.reduce((sum, cat) => sum + getCategoryConnectivityScore(cat.name), 0) / filteredAndSortedCategories.length) || 0}
              </div>
              <div className="text-sm text-purple-700">Score Moyen</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredAndSortedCategories.reduce((sum, cat) => sum + cat.assigned_users_count, 0)}
              </div>
              <div className="text-sm text-orange-700">Utilisateurs</div>
            </div>
          </div>

          {/* Grille des catégories */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredAndSortedCategories.map(category => (
              <SmartCategoryCard
                key={category.id}
                category={category}
                onEdit={onEditCategory}
                onView={onViewCategory}
              />
            ))}
          </div>

          {filteredAndSortedCategories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Aucune catégorie trouvée</h3>
              <p>Essayez de modifier vos critères de recherche ou de filtrage.</p>
            </div>
          )}
        </TabsContent>

        {/* Vue Groupes Métier */}
        <TabsContent value="groups" className="space-y-6">
          {Object.entries(CATEGORY_GROUPS).map(([groupId, group]) => {
            const groupCategories = categoriesByGroup[groupId] || [];
            
            return (
              <div key={groupId} className={`border-2 border-${group.color}-200 rounded-xl overflow-hidden`}>
                <div className={`bg-${group.color}-50 border-b-2 border-${group.color}-200 p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xl font-bold text-${group.color}-800`}>
                        {group.name}
                      </h3>
                      <p className={`text-${group.color}-600 mt-1`}>
                        {group.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`bg-${group.color}-100 text-${group.color}-700`}>
                        {groupCategories.length} catégories
                      </Badge>
                      <Badge variant="outline">
                        {groupCategories.reduce((sum, cat) => sum + cat.modules_count, 0)} modules
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupCategories.map(category => (
                      <SmartCategoryCard
                        key={category.id}
                        category={category}
                        onEdit={onEditCategory}
                        onView={onViewCategory}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Vue Guide & Légende */}
        <TabsContent value="guide">
          <CategoryRelationsLegend />
        </TabsContent>
      </Tabs>
    </div>
  );
};
