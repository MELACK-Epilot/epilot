/**
 * Script de génération des données sandbox
 * Crée 5 groupes scolaires fictifs avec écoles, utilisateurs, élèves, etc.
 * @module GenerateSandboxData
 */

import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

// Configuration locale française
faker.locale = 'fr';
faker.seed(12345); // Pour reproductibilité

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Configuration des groupes scolaires
 */
const SCHOOL_GROUPS_CONFIG = [
  {
    name: 'Excellence Education Network',
    slug: 'excellence-education',
    description: 'Grand réseau urbain d\'excellence',
    schools: [
      { name: "Lycée d'Excellence Moderne", type: 'lycee', studentCount: 600, teacherCount: 45 },
      { name: 'Collège Excellence Centre', type: 'college', studentCount: 800, teacherCount: 50 },
      { name: 'École Primaire Excellence Nord', type: 'primaire', studentCount: 450, teacherCount: 20 },
      { name: 'Lycée Technique Excellence', type: 'lycee', studentCount: 400, teacherCount: 35 },
      { name: 'Collège Excellence Sud', type: 'college', studentCount: 250, teacherCount: 20 },
    ],
  },
  {
    name: 'Avenir Éducation',
    slug: 'avenir-education',
    description: 'Réseau régional de qualité',
    schools: [
      { name: 'Lycée Avenir', type: 'lycee', studentCount: 360, teacherCount: 28 },
      { name: 'Collège Avenir', type: 'college', studentCount: 480, teacherCount: 30 },
      { name: 'École Primaire Avenir', type: 'primaire', studentCount: 300, teacherCount: 15 },
      { name: 'Collège Technique Avenir', type: 'college', studentCount: 120, teacherCount: 10 },
    ],
  },
  {
    name: 'Savoir Plus',
    slug: 'savoir-plus',
    description: 'Petit réseau local',
    schools: [
      { name: 'Lycée Savoir', type: 'lycee', studentCount: 240, teacherCount: 18 },
      { name: 'Collège Savoir', type: 'college', studentCount: 320, teacherCount: 20 },
      { name: 'École Primaire Savoir', type: 'primaire', studentCount: 150, teacherCount: 8 },
    ],
  },
  {
    name: 'Horizon Académie',
    slug: 'horizon-academie',
    description: 'Réseau international bilingue',
    schools: [
      { name: 'Lycée International Horizon', type: 'lycee', studentCount: 480, teacherCount: 40 },
      { name: 'Collège Horizon Bilingue', type: 'college', studentCount: 640, teacherCount: 42 },
      { name: 'École Primaire Horizon', type: 'primaire', studentCount: 360, teacherCount: 18 },
      { name: 'Lycée Technique Horizon', type: 'lycee', studentCount: 240, teacherCount: 22 },
      { name: 'École Maternelle Horizon', type: 'maternelle', studentCount: 180, teacherCount: 12 },
    ],
  },
  {
    name: 'Étoile du Savoir',
    slug: 'etoile-savoir',
    description: 'Réseau rural',
    schools: [
      { name: 'Lycée Étoile', type: 'lycee', studentCount: 160, teacherCount: 12 },
      { name: 'Collège Étoile', type: 'college', studentCount: 180, teacherCount: 14 },
      { name: 'École Primaire Étoile', type: 'primaire', studentCount: 120, teacherCount: 6 },
    ],
  },
];

/**
 * Niveaux par type d'école
 */
const LEVELS_BY_TYPE: Record<string, string[]> = {
  maternelle: ['Petite Section', 'Moyenne Section', 'Grande Section'],
  primaire: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  college: ['6ème', '5ème', '4ème', '3ème'],
  lycee: ['Seconde', 'Première', 'Terminale'],
};

/**
 * Matières par niveau
 */
const SUBJECTS_BY_LEVEL: Record<string, string[]> = {
  primaire: ['Français', 'Mathématiques', 'Histoire-Géo', 'Sciences', 'EPS', 'Arts'],
  college: ['Français', 'Mathématiques', 'Anglais', 'Histoire-Géo', 'SVT', 'Physique-Chimie', 'EPS', 'Arts', 'Technologie'],
  lycee: ['Français', 'Mathématiques', 'Anglais', 'Histoire-Géo', 'SVT', 'Physique-Chimie', 'Philosophie', 'EPS', 'Spécialités'],
};

/**
 * Fonction principale
 */
async function generateSandboxData() {
  console.log('🧪 ========================================');
  console.log('🧪 GÉNÉRATION DES DONNÉES SANDBOX');
  console.log('🧪 ========================================\n');

  try {
    // 1. Créer les groupes scolaires
    console.log('📦 Étape 1/8: Création des groupes scolaires...');
    const groups = await createSchoolGroups();
    console.log(`✅ ${groups.length} groupes créés\n`);

    // 2. Créer les écoles
    console.log('🏫 Étape 2/8: Création des écoles...');
    const schools = await createSchools(groups);
    console.log(`✅ ${schools.length} écoles créées\n`);

    // 3. Créer les utilisateurs
    console.log('👥 Étape 3/8: Création des utilisateurs...');
    const users = await createUsers(schools);
    console.log(`✅ ${users.length} utilisateurs créés\n`);

    // 4. Créer les élèves
    console.log('👨‍🎓 Étape 4/8: Création des élèves...');
    const students = await createStudents(schools);
    console.log(`✅ ${students.length} élèves créés\n`);

    // 5. Créer les classes
    console.log('📚 Étape 5/8: Création des classes...');
    const classes = await createClasses(schools, users);
    console.log(`✅ ${classes.length} classes créées\n`);

    // 6. Assigner les élèves aux classes
    console.log('🔗 Étape 6/8: Assignation des élèves aux classes...');
    await assignStudentsToClasses(students, classes);
    console.log(`✅ Élèves assignés\n`);

    // 7. Créer les inscriptions
    console.log('📝 Étape 7/8: Création des inscriptions...');
    const inscriptions = await createInscriptions(students, schools);
    console.log(`✅ ${inscriptions.length} inscriptions créées\n`);

    // 8. Créer les notes (optionnel)
    console.log('📊 Étape 8/8: Création des notes...');
    await createGrades(students, classes);
    console.log(`✅ Notes créées\n`);

    // Statistiques finales
    console.log('🎉 ========================================');
    console.log('🎉 GÉNÉRATION TERMINÉE AVEC SUCCÈS !');
    console.log('🎉 ========================================');
    console.log(`📊 Statistiques:`);
    console.log(`   - Groupes scolaires: ${groups.length}`);
    console.log(`   - Écoles: ${schools.length}`);
    console.log(`   - Utilisateurs: ${users.length}`);
    console.log(`   - Élèves: ${students.length}`);
    console.log(`   - Classes: ${classes.length}`);
    console.log(`   - Inscriptions: ${inscriptions.length}`);
    console.log('🎉 ========================================\n');

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    throw error;
  }
}

/**
 * Créer les groupes scolaires
 */
async function createSchoolGroups() {
  const groups = SCHOOL_GROUPS_CONFIG.map((config) => ({
    name: config.name,
    slug: config.slug,
    description: config.description,
    is_sandbox: true,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('school_groups')
    .insert(groups)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Créer les écoles
 */
async function createSchools(groups: any[]) {
  const schools = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const config = SCHOOL_GROUPS_CONFIG[i];

    for (const schoolConfig of config.schools) {
      schools.push({
        name: schoolConfig.name,
        slug: faker.helpers.slugify(schoolConfig.name).toLowerCase(),
        school_group_id: group.id,
        type: schoolConfig.type,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        postal_code: faker.location.zipCode(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        is_sandbox: true,
        metadata: {
          studentCount: schoolConfig.studentCount,
          teacherCount: schoolConfig.teacherCount,
        },
      });
    }
  }

  const { data, error } = await supabase
    .from('schools')
    .insert(schools)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Créer les utilisateurs
 */
async function createUsers(schools: any[]) {
  const users = [];

  for (const school of schools) {
    const teacherCount = school.metadata?.teacherCount || 10;

    // Proviseur/Directeur
    users.push({
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      role: school.type === 'primaire' ? 'directeur' : 'proviseur',
      school_id: school.id,
      school_group_id: school.school_group_id,
      phone: faker.phone.number(),
      is_sandbox: true,
    });

    // Enseignants
    for (let i = 0; i < teacherCount; i++) {
      users.push({
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        role: 'enseignant',
        school_id: school.id,
        school_group_id: school.school_group_id,
        phone: faker.phone.number(),
        is_sandbox: true,
      });
    }

    // Secrétaire
    users.push({
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      role: 'secretaire',
      school_id: school.id,
      school_group_id: school.school_group_id,
      phone: faker.phone.number(),
      is_sandbox: true,
    });

    // CPE (pour collèges et lycées)
    if (school.type === 'college' || school.type === 'lycee') {
      users.push({
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        role: 'cpe',
        school_id: school.id,
        school_group_id: school.school_group_id,
        phone: faker.phone.number(),
        is_sandbox: true,
      });
    }
  }

  const { data, error } = await supabase
    .from('users')
    .insert(users)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Créer les élèves
 */
async function createStudents(schools: any[]) {
  const students = [];

  for (const school of schools) {
    const studentCount = school.metadata?.studentCount || 100;
    const levels = LEVELS_BY_TYPE[school.type] || [];

    for (let i = 0; i < studentCount; i++) {
      const level = faker.helpers.arrayElement(levels);
      const birthDate = faker.date.birthdate({ min: 3, max: 18, mode: 'age' });

      students.push({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        date_of_birth: birthDate.toISOString().split('T')[0],
        gender: faker.helpers.arrayElement(['M', 'F']),
        school_id: school.id,
        school_group_id: school.school_group_id,
        level: level,
        parent_name: faker.person.fullName(),
        parent_phone: faker.phone.number(),
        parent_email: faker.internet.email(),
        is_sandbox: true,
      });
    }
  }

  const { data, error } = await supabase
    .from('students')
    .insert(students)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Créer les classes
 */
async function createClasses(schools: any[], users: any[]) {
  const classes = [];

  for (const school of schools) {
    const levels = LEVELS_BY_TYPE[school.type] || [];
    const schoolTeachers = users.filter(
      (u) => u.school_id === school.id && u.role === 'enseignant'
    );

    for (const level of levels) {
      // 2-5 classes par niveau selon la taille de l'école
      const classCount = faker.number.int({ min: 2, max: 5 });

      for (let i = 0; i < classCount; i++) {
        const className = `${level} ${String.fromCharCode(65 + i)}`; // A, B, C, etc.
        const teacher = faker.helpers.arrayElement(schoolTeachers);

        classes.push({
          name: className,
          level: level,
          school_id: school.id,
          school_group_id: school.school_group_id,
          main_teacher_id: teacher?.id,
          max_students: 40,
          academic_year: '2024-2025',
          is_sandbox: true,
        });
      }
    }
  }

  const { data, error } = await supabase
    .from('classes')
    .insert(classes)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Assigner les élèves aux classes
 */
async function assignStudentsToClasses(students: any[], classes: any[]) {
  const assignments = [];

  for (const student of students) {
    // Trouver une classe correspondante
    const matchingClasses = classes.filter(
      (c) => c.school_id === student.school_id && c.level === student.level
    );

    if (matchingClasses.length > 0) {
      const selectedClass = faker.helpers.arrayElement(matchingClasses);

      assignments.push({
        student_id: student.id,
        class_id: selectedClass.id,
        academic_year: '2024-2025',
      });
    }
  }

  // Mettre à jour les élèves avec leur classe
  for (const assignment of assignments) {
    await supabase
      .from('students')
      .update({ class_id: assignment.class_id })
      .eq('id', assignment.student_id);
  }
}

/**
 * Créer les inscriptions
 */
async function createInscriptions(students: any[], schools: any[]) {
  const inscriptions = [];
  const statuses = ['validee', 'en_attente', 'en_cours', 'refusee'];
  const statusWeights = [0.85, 0.08, 0.05, 0.02]; // 85% validées

  for (const student of students) {
    const status = faker.helpers.weightedArrayElement(
      statuses.map((s, i) => ({ weight: statusWeights[i], value: s }))
    );

    inscriptions.push({
      student_name: `${student.first_name} ${student.last_name}`,
      student_first_name: student.first_name,
      student_last_name: student.last_name,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      level: student.level,
      school_id: student.school_id,
      school_group_id: student.school_group_id,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      parent_email: student.parent_email,
      status: status,
      academic_year: '2024-2025',
      registration_date: faker.date.between({
        from: '2024-06-01',
        to: '2024-09-01',
      }).toISOString(),
      is_sandbox: true,
    });
  }

  const { data, error } = await supabase
    .from('inscriptions')
    .insert(inscriptions)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Créer les notes (optionnel)
 */
async function createGrades(students: any[], classes: any[]) {
  // Vérifier si la table grades existe
  const { error: tableError } = await supabase
    .from('grades')
    .select('id')
    .limit(1);

  if (tableError) {
    console.log('⚠️  Table grades non trouvée, skip...');
    return;
  }

  const grades = [];

  for (const student of students) {
    const studentClass = classes.find((c) => c.id === student.class_id);
    if (!studentClass) continue;

    const subjects = SUBJECTS_BY_LEVEL[studentClass.school_type] || [];

    for (const subject of subjects) {
      // 3 notes par matière (3 trimestres)
      for (let trimester = 1; trimester <= 3; trimester++) {
        grades.push({
          student_id: student.id,
          class_id: student.class_id,
          subject: subject,
          grade: faker.number.float({ min: 5, max: 20, precision: 0.5 }),
          coefficient: faker.helpers.arrayElement([1, 2, 3, 4]),
          trimester: trimester,
          academic_year: '2024-2025',
          is_sandbox: true,
        });
      }
    }
  }

  // Insérer par batch de 1000
  const batchSize = 1000;
  for (let i = 0; i < grades.length; i += batchSize) {
    const batch = grades.slice(i, i + batchSize);
    await supabase.from('grades').insert(batch);
  }
}

// Exécuter le script
generateSandboxData()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
