/**
 * État vide pour utilisateur sans modules assignés
 * Design inspiré de la maquette utilisateur
 * React 19 Best Practices
 * 
 * @module EmptyModulesState
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Settings, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyModulesStateProps {
  onRequestAccess?: () => void;
}

export const EmptyModulesState = memo(({ onRequestAccess }: EmptyModulesStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-4"
    >
      {/* Message principal centré - Version compacte */}
      <Card className="max-w-lg mx-auto p-6 text-center bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
        {/* Icône animée */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative mx-auto mb-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#2A9D8F] to-[#238b7e] rounded-2xl flex items-center justify-center shadow-lg">
            <Settings className="h-10 w-10 text-white" />
          </div>
          {/* Sparkles décoratifs */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </motion.div>
        </motion.div>

        {/* Titre */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-3"
        >
          Aucun module assigné
        </motion.h3>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8 max-w-md mx-auto"
        >
          Contactez votre administrateur pour accéder aux modules et commencer à utiliser E-Pilot.
        </motion.p>

        {/* Bouton CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onRequestAccess}
            size="lg"
            className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] hover:from-[#238b7e] hover:to-[#1d7a6f] text-white shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Contacter l'administrateur
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </motion.div>

        {/* Info supplémentaire */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-500 mt-6"
        >
          💡 Astuce : L'administrateur peut vous assigner des modules depuis la page "Assigner des modules"
        </motion.p>
      </Card>

      {/* Grille de cartes fantômes compacte */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-8 max-w-4xl mx-auto"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="relative"
          >
            <Card className="p-4 bg-white/40 backdrop-blur-sm border border-dashed border-gray-200 h-28 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg mx-auto mb-1.5 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400">Module {index + 1}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
});

EmptyModulesState.displayName = 'EmptyModulesState';
