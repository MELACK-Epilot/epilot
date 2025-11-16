/**
 * Composants de chargement modernes et élégants
 * Plusieurs variantes pour différents contextes
 */

import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Users, TrendingUp } from 'lucide-react';

// ============================================
// 1. SKELETON LOADER (Style moderne)
// ============================================
export const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-1/4"></div>
          </div>
        </div>

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="animate-pulse space-y-3">
                <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 2. ANIMATED DOTS (Élégant et minimaliste)
// ============================================
export const AnimatedDotsLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
      <div className="text-center">
        {/* Logo ou Icône */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
        </motion.div>

        {/* Texte */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Chargement du dashboard
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 mb-8"
        >
          Préparation de vos données...
        </motion.p>

        {/* Dots animés */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-blue-600 rounded-full"
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// 3. PROGRESS BAR (Moderne avec étapes)
// ============================================
export const ProgressBarLoader = () => {
  const steps = [
    { icon: Users, label: "Chargement des élèves", delay: 0 },
    { icon: BookOpen, label: "Chargement des classes", delay: 0.5 },
    { icon: GraduationCap, label: "Chargement des enseignants", delay: 1 },
    { icon: TrendingUp, label: "Calcul des statistiques", delay: 1.5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl"
        >
          {/* Logo */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            E-Pilot Dashboard
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Chargement en cours...
          </p>

          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>

          {/* Étapes */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: step.delay }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"
                >
                  <step.icon className="h-4 w-4 text-blue-600" />
                </motion.div>
                <span className="text-sm text-gray-700">{step.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================
// 4. PULSE LOADER (Très moderne, style Apple)
// ============================================
export const PulseLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
      <div className="text-center">
        {/* Cercles pulsants */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border-4 border-blue-600 rounded-full"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut"
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
        </div>

        <motion.h2
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xl font-semibold text-gray-900"
        >
          Chargement du dashboard
        </motion.h2>
      </div>
    </div>
  );
};

// ============================================
// 5. CARD STACK LOADER (Très élégant)
// ============================================
export const CardStackLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-8">
      <div className="relative w-64 h-80">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 bg-white rounded-3xl shadow-2xl"
            initial={{ y: i * 20, scale: 1 - i * 0.05, opacity: 1 - i * 0.2 }}
            animate={{
              y: [i * 20, (i + 1) * 20, i * 20],
              scale: [1 - i * 0.05, 1 - (i + 1) * 0.05, 1 - i * 0.05],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          >
            <div className="p-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 6. SPINNER MODERNE (Personnalisé)
// ============================================
export const ModernSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner personnalisé */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 border-4 border-blue-200 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Chargement
        </h2>
        <p className="text-gray-600">
          Préparation de votre dashboard...
        </p>
      </div>
    </div>
  );
};

// ============================================
// Export par défaut (le plus moderne)
// ============================================
export default PulseLoader;
