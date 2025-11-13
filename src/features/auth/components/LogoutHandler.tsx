/**
 * Composant pour gérer la déconnexion proprement sans clignotement
 * @module LogoutHandler
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { supabase } from '@/lib/supabase';

export const LogoutHandler = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const handleLogout = async () => {
      try {
        console.log('🚪 Déconnexion en cours...');
        
        // 1. Nettoyage store Zustand IMMÉDIATEMENT
        logout();
        
        // 2. Nettoyage localStorage
        localStorage.removeItem('e-pilot-auth');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-refresh-token');
        
        // 3. Déconnexion Supabase (en arrière-plan)
        supabase.auth.signOut().catch(e => {
          console.warn('Erreur Supabase signOut (ignorée):', e);
        });
        
        // 4. Nettoyage IndexedDB (en arrière-plan)
        if ('indexedDB' in window) {
          try {
            indexedDB.deleteDatabase('auth-db');
          } catch (e) {
            console.warn('Impossible de nettoyer IndexedDB:', e);
          }
        }
        
        console.log('✅ Déconnexion terminée');
        
        // 5. Redirection IMMÉDIATE vers login (sans délai)
        if (isMounted) {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // Rediriger quand même vers login
        if (isMounted) {
          navigate('/login', { replace: true });
        }
      }
    };

    handleLogout();

    return () => {
      isMounted = false;
    };
  }, [logout, navigate]);

  // Afficher un loader pendant la déconnexion
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1D3557] to-[#2A9D8F]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-medium">Déconnexion en cours...</p>
      </div>
    </div>
  );
};
