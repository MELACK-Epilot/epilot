/**
 * Grille d'actions rapides pour Admin Groupe
 * Accès direct aux fonctionnalités principales
 * @module QuickActionsGrid
 */

import { School, Users, DollarSign, Package, MessageSquare, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const QuickActionsGrid = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: School,
      title: 'Gérer Écoles',
      description: 'Ajouter, modifier ou consulter vos écoles',
      color: 'from-[#1D3557] to-[#2A4A6F]',
      href: '/dashboard/schools',
    },
    {
      icon: Users,
      title: 'Gérer Utilisateurs',
      description: 'Personnel, enseignants et administrateurs',
      color: 'from-[#2A9D8F] to-[#1D8A7E]',
      href: '/dashboard/users',
    },
    {
      icon: DollarSign,
      title: 'Finances',
      description: 'Revenus, dépenses et trésorerie',
      color: 'from-[#E9C46A] to-[#D4AF37]',
      href: '/dashboard/finances',
    },
    {
      icon: BarChart3,
      title: 'Rapports',
      description: 'Statistiques et analyses détaillées',
      color: 'from-purple-600 to-purple-700',
      href: '/dashboard/reports',
    },
    {
      icon: Package,
      title: 'Modules',
      description: 'Gérer vos modules et fonctionnalités',
      color: 'from-orange-600 to-orange-700',
      href: '/dashboard/my-modules',
    },
    {
      icon: MessageSquare,
      title: 'Communication',
      description: 'Messages et notifications',
      color: 'from-blue-600 to-blue-700',
      href: '/dashboard/communication',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(action.href)}
            className="group relative overflow-hidden bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 text-left hover:scale-[1.02] hover:-translate-y-1"
          >
            {/* Effet de brillance diagonal */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" 
                 style={{ transition: 'transform 0.6s ease-out, opacity 0.3s' }} />
            
            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Cercles décoratifs */}
            <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${action.color} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <div className={`absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br ${action.color} opacity-5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700`} />
            
            {/* Icon avec animation */}
            <div className={`relative inline-flex p-4 bg-gradient-to-br ${action.color} rounded-xl shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="relative">
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#1D3557] transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {action.description}
              </p>
            </div>

            {/* Arrow avec animation */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            {/* Barre de progression décorative */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${action.color} transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out`} />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
