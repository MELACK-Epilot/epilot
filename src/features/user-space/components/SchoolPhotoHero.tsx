/**
 * Hero Section avec photo d'école réelle
 * Design inspiré de l'image de référence
 * React 19 Best Practices
 * 
 * @module SchoolPhotoHero
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sun, MapPin, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SchoolPhotoHeroProps {
  user: any;
  schoolPhotoUrl?: string; // URL de la photo de l'école
}

export const SchoolPhotoHero = memo(({ user, schoolPhotoUrl }: SchoolPhotoHeroProps) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const currentDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Classes CSS réutilisables
  const badgeClasses = "bg-white/15 text-white border-0 backdrop-blur-sm px-4 py-2 hover:bg-white/25 transition-colors";
  const decorativeCircleClasses = "w-full h-full bg-white rounded-full";
  
  // Données des badges pour éviter la répétition
  const badges = [
    { icon: Calendar, text: currentDate, className: "capitalize" },
    { icon: Sun, text: "Ensoleillé 28°C" },
    { icon: MapPin, text: "Sembé, Congo" },
    { 
      icon: Award, 
      text: user?.role === 'proviseur' ? 'Proviseur' : 
            user?.role === 'directeur' ? 'Directeur' : 
            user?.role?.replace('_', ' ') 
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative h-60 rounded-3xl overflow-hidden shadow-2xl mb-8"
    >
      {/* Photo d'école en arrière-plan */}
      <div className="absolute inset-0">
        {schoolPhotoUrl ? (
          <>
            <img 
              src={schoolPhotoUrl} 
              alt="École" 
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient pour lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          </>
        ) : (
          <>
            {/* Fallback gradient si pas de photo */}
            <div className="w-full h-full bg-gradient-to-r from-[#2A9D8F] via-[#238b7e] to-[#1d7a6f]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
          </>
        )}
        
        {/* Motif décoratif */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
          <div className={`${decorativeCircleClasses} -mr-48 -mt-48`} />
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-10">
          <div className={`${decorativeCircleClasses} -ml-32 -mb-32`} />
        </div>
      </div>
      
      {/* Contenu superposé */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Titre et infos en haut */}
        <div className="p-8 flex-1">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-white/90 text-lg mb-2 font-medium">
              {greeting}, {user?.firstName} !
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
              {user?.school?.name || 'École Charles Zackama'}
            </h1>
            <p className="text-white/80 text-base">
              {user?.school?.type || 'Sembé Eh École terminale'}
            </p>
          </motion.div>
        </div>

        {/* KPI en bas avec transparence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/30 backdrop-blur-md border-t border-white/10"
        >
          <div className="px-8 py-4">
            <div className="flex flex-wrap gap-3">
              {badges.map((badge, index) => {
                const IconComponent = badge.icon;
                return (
                  <Badge key={index} className={badgeClasses}>
                    <IconComponent className="h-4 w-4 mr-2" />
                    <span className={badge.className || ""}>{badge.text}</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

SchoolPhotoHero.displayName = 'SchoolPhotoHero';
