/**
 * Composant catalogue de ressources avec recherche et filtres
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { RESOURCE_CATALOG, CATEGORIES } from './resource-catalog';
import type { Resource, CartItem } from './resource-request.types';

interface ResourceCatalogProps {
  cart: CartItem[];
  onAddToCart: (resource: Resource) => void;
  formatPrice: (price: number) => string;
}

export const ResourceCatalog = ({ cart, onAddToCart, formatPrice }: ResourceCatalogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  // Filtrer les ressources
  const filteredResources = RESOURCE_CATALOG.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="space-y-3">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une ressource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Catégories */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des ressources */}
      <div className="border rounded-lg max-h-96 overflow-y-auto">
        {filteredResources.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune ressource trouvée</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredResources.map((resource) => {
              const inCart = cart.find(item => item.resource.id === resource.id);
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{resource.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {resource.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>Unité: {resource.unit}</span>
                        {resource.estimatedPrice && resource.estimatedPrice > 0 && (
                          <span className="font-medium text-green-600">
                            ~{formatPrice(resource.estimatedPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => onAddToCart(resource)}
                      size="sm"
                      className={`gap-2 ${
                        inCart
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      {inCart ? `Dans le panier (${inCart.quantity})` : 'Ajouter'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
