/**
 * Vue Matricielle - Permissions & Modules
 * Visualisation users x catégories avec toggle rapide
 * @module MatrixPermissionsView
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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
      </motion.div>

      {/* Matrice */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-b p-4 text-left font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                Utilisateur
              </th>
              {categories.map((category: any) => (
                <th key={category.id} className="border-b p-4 text-center min-w-[120px]">
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color ? `${category.color}20` : '#E5E7EB' }}
                    >
                      <span className="text-lg" style={{ color: category.color }}>
                        {category.icon || '📦'}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{category.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u: any, index: number) => (
              <motion.tr 
                key={u.id} 
                className="hover:bg-gray-50 transition-colors bg-white"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="border-b p-4 sticky left-0 bg-white z-10 group-hover:bg-gray-50 transition-colors border-r">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {u.firstName} {u.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {u.role}
                      </Badge>
                    </div>
                  </div>
                </td>
                {categories.map((category: any) => {
                  const isAssigned = categoryAssignments[category.id]?.has(u.id);
                  
                  return (
                    <td 
                      key={category.id} 
                      className="border-b p-4 text-center cursor-pointer hover:bg-gray-100/50 transition-all"
                      onClick={() => toggleCategoryAssignment(u.id, category.id)}
                    >
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className="flex justify-center"
                      >
                        {isAssigned ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500 drop-shadow-sm" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-200 hover:text-gray-400 transition-colors" />
                        )}
                      </motion.div>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Légende */}
      <Card className="p-4 bg-gray-50/50 border-none">
        <div className="flex items-center gap-6 justify-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-700">Catégorie assignée</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-5 w-5 text-gray-300" />
            <span className="text-sm text-gray-500">Non assignée</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
