/**
 * Configuration des relations entre catégories
 * Système intelligent de connexions métier
 */

export interface CategoryRelation {
  complements: string[];
  dependencies: string[];
  conflicts?: string[];
  priority: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Relations métier entre catégories E-Pilot Congo
 * Basé sur l'analyse des processus scolaires
 */
export const CATEGORY_RELATIONS: Record<string, CategoryRelation> = {
  'Scolarité & Admissions': {
    complements: ['Pédagogie & Évaluations', 'Vie Scolaire & Discipline'],
    dependencies: ['Sécurité & Accès'],
    priority: 'high',
    description: 'Cœur du système éducatif, nécessite la sécurité et se complète avec la pédagogie'
  },
  
  'Pédagogie & Évaluations': {
    complements: ['Scolarité & Admissions', 'Documents & Rapports'],
    dependencies: ['Sécurité & Accès'],
    priority: 'high',
    description: 'Processus d\'enseignement central, génère des documents et suit les élèves'
  },
  
  'Finances & Comptabilité': {
    complements: ['Ressources Humaines', 'Services & Infrastructures'],
    dependencies: ['Documents & Rapports', 'Sécurité & Accès'],
    priority: 'high',
    description: 'Gestion financière liée aux RH et services, nécessite reporting et sécurité'
  },
  
  'Ressources Humaines': {
    complements: ['Finances & Comptabilité', 'Sécurité & Accès'],
    dependencies: ['Documents & Rapports'],
    priority: 'medium',
    description: 'Gestion du personnel liée aux finances et à la sécurité'
  },
  
  'Vie Scolaire & Discipline': {
    complements: ['Scolarité & Admissions', 'Communication'],
    dependencies: ['Sécurité & Accès'],
    priority: 'medium',
    description: 'Suivi disciplinaire des élèves, nécessite communication et sécurité'
  },
  
  'Services & Infrastructures': {
    complements: ['Finances & Comptabilité', 'Ressources Humaines'],
    dependencies: ['Sécurité & Accès'],
    priority: 'medium',
    description: 'Services support liés aux finances et RH'
  },
  
  'Sécurité & Accès': {
    complements: ['Ressources Humaines'],
    dependencies: [],
    priority: 'high',
    description: 'Fondation sécuritaire de tout le système, aucune dépendance'
  },
  
  'Documents & Rapports': {
    complements: ['Pédagogie & Évaluations'],
    dependencies: ['Sécurité & Accès'],
    priority: 'low',
    description: 'Génération de documents basée sur les données pédagogiques'
  },
  
  'Communication': {
    complements: ['Vie Scolaire & Discipline'],
    dependencies: ['Sécurité & Accès'],
    priority: 'medium',
    description: 'Communication interne liée à la vie scolaire'
  }
};

/**
 * Groupes logiques de catégories
 */
export const CATEGORY_GROUPS = {
  core: {
    name: 'Processus Cœur',
    categories: ['Scolarité & Admissions', 'Pédagogie & Évaluations'],
    color: 'blue',
    description: 'Fonctions principales de l\'établissement'
  },
  management: {
    name: 'Gestion Administrative',
    categories: ['Finances & Comptabilité', 'Ressources Humaines'],
    color: 'green',
    description: 'Administration et gestion des ressources'
  },
  operations: {
    name: 'Opérations Quotidiennes',
    categories: ['Vie Scolaire & Discipline', 'Services & Infrastructures'],
    color: 'orange',
    description: 'Gestion quotidienne et services'
  },
  system: {
    name: 'Système & Support',
    categories: ['Sécurité & Accès', 'Documents & Rapports', 'Communication'],
    color: 'purple',
    description: 'Infrastructure système et support'
  }
};

/**
 * Types de relations
 */
export const RELATION_TYPES = {
  complement: {
    label: 'Complémentaire',
    color: 'green',
    icon: '🤝',
    description: 'Catégories qui travaillent ensemble'
  },
  dependency: {
    label: 'Dépendance',
    color: 'blue',
    icon: '⬆️',
    description: 'Catégories nécessaires au fonctionnement'
  },
  conflict: {
    label: 'Attention',
    color: 'red',
    icon: '⚠️',
    description: 'Catégories nécessitant une attention particulière'
  }
};

/**
 * Obtenir les relations d'une catégorie
 */
export function getCategoryRelations(categoryName: string): CategoryRelation {
  return CATEGORY_RELATIONS[categoryName] || {
    complements: [],
    dependencies: [],
    priority: 'low',
    description: 'Aucune relation définie'
  };
}

/**
 * Obtenir le groupe d'une catégorie
 */
export function getCategoryGroup(categoryName: string): string {
  for (const [groupId, group] of Object.entries(CATEGORY_GROUPS)) {
    if (group.categories.includes(categoryName)) {
      return groupId;
    }
  }
  return 'other';
}

/**
 * Obtenir toutes les connexions pour visualisation
 */
export function getAllConnections(): Array<{
  from: string;
  to: string;
  type: 'complement' | 'dependency';
  strength: number;
}> {
  const connections: Array<{
    from: string;
    to: string;
    type: 'complement' | 'dependency';
    strength: number;
  }> = [];
  
  Object.entries(CATEGORY_RELATIONS).forEach(([from, relations]) => {
    relations.complements.forEach(to => {
      connections.push({
        from,
        to,
        type: 'complement',
        strength: relations.priority === 'high' ? 3 : relations.priority === 'medium' ? 2 : 1
      });
    });
    
    relations.dependencies.forEach(to => {
      connections.push({
        from,
        to,
        type: 'dependency',
        strength: relations.priority === 'high' ? 3 : relations.priority === 'medium' ? 2 : 1
      });
    });
  });
  
  return connections;
}

/**
 * Calculer le score de connectivité d'une catégorie
 */
export function getCategoryConnectivityScore(categoryName: string): number {
  const relations = getCategoryRelations(categoryName);
  const complementsScore = relations.complements.length * 2;
  const dependenciesScore = relations.dependencies.length * 1;
  const priorityMultiplier = relations.priority === 'high' ? 1.5 : relations.priority === 'medium' ? 1.2 : 1;
  
  return Math.round((complementsScore + dependenciesScore) * priorityMultiplier);
}
