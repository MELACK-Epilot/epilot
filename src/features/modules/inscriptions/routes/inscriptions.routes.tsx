/**
 * Routes du module Inscriptions
 */

import { Routes, Route } from 'react-router-dom';
import { InscriptionsHub } from '../pages/InscriptionsHub';
import { InscriptionsListe } from '../pages/InscriptionsListe';
import { InscriptionDetails } from '../pages/InscriptionDetails';

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
      
      {/* Détails d'une inscription */}
      <Route path=":id" element={<InscriptionDetails />} />
    </Routes>
  );
};
