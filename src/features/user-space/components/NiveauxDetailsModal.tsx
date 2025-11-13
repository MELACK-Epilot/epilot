/**
 * Modal détails des niveaux scolaires
 * Affiche Maternel, Primaire, Collège, Lycée
 * React 19 Best Practices
 * 
 * @module NiveauxDetailsModal
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NiveauxDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const niveaux = [
  {
    name: 'Maternel',
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    eleves: 145,
    classes: 4,
    trend: '+8%',
    icon: '🍼'
  },
  {
    name: 'Primaire',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    eleves: 487,
    classes: 8,
    trend: '+5%',
    icon: '📚'
  },
  {
    name: 'Collège',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    eleves: 398,
    classes: 7,
    trend: '+2%',
    icon: '🎓'
  },
  {
    name: 'Lycée',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    eleves: 217,
    classes: 5,
    trend: '+3%',
    icon: '🏆'
  }
];

export const NiveauxDetailsModal = memo(({ isOpen, onClose }: NiveauxDetailsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2A9D8F] to-[#238b7e] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Niveaux Scolaires</h2>
                    <p className="text-white/80">Répartition des élèves par niveau</p>
                  </div>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Stats globales */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <Users className="h-8 w-8 text-[#2A9D8F] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">1,247</p>
                    <p className="text-sm text-gray-600">Élèves totaux</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <BookOpen className="h-8 w-8 text-[#2A9D8F] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">24</p>
                    <p className="text-sm text-gray-600">Classes totales</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-[#2A9D8F] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">+4.5%</p>
                    <p className="text-sm text-gray-600">Croissance</p>
                  </div>
                </div>

                {/* Grille des niveaux */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {niveaux.map((niveau, index) => (
                    <motion.div
                      key={niveau.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${niveau.bgColor} rounded-2xl p-6 border-2 border-transparent hover:border-[#2A9D8F] transition-all duration-300`}
                    >
                      {/* Header niveau */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{niveau.icon}</div>
                          <div>
                            <h3 className={`text-xl font-bold ${niveau.textColor}`}>
                              {niveau.name}
                            </h3>
                            <Badge className={`bg-gradient-to-r ${niveau.color} text-white border-0 mt-1`}>
                              {niveau.trend}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Stats niveau */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Élèves
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {niveau.eleves.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Classes
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {niveau.classes}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Moyenne/classe</span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.round(niveau.eleves / niveau.classes)}
                          </span>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="mt-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(niveau.eleves / 1247) * 100}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                            className={`h-full bg-gradient-to-r ${niveau.color}`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {((niveau.eleves / 1247) * 100).toFixed(1)}% du total
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-4 flex justify-end">
                <Button onClick={onClose} className="bg-[#2A9D8F] hover:bg-[#238b7e]">
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

NiveauxDetailsModal.displayName = 'NiveauxDetailsModal';
