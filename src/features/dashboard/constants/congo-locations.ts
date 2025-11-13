/**
 * Données géographiques du Congo-Brazzaville
 * 15 départements et leurs villes principales
 */

export const CONGO_DEPARTMENTS = [
  'Bouenza',
  'Brazzaville',
  'Cuvette',
  'Cuvette-Ouest',
  'Kouilou',
  'Lékoumou',
  'Likouala',
  'Niari',
  'Plateaux',
  'Pointe-Noire',
  'Pool',
  'Sangha',
] as const;

export const CONGO_CITIES = [
  // Brazzaville (capitale)
  'Brazzaville',
  
  // Pointe-Noire (2ème ville)
  'Pointe-Noire',
  
  // Autres villes principales par ordre alphabétique
  'Dolisie',
  'Nkayi',
  'Ouesso',
  'Owando',
  'Impfondo',
  'Sibiti',
  'Madingou',
  'Kinkala',
  'Djambala',
  'Ewo',
  'Gamboma',
  'Loandjili',
  'Kayes',
  'Mossendjo',
  'Makoua',
  'Zanaga',
  'Loudima',
  'Kindamba',
  'Boundji',
  'Oyo',
  'Makabana',
  'Ngabé',
  'Sembe',
  'Souanké',
] as const;

export type CongoDepartment = typeof CONGO_DEPARTMENTS[number];
export type CongoCity = typeof CONGO_CITIES[number];
