/**
 * Configuration des permissions par rôle
 * 15 rôles avec leurs KPI et accès spécifiques
 * 
 * @module rolePermissions
 */

import { 
  DollarSign, 
  Users, 
  BookOpen, 
  Award, 
  Star,
  FileText,
  Calendar,
  ClipboardList,
  Heart,
  GraduationCap,
  Shield,
  Book,
  Utensils,
  Compass,
  Activity
} from 'lucide-react';

export interface KPIConfig {
  title: string;
  value: string;
  unit: string;
  trend: string;
  color: 'emerald' | 'blue' | 'purple' | 'orange' | 'green' | 'red' | 'indigo' | 'pink' | 'yellow';
  icon: any;
}

/**
 * Configuration des KPI par rôle
 */
export const ROLE_KPI_CONFIG: Record<string, KPIConfig[]> = {
  // 1. PROVISEUR - Vue d'ensemble COMPLÈTE
  proviseur: [
    {
      title: 'Élèves actifs',
      value: '1,247',
      unit: 'élèves',
      trend: '+3%',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Classes ouvertes',
      value: '24',
      unit: 'classes',
      trend: '+2',
      color: 'purple',
      icon: BookOpen
    },
    {
      title: 'Personnel actif',
      value: '89',
      unit: 'membres',
      trend: '+5%',
      color: 'orange',
      icon: Award
    },
    {
      title: 'Niveaux',
      value: '4',
      unit: 'niveaux',
      trend: '0',
      color: 'indigo',
      icon: GraduationCap
    }
  ],

  // 2. DIRECTEUR - Vue d'ensemble pédagogique
  directeur: [
    {
      title: 'Élèves actifs',
      value: '1,247',
      unit: 'élèves',
      trend: '+3%',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Classes ouvertes',
      value: '24',
      unit: 'classes',
      trend: '+2',
      color: 'purple',
      icon: BookOpen
    },
    {
      title: 'Personnel actif',
      value: '89',
      unit: 'membres',
      trend: '+5%',
      color: 'orange',
      icon: Award
    },
    {
      title: 'Niveaux',
      value: '4',
      unit: 'niveaux',
      trend: '0',
      color: 'indigo',
      icon: GraduationCap
    }
  ],

  // 3. DIRECTEUR DES ÉTUDES - Focus pédagogique
  directeur_etudes: [
    {
      title: 'Élèves actifs',
      value: '1,247',
      unit: 'élèves',
      trend: '+3%',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Classes ouvertes',
      value: '24',
      unit: 'classes',
      trend: '+2',
      color: 'purple',
      icon: BookOpen
    },
    {
      title: 'Moyenne générale',
      value: '14.2',
      unit: '/20',
      trend: '+0.5',
      color: 'indigo',
      icon: GraduationCap
    },
    {
      title: 'Taux de réussite',
      value: '87',
      unit: '%',
      trend: '+4%',
      color: 'green',
      icon: Award
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 4. SECRÉTAIRE - Gestion administrative
  secretaire: [
    {
      title: 'Documents traités',
      value: '156',
      unit: 'docs',
      trend: '+12',
      color: 'blue',
      icon: FileText
    },
    {
      title: 'Inscriptions',
      value: '23',
      unit: 'nouvelles',
      trend: '+5',
      color: 'purple',
      icon: Users
    },
    {
      title: 'Rendez-vous',
      value: '18',
      unit: 'planifiés',
      trend: '+3',
      color: 'orange',
      icon: Calendar
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 5. COMPTABLE - Gestion financière
  comptable: [
    {
      title: 'Paiements traités',
      value: '234',
      unit: 'paiements',
      trend: '+18',
      color: 'emerald',
      icon: DollarSign
    },
    {
      title: 'En attente',
      value: '45',
      unit: 'paiements',
      trend: '-8',
      color: 'orange',
      icon: ClipboardList
    },
    {
      title: 'Retards',
      value: '12',
      unit: 'paiements',
      trend: '-3',
      color: 'red',
      icon: Activity
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 6. ENSEIGNANT - Focus pédagogique
  enseignant: [
    {
      title: 'Mes classes',
      value: '4',
      unit: 'classes',
      trend: '0',
      color: 'purple',
      icon: BookOpen
    },
    {
      title: 'Mes élèves',
      value: '127',
      unit: 'élèves',
      trend: '+2',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Moyenne classe',
      value: '13.8',
      unit: '/20',
      trend: '+0.3',
      color: 'indigo',
      icon: GraduationCap
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 7. CPE - Vie scolaire
  cpe: [
    {
      title: 'Élèves suivis',
      value: '1,247',
      unit: 'élèves',
      trend: '+3%',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Absences',
      value: '34',
      unit: 'aujourd\'hui',
      trend: '-5',
      color: 'orange',
      icon: ClipboardList
    },
    {
      title: 'Incidents',
      value: '8',
      unit: 'cette semaine',
      trend: '-2',
      color: 'red',
      icon: Shield
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 8. SURVEILLANT - Surveillance
  surveillant: [
    {
      title: 'Élèves présents',
      value: '1,213',
      unit: 'élèves',
      trend: '+5',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Absences',
      value: '34',
      unit: 'aujourd\'hui',
      trend: '-5',
      color: 'orange',
      icon: ClipboardList
    },
    {
      title: 'Incidents',
      value: '2',
      unit: 'aujourd\'hui',
      trend: '0',
      color: 'red',
      icon: Shield
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 9. BIBLIOTHÉCAIRE - Gestion bibliothèque
  bibliothecaire: [
    {
      title: 'Livres disponibles',
      value: '3,456',
      unit: 'livres',
      trend: '+45',
      color: 'indigo',
      icon: Book
    },
    {
      title: 'Emprunts actifs',
      value: '234',
      unit: 'emprunts',
      trend: '+12',
      color: 'purple',
      icon: BookOpen
    },
    {
      title: 'Retards',
      value: '18',
      unit: 'livres',
      trend: '-3',
      color: 'orange',
      icon: ClipboardList
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 10. GESTIONNAIRE CANTINE - Gestion restauration
  gestionnaire_cantine: [
    {
      title: 'Repas servis',
      value: '856',
      unit: 'aujourd\'hui',
      trend: '+23',
      color: 'orange',
      icon: Utensils
    },
    {
      title: 'Inscriptions',
      value: '1,089',
      unit: 'élèves',
      trend: '+15',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Stock alerte',
      value: '5',
      unit: 'produits',
      trend: '-2',
      color: 'red',
      icon: Activity
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 11. CONSEILLER ORIENTATION - Orientation
  conseiller_orientation: [
    {
      title: 'Élèves suivis',
      value: '234',
      unit: 'élèves',
      trend: '+12',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Entretiens',
      value: '18',
      unit: 'cette semaine',
      trend: '+3',
      color: 'purple',
      icon: Calendar
    },
    {
      title: 'Orientations',
      value: '45',
      unit: 'validées',
      trend: '+8',
      color: 'indigo',
      icon: Compass
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 12. INFIRMIER - Santé scolaire
  infirmier: [
    {
      title: 'Consultations',
      value: '23',
      unit: 'aujourd\'hui',
      trend: '+5',
      color: 'pink',
      icon: Heart
    },
    {
      title: 'Élèves suivis',
      value: '156',
      unit: 'élèves',
      trend: '+8',
      color: 'blue',
      icon: Users
    },
    {
      title: 'Urgences',
      value: '2',
      unit: 'cette semaine',
      trend: '0',
      color: 'red',
      icon: Activity
    },
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ],

  // 13. ÉLÈVE - Vue personnelle
  eleve: [
    {
      title: 'Moyenne générale',
      value: '14.5',
      unit: '/20',
      trend: '+0.8',
      color: 'indigo',
      icon: GraduationCap
    },
    {
      title: 'Présence',
      value: '96',
      unit: '%',
      trend: '+2%',
      color: 'green',
      icon: Calendar
    },
    {
      title: 'Devoirs rendus',
      value: '18',
      unit: '/20',
      trend: '+2',
      color: 'purple',
      icon: FileText
    },
    {
      title: 'Classement',
      value: '12',
      unit: '/127',
      trend: '+3',
      color: 'blue',
      icon: Award
    }
  ],

  // 14. PARENT - Suivi enfant(s)
  parent: [
    {
      title: 'Moyenne enfant',
      value: '14.5',
      unit: '/20',
      trend: '+0.8',
      color: 'indigo',
      icon: GraduationCap
    },
    {
      title: 'Présence',
      value: '96',
      unit: '%',
      trend: '+2%',
      color: 'green',
      icon: Calendar
    },
    {
      title: 'Paiements',
      value: '2',
      unit: 'en attente',
      trend: '0',
      color: 'orange',
      icon: DollarSign
    },
    {
      title: 'Messages',
      value: '3',
      unit: 'non lus',
      trend: '+1',
      color: 'blue',
      icon: FileText
    }
  ],

  // 15. AUTRE - Vue minimale
  autre: [
    {
      title: 'Satisfaction',
      value: '4.8',
      unit: '/5',
      trend: '+0.2',
      color: 'green',
      icon: Star
    }
  ]
};

/**
 * Récupérer les KPI pour un rôle donné
 */
export const getKPIsForRole = (role: string): KPIConfig[] => {
  return ROLE_KPI_CONFIG[role] || ROLE_KPI_CONFIG.autre;
};

/**
 * Vérifier si un rôle a accès complet (Direction)
 */
export const isDirectionRole = (role: string): boolean => {
  return ['proviseur', 'directeur', 'directeur_etudes'].includes(role);
};

/**
 * Vérifier si un rôle a accès aux finances
 */
export const hasFinanceAccess = (role: string): boolean => {
  return ['proviseur', 'comptable'].includes(role);
};

/**
 * Vérifier si un rôle a accès aux données pédagogiques complètes
 */
export const hasPedagogicalAccess = (role: string): boolean => {
  return ['proviseur', 'directeur', 'directeur_etudes', 'cpe'].includes(role);
};
