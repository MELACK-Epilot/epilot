/**
 * Composant d'informations sur le groupe scolaire
 * Affiche les détails du groupe et actions possibles
 * 
 * @module SchoolGroupInfo
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  School, 
  Crown, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  Calendar,
  ExternalLink,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolGroup } from '../hooks/useSchoolGroup';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * Composant principal d'informations du groupe scolaire
 */
export const SchoolGroupInfo = memo(() => {
  const { data: user } = useCurrentUser();
  const { data: schoolGroup, isLoading, error } = useSchoolGroup();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !schoolGroup) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Groupe scolaire non disponible
          </h3>
          <p className="text-gray-600">
            Impossible de charger les informations de votre groupe scolaire.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-[#2A9D8F] via-[#238b7e] to-[#1d7a6f] p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Logo du groupe */}
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                {schoolGroup.logo ? (
                  <img 
                    src={schoolGroup.logo} 
                    alt={schoolGroup.name}
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-white" />
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-1">{schoolGroup.name}</h2>
                <p className="text-white/80 text-sm">
                  Groupe scolaire • Membre depuis {new Date(schoolGroup.created_at).getFullYear()}
                </p>
              </div>
            </div>

            {/* Badge plan */}
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-3 py-1">
              <Crown className="h-3 w-3 mr-1" />
              {schoolGroup.plan_name}
            </Badge>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6">
          {/* Description */}
          {schoolGroup.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">
              {schoolGroup.description}
            </p>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <School className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{schoolGroup.total_schools}</div>
              <div className="text-sm text-gray-600">
                École{schoolGroup.total_schools > 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{schoolGroup.total_users}</div>
              <div className="text-sm text-gray-600">Utilisateurs</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{schoolGroup.active_subscriptions}</div>
              <div className="text-sm text-gray-600">Abonnement actif</div>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="space-y-3 mb-6">
            {schoolGroup.address && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{schoolGroup.address}</span>
              </div>
            )}
            
            {schoolGroup.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{schoolGroup.phone}</span>
              </div>
            )}
            
            {schoolGroup.email && (
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{schoolGroup.email}</span>
              </div>
            )}
            
            {schoolGroup.website && (
              <div className="flex items-center gap-3 text-gray-600">
                <Globe className="h-4 w-4 flex-shrink-0" />
                <a 
                  href={schoolGroup.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#2A9D8F] hover:underline flex items-center gap-1"
                >
                  {schoolGroup.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Actions selon le rôle */}
          <div className="flex flex-wrap gap-3">
            {/* Actions pour tous les utilisateurs */}
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Voir les écoles
            </Button>

            {/* Actions spécifiques aux directeurs/proviseurs */}
            {['proviseur', 'directeur'].includes(user?.role || '') && (
              <>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter l'admin
                </Button>
                
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Demander une réunion
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

SchoolGroupInfo.displayName = 'SchoolGroupInfo';
