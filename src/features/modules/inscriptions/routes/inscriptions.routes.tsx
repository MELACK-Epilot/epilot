/**
 * Routes du module Inscriptions
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { InscriptionsHub } from '../pages/InscriptionsHub';
import { InscriptionsListe } from '../pages/InscriptionsListe';

/**
 * Composant principal du module Inscriptions
 * Gère toutes les routes internes du module
 */
export const InscriptionsModule = () => {
  return (
    <Routes>
      {/* Dashboard du module - Page d'accueil avec Welcome Card */}
      <Route index element={<InscriptionsHub />} />
      
      {/* Liste complète des inscriptions */}
      <Route path="liste" element={<InscriptionsListe />} />
      
      {/* Détails d'une inscription - TODO: Créer la page */}
      <Route path=":id" element={<Navigate to="/dashboard/modules/inscriptions/liste" replace />} />
    </Routes>
  );
};
