/**
 * Catalogue de ressources disponibles pour les demandes
 */

import type { Resource } from './resource-request.types';

export const RESOURCE_CATALOG: Resource[] = [
  // Matériel Informatique
  { id: '1', name: 'Ordinateur portable', category: 'Informatique', unit: 'unité', estimatedPrice: 350000 },
  { id: '2', name: 'Ordinateur de bureau', category: 'Informatique', unit: 'unité', estimatedPrice: 250000 },
  { id: '3', name: 'Imprimante', category: 'Informatique', unit: 'unité', estimatedPrice: 75000 },
  { id: '4', name: 'Projecteur', category: 'Informatique', unit: 'unité', estimatedPrice: 150000 },
  { id: '5', name: 'Tablette', category: 'Informatique', unit: 'unité', estimatedPrice: 120000 },
  
  // Mobilier
  { id: '6', name: 'Bureau enseignant', category: 'Mobilier', unit: 'unité', estimatedPrice: 45000 },
  { id: '7', name: 'Chaise', category: 'Mobilier', unit: 'unité', estimatedPrice: 15000 },
  { id: '8', name: 'Table-banc élève', category: 'Mobilier', unit: 'unité', estimatedPrice: 25000 },
  { id: '9', name: 'Armoire', category: 'Mobilier', unit: 'unité', estimatedPrice: 65000 },
  { id: '10', name: 'Tableau blanc', category: 'Mobilier', unit: 'unité', estimatedPrice: 35000 },
  
  // Fournitures
  { id: '11', name: 'Ramette papier A4', category: 'Fournitures', unit: 'ramette', estimatedPrice: 3500 },
  { id: '12', name: 'Marqueurs tableau', category: 'Fournitures', unit: 'boîte', estimatedPrice: 5000 },
  { id: '13', name: 'Cahiers', category: 'Fournitures', unit: 'paquet', estimatedPrice: 8000 },
  { id: '14', name: 'Stylos', category: 'Fournitures', unit: 'boîte', estimatedPrice: 4000 },
  
  // Matériel Pédagogique
  { id: '15', name: 'Manuels scolaires', category: 'Pédagogique', unit: 'lot', estimatedPrice: 15000 },
  { id: '16', name: 'Cartes géographiques', category: 'Pédagogique', unit: 'unité', estimatedPrice: 8000 },
  { id: '17', name: 'Matériel scientifique', category: 'Pédagogique', unit: 'kit', estimatedPrice: 85000 },
  
  // Autre
  { id: '18', name: 'Autre (à préciser)', category: 'Autre', unit: 'unité', estimatedPrice: 0 },
];

export const CATEGORIES = ['Tous', 'Informatique', 'Mobilier', 'Fournitures', 'Pédagogique', 'Autre'];
