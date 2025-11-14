// Edge Function pour générer les données sandbox
// Déployée sur Supabase, appelée depuis l'interface

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Créer le client Supabase avec service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Configuration des groupes scolaires
    const schoolGroups = [
      {
        name: 'Excellence Education',
        slug: 'excellence-education',
        description: 'Grand réseau d\'écoles d\'excellence',
        schools: [
          { name: 'Lycée Excellence Paris', type: 'lycee', students: 800 },
          { name: 'Collège Excellence Lyon', type: 'college', students: 600 },
          { name: 'École Excellence Marseille', type: 'primaire', students: 400 },
          { name: 'Lycée Excellence Bordeaux', type: 'lycee', students: 700 },
        ],
      },
      {
        name: 'Savoir Plus',
        slug: 'savoir-plus',
        description: 'Réseau d\'écoles de proximité',
        schools: [
          { name: 'Collège Savoir Plus Nord', type: 'college', students: 300 },
          { name: 'École Savoir Plus Sud', type: 'primaire', students: 200 },
          { name: 'Lycée Savoir Plus Centre', type: 'lycee', students: 400 },
        ],
      },
      {
        name: 'Horizon Académie',
        slug: 'horizon-academie',
        description: 'Écoles internationales',
        schools: [
          { name: 'Horizon International School', type: 'lycee', students: 600 },
          { name: 'Horizon Primary School', type: 'primaire', students: 300 },
          { name: 'Horizon Middle School', type: 'college', students: 500 },
          { name: 'Horizon Academy Campus', type: 'lycee', students: 400 },
        ],
      },
      {
        name: 'Éducation Rurale',
        slug: 'education-rurale',
        description: 'Écoles en milieu rural',
        schools: [
          { name: 'École Rurale Campagne', type: 'primaire', students: 150 },
          { name: 'Collège Rural Vallée', type: 'college', students: 200 },
          { name: 'Lycée Rural Montagne', type: 'lycee', students: 250 },
        ],
      },
      {
        name: 'Avenir Éducatif',
        slug: 'avenir-educatif',
        description: 'Réseau innovant',
        schools: [
          { name: 'Avenir Lycée Tech', type: 'lycee', students: 500 },
          { name: 'Avenir Collège Sciences', type: 'college', students: 400 },
          { name: 'Avenir École Numérique', type: 'primaire', students: 300 },
          { name: 'Avenir Campus Innovation', type: 'lycee', students: 600 },
          { name: 'Avenir École Arts', type: 'primaire', students: 250 },
        ],
      },
    ];

    let totalCreated = {
      school_groups: 0,
      schools: 0,
      users: 0,
      students: 0,
      classes: 0,
      inscriptions: 0,
    };

    // Générer les données pour chaque groupe
    for (const groupConfig of schoolGroups) {
      // 1. Créer le groupe scolaire
      const { data: group, error: groupError } = await supabase
        .from('school_groups')
        .insert({
          name: groupConfig.name,
          slug: groupConfig.slug,
          description: groupConfig.description,
          is_sandbox: true,
        })
        .select()
        .single();

      if (groupError) throw groupError;
      totalCreated.school_groups++;

      // 2. Créer les écoles
      for (const schoolConfig of groupConfig.schools) {
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: schoolConfig.name,
            slug: schoolConfig.name.toLowerCase().replace(/\s+/g, '-'),
            type: schoolConfig.type,
            school_group_id: group.id,
            is_sandbox: true,
          })
          .select()
          .single();

        if (schoolError) throw schoolError;
        totalCreated.schools++;

        // 3. Créer des utilisateurs (enseignants, directeur, etc.)
        const usersToCreate = Math.ceil(schoolConfig.students / 30); // 1 enseignant pour 30 élèves
        
        for (let i = 0; i < usersToCreate; i++) {
          const roles = ['enseignant', 'cpe', 'secretaire', 'comptable'];
          const role = i === 0 ? 'proviseur' : roles[i % roles.length];
          
          await supabase.from('users').insert({
            email: `${role}-${school.slug}-${i}@sandbox.test`,
            first_name: `Prénom${i}`,
            last_name: `Nom${i}`,
            role: role,
            school_id: school.id,
            school_group_id: group.id,
            is_sandbox: true,
          });
          
          totalCreated.users++;
        }

        // 4. Créer des classes
        const levels = schoolConfig.type === 'primaire' 
          ? ['CP', 'CE1', 'CE2', 'CM1', 'CM2']
          : schoolConfig.type === 'college'
          ? ['6ème', '5ème', '4ème', '3ème']
          : ['2nde', '1ère', 'Terminale'];

        const classesPerLevel = Math.ceil(schoolConfig.students / (levels.length * 30));

        for (const level of levels) {
          for (let section = 0; section < classesPerLevel; section++) {
            const sectionLetter = String.fromCharCode(65 + section); // A, B, C...
            
            const { data: classe } = await supabase
              .from('classes')
              .insert({
                name: `${level} ${sectionLetter}`,
                level: level,
                section: sectionLetter,
                capacity: 30,
                school_id: school.id,
                school_group_id: group.id,
                academic_year: '2024-2025',
                is_sandbox: true,
              })
              .select()
              .single();

            if (classe) {
              totalCreated.classes++;

              // 5. Créer des élèves pour cette classe
              const studentsInClass = Math.min(30, Math.ceil(schoolConfig.students / (levels.length * classesPerLevel)));
              
              for (let s = 0; s < studentsInClass; s++) {
                const gender = Math.random() > 0.5 ? 'M' : 'F';
                
                const { data: student } = await supabase
                  .from('students')
                  .insert({
                    first_name: `Élève${s}`,
                    last_name: `Famille${s}`,
                    date_of_birth: `200${Math.floor(Math.random() * 10)}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`,
                    gender: gender,
                    level: level,
                    school_id: school.id,
                    school_group_id: group.id,
                    parent_name: `Parent${s}`,
                    parent_phone: `06${Math.floor(Math.random() * 100000000)}`,
                    is_sandbox: true,
                  })
                  .select()
                  .single();

                if (student) {
                  totalCreated.students++;

                  // 6. Créer une inscription
                  await supabase.from('inscriptions').insert({
                    student_name: `${student.first_name} ${student.last_name}`,
                    student_first_name: student.first_name,
                    student_last_name: student.last_name,
                    date_of_birth: student.date_of_birth,
                    gender: student.gender,
                    level: level,
                    school_id: school.id,
                    school_group_id: group.id,
                    parent_name: student.parent_name,
                    parent_phone: student.parent_phone,
                    status: 'validee',
                    academic_year: '2024-2025',
                    is_sandbox: true,
                  });

                  totalCreated.inscriptions++;
                }
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Données sandbox générées avec succès',
        data: totalCreated,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
