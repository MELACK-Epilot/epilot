/**
 * Page Mes Catégories - Espace Utilisateur École
 * React 19 Best Practices
 */

import { motion } from 'framer-motion';
import { FolderOpen, Package, AlertCircle } from 'lucide-react';
import { useUserCategories } from '../hooks/useUserCategories';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const MyCategories = () => {
  const { data: categories, isLoading, error } = useUserCategories();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A9D8F] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 mb-4">
              Impossible de charger les catégories. Veuillez réessayer.
            </p>
            <Button onClick={() => window.location.reload()}>Réessayer</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-[#2A9D8F]" />
            Mes Catégories
          </h1>
          <p className="text-gray-600 mt-1">
            Catégories de modules disponibles pour votre établissement
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {categories?.length || 0} catégorie{(categories?.length || 0) > 1 ? 's' : ''}
        </Badge>
      </motion.div>

      {/* Grille des catégories */}
      {!categories || categories.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune catégorie disponible
            </h3>
            <p className="text-gray-600">
              Aucune catégorie n'est disponible pour le moment
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all cursor-pointer group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: category.color || '#2A9D8F' }}
                  >
                    {category.icon || '📁'}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-sm px-3 py-1"
                    style={{
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                    }}
                  >
                    {category.module_count || 0} module{(category.module_count || 0) > 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Contenu */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#2A9D8F] transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {category.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="h-4 w-4" />
                    <span>{category.slug}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#2A9D8F] hover:bg-[#2A9D8F]/10"
                  >
                    Voir →
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
