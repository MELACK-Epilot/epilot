/**
 * Vue Matricielle - Permissions & Modules
 * Visualisation users x catégories avec toggle rapide
 * @module MatrixPermissionsView
 */

import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/store/auth.store';
import { useUsers } from '../../hooks/useUsers';
import { useSchoolGroupCategories } from '../../hooks/useSchoolGroupModules';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface MatrixPermissionsViewProps {
  onRefresh: () => void;
}

export const MatrixPermissionsView = ({ onRefresh }: MatrixPermissionsViewProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: usersData, isLoading: usersLoading } = useUsers({
    schoolGroupId: user?.schoolGroupId,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useSchoolGroupCategories(
    user?.schoolGroupId
  );

  const users = usersData?.users?.filter((u: any) => u.role !== 'super_admin') || [];
  const categories = categoriesData?.categories || [];

  // Récupérer les assignations par catégorie
  const [categoryAssignments, setCategoryAssignments] = useState<Record<string, Set<string>>>({});

  useMemo(() => {
    const fetchAssignments = async () => {
      if (!user?.schoolGroupId) return;

      const { data } = await (supabase as any)
        .from('user_assigned_categories')
        .select('user_id, category_id')
        .eq('is_active', true);

      const assignments: Record<string, Set<string>> = {};
      data?.forEach((item: any) => {
        if (!assignments[item.category_id]) {
          assignments[item.category_id] = new Set();
        }
        assignments[item.category_id].add(item.user_id);
      });

      setCategoryAssignments(assignments);
    };

    fetchAssignments();
  }, [user?.schoolGroupId]);

  const toggleCategoryAssignment = async (userId: string, categoryId: string) => {
    setLoading(true);
    try {
      const isAssigned = categoryAssignments[categoryId]?.has(userId);

      if (isAssigned) {
        // Retirer
        await (supabase as any)
          .from('user_assigned_categories')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('category_id', categoryId);

        setCategoryAssignments(prev => {
          const newAssignments = { ...prev };
          newAssignments[categoryId]?.delete(userId);
          return newAssignments;
        });

        toast.success('Catégorie retirée');
      } else {
        // Assigner
        await (supabase as any)
          .from('user_assigned_categories')
          .insert({
            user_id: userId,
            category_id: categoryId,
            assigned_by: user?.id,
            default_can_read: true,
            default_can_write: false,
            default_can_delete: false,
            default_can_export: false,
            is_active: true
          });

        setCategoryAssignments(prev => {
          const newAssignments = { ...prev };
          if (!newAssignments[categoryId]) {
            newAssignments[categoryId] = new Set();
          }
          newAssignments[categoryId].add(userId);
          return newAssignments;
        });

        toast.success('Catégorie assignée');
      }

      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (usersLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2A9D8F]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Vue Matricielle - Assignation Rapide
            </p>
            <p className="text-xs text-blue-700">
              Cliquez sur une cellule pour assigner/retirer une catégorie entière à un utilisateur
            </p>
          </div>
        </div>
      </Card>

      {/* Matrice */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left font-semibold text-gray-900 sticky left-0 bg-gray-100 z-10">
                Utilisateur
              </th>
              {categories.map((category: any) => (
                <th key={category.id} className="border p-3 text-center min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{category.icon || '📦'}</span>
                    <span className="text-xs font-medium text-gray-900">{category.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="border p-3 sticky left-0 bg-white z-10">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-gray-600">{u.email}</p>
                  </div>
                </td>
                {categories.map((category: any) => {
                  const isAssigned = categoryAssignments[category.id]?.has(u.id);
                  
                  return (
                    <td 
                      key={category.id} 
                      className="border p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleCategoryAssignment(u.id, category.id)}
                    >
                      {isAssigned ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-300 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende */}
      <Card className="p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-700">Catégorie assignée</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-5 w-5 text-gray-300" />
            <span className="text-sm text-gray-700">Non assignée</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
