/**
 * WelcomeHero - En-tête de bienvenue pour le Chef d'Établissement
 * Affiche les informations de l'utilisateur et de l'école
 * 
 * @module ChefEtablissement/Components
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Award, 
  Building2, 
  Package,
  MapPin,
  Phone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChefInfo, SchoolInfo } from '../../../types/chef-etablissement.types';
import { CHEF_ROLE_LABELS } from '../../../types/chef-etablissement.types';

interface WelcomeHeroProps {
  readonly chef: ChefInfo;
  readonly school: SchoolInfo;
  readonly modulesCount: number;
  readonly categoriesCount: number;
}

/**
 * Obtenir le message de salutation selon l'heure
 */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

/**
 * Formater la date du jour
 */
const formatDate = (): string => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const WelcomeHero = memo<WelcomeHeroProps>(({
  chef,
  school,
  modulesCount,
  categoriesCount,
}) => {
  const greeting = getGreeting();
  const date = formatDate();
  const roleLabel = CHEF_ROLE_LABELS[chef.role] || 'Chef d\'Établissement';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1D3557] via-[#1D3557] to-[#2A9D8F] p-6 md:p-8 text-white shadow-xl"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E9C46A] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: User Info */}
          <div className="flex-1">
            {/* Greeting */}
            <p className="text-white/70 text-sm md:text-base mb-1">
              {greeting},
            </p>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
              {chef.firstName} {chef.lastName}
            </h1>

            {/* Role & School */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                <Award className="h-3.5 w-3.5 mr-1.5" />
                {roleLabel}
              </Badge>
              <Badge className="bg-[#2A9D8F]/50 text-white border-0 hover:bg-[#2A9D8F]/70">
                <Building2 className="h-3.5 w-3.5 mr-1.5" />
                {school.name}
              </Badge>
            </div>

            {/* Date & Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span className="capitalize">{date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                <span>{modulesCount} modules • {categoriesCount} catégories</span>
              </div>
            </div>
          </div>

          {/* Right: School Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="hidden lg:block"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[280px] border border-white/10">
              {/* School Logo or Icon */}
              <div className="flex items-center gap-4 mb-3">
                {school.logo ? (
                  <img 
                    src={school.logo} 
                    alt={school.name}
                    className="w-14 h-14 rounded-xl object-cover bg-white"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">{school.name}</h3>
                  <p className="text-sm text-white/70">{school.schoolGroupName}</p>
                </div>
              </div>

              {/* School Info */}
              <div className="space-y-2 text-sm">
                {school.address && (
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{school.address}</span>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{school.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

WelcomeHero.displayName = 'WelcomeHero';

export default WelcomeHero;
