/**
 * Page d'informations sur le groupe scolaire
 * Affiche les détails du groupe, les écoles et les actions possibles
 * 
 * @module SchoolGroupPage
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SchoolGroupInfo } from '../components/SchoolGroupInfo';

/**
 * Page principale du groupe scolaire
 */
export const SchoolGroupPage = memo(() => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Groupe Scolaire</h1>
          <p className="text-gray-600 mt-1">
            Informations et statistiques de votre groupe scolaire
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <SchoolGroupInfo />
    </motion.div>
  );
});

SchoolGroupPage.displayName = 'SchoolGroupPage';
