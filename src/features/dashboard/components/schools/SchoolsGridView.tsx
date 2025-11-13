/**
 * Vue en Cartes pour les Écoles - Design Premium
 * Alternative moderne au tableau
 */

import { motion } from 'framer-motion';
import { 
  School, 
  MapPin, 
  Users, 
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Building2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SchoolLevelBadges } from './SchoolLevelBadges';

interface SchoolsGridViewProps {
  schools: any[];
  onView: (school: any) => void;
  onEdit: (school: any) => void;
  onDelete: (school: any) => void;
}

export const SchoolsGridView = ({ schools, onView, onEdit, onDelete }: SchoolsGridViewProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'prive' 
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-green-100 text-green-700 border-green-200';
  };

  if (schools.length === 0) {
    return (
      <div className="text-center py-12">
        <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Aucune école trouvée</p>
        <p className="text-gray-400 text-sm mt-2">Ajustez vos filtres ou créez une nouvelle école</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {schools.map((school, index) => (
        <motion.div
          key={school.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:border-[#2A9D8F]">
            {/* Header avec Logo et Actions */}
            <div 
              className="relative h-32 p-4"
              style={{
                background: school.couleur_principale 
                  ? `linear-gradient(135deg, ${school.couleur_principale} 0%, ${school.couleur_principale}dd 50%, ${school.couleur_principale}99 100%)`
                  : 'linear-gradient(135deg, #1D3557 0%, #2A9D8F 50%, #E9C46A 100%)'
              }}
            >
              {/* Logo de l'école */}
              {school.logo_url ? (
                <img 
                  src={school.logo_url} 
                  alt={school.name}
                  className="w-16 h-16 rounded-xl bg-white p-2 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/90 flex items-center justify-center shadow-lg">
                  <School className="w-8 h-8 text-[#1D3557]" />
                </div>
              )}

              {/* Actions */}
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(school)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(school)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(school)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges Statut et Type */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge className={`${getStatusColor(school.status)} border`}>
                  {school.status === 'active' ? 'Active' : school.status === 'inactive' ? 'Inactive' : 'Suspendue'}
                </Badge>
                <Badge className={`${getTypeColor(school.type_etablissement)} border`}>
                  {school.type_etablissement === 'prive' ? 'Privé' : 'Public'}
                </Badge>
              </div>
            </div>

            <CardContent className="pt-6">
              {/* Nom et Code */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                  {school.name}
                </h3>
                <p className="text-sm text-gray-500 font-mono">
                  {school.code}
                </p>
              </div>

              {/* Localisation */}
              <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2A9D8F]" />
                <span className="line-clamp-2">
                  {school.city || 'Non spécifié'}, {school.departement || ''}
                </span>
              </div>

              {/* Niveaux d'enseignement */}
              <div className="mb-4">
                <SchoolLevelBadges 
                  has_preschool={school.has_preschool}
                  has_primary={school.has_primary}
                  has_middle={school.has_middle}
                  has_high={school.has_high}
                  size="sm"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Élèves</p>
                    <p className="text-sm font-bold text-gray-900">
                      {school.nombre_eleves_actuels || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                  <Users className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">Enseignants</p>
                    <p className="text-sm font-bold text-gray-900">
                      {school.nombre_enseignants || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2 pt-3 border-t">
                {school.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{school.phone}</span>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{school.email}</span>
                  </div>
                )}
                {school.annee_ouverture && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Ouverture : {school.annee_ouverture}</span>
                  </div>
                )}
              </div>

              {/* Bouton Voir Détails */}
              <Button 
                onClick={() => onView(school)}
                className="w-full mt-4 bg-gradient-to-r from-[#2A9D8F] to-[#1D8A7E] hover:from-[#1D8A7E] hover:to-[#2A9D8F]"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir détails
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
