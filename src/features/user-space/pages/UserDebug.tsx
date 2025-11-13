/**
 * Page de diagnostic pour l'espace utilisateur
 * À RETIRER EN PRODUCTION
 */

import { useCurrentUser } from '../hooks/useCurrentUser';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export const UserDebug = () => {
  const { data: user, isLoading, error } = useCurrentUser();
  const [authUser, setAuthUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setCheckLoading(true);
    try {
      // 1. Vérifier Auth
      const { data: { user: au }, error: authError } = await supabase.auth.getUser();
      setAuthUser(au);

      console.log('Auth User:', au);
      console.log('Auth Error:', authError);

      if (au) {
        // 2. Vérifier DB
        const { data, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', au.id)
          .single();

        setDbUser(data);

        console.log('DB User:', data);
        console.log('DB Error:', dbError);
      }
    } catch (err) {
      console.error('Check error:', err);
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🔍 Diagnostic Utilisateur</h1>
        <Button onClick={checkAuth} disabled={checkLoading}>
          {checkLoading ? 'Vérification...' : 'Rafraîchir'}
        </Button>
      </div>

      {/* Hook useCurrentUser */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Hook useCurrentUser()</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Loading:</span>
            <span className={isLoading ? 'text-orange-600' : 'text-green-600'}>
              {String(isLoading)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Error:</span>
            <span className={error ? 'text-red-600' : 'text-green-600'}>
              {error ? (error instanceof Error ? error.message : JSON.stringify(error)) : 'null'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">User:</span>
            <span className={user ? 'text-green-600' : 'text-red-600'}>
              {user ? 'Défini ✅' : 'undefined ❌'}
            </span>
          </div>
        </div>

        {user && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Données utilisateur :</h3>
            <pre className="text-xs bg-white p-3 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Auth Supabase */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Supabase Auth</h2>
        {authUser ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">ID:</span>
              <span className="text-sm text-gray-600 font-mono">{authUser.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              <span className="text-sm text-gray-600">{authUser.email}</span>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Auth complet :</h3>
              <pre className="text-xs bg-white p-3 rounded overflow-auto">
                {JSON.stringify(authUser, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-red-600">❌ Aucun utilisateur Auth</p>
        )}
      </Card>

      {/* DB public.users */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Table public.users</h2>
        {dbUser ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">ID:</span>
              <span className="text-sm text-gray-600 font-mono">{dbUser.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              <span className="text-sm text-gray-600">{dbUser.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Nom:</span>
              <span className="text-sm text-gray-600">{dbUser.first_name} {dbUser.last_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Rôle:</span>
              <span className="text-sm text-gray-600 font-semibold">{dbUser.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Groupe:</span>
              <span className="text-sm text-gray-600 font-mono">{dbUser.school_group_id || 'NULL'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <span className="text-sm text-gray-600">{dbUser.status}</span>
            </div>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">DB complet :</h3>
              <pre className="text-xs bg-white p-3 rounded overflow-auto">
                {JSON.stringify(dbUser, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-red-600">❌ Aucun utilisateur dans public.users</p>
        )}
      </Card>

      {/* Checklist */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Checklist</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={authUser ? 'text-green-600' : 'text-red-600'}>
              {authUser ? '✅' : '❌'}
            </span>
            <span>Utilisateur connecté (auth.users)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={dbUser ? 'text-green-600' : 'text-red-600'}>
              {dbUser ? '✅' : '❌'}
            </span>
            <span>Utilisateur existe (public.users)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={dbUser?.first_name ? 'text-green-600' : 'text-red-600'}>
              {dbUser?.first_name ? '✅' : '❌'}
            </span>
            <span>Prénom renseigné</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={dbUser?.last_name ? 'text-green-600' : 'text-red-600'}>
              {dbUser?.last_name ? '✅' : '❌'}
            </span>
            <span>Nom renseigné</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={dbUser?.role ? 'text-green-600' : 'text-red-600'}>
              {dbUser?.role ? '✅' : '❌'}
            </span>
            <span>Rôle défini</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={dbUser?.school_group_id ? 'text-green-600' : 'text-orange-600'}>
              {dbUser?.school_group_id ? '✅' : '⚠️'}
            </span>
            <span>Groupe scolaire assigné</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={dbUser?.status === 'active' ? 'text-green-600' : 'text-red-600'}>
              {dbUser?.status === 'active' ? '✅' : '❌'}
            </span>
            <span>Status = active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={user ? 'text-green-600' : 'text-red-600'}>
              {user ? '✅' : '❌'}
            </span>
            <span>Hook useCurrentUser() retourne les données</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/user'}
            className="w-full"
          >
            Aller au Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Rafraîchir la Page
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            className="w-full text-red-600"
          >
            Déconnexion
          </Button>
        </div>
      </Card>
    </div>
  );
};
