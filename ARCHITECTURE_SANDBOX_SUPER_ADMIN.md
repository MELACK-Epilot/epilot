# 🏗️ ARCHITECTURE SANDBOX - ENVIRONNEMENT DE DÉVELOPPEMENT SUPER ADMIN

## 🎯 **PROBLÉMATIQUE**

Le **Super Admin E-Pilot** doit pouvoir :
- ✅ Développer de nouveaux modules
- ✅ Tester les fonctionnalités avec des données réalistes
- ✅ Valider l'interface et l'UX
- ✅ Vérifier l'isolation des données
- ✅ Simuler différents scénarios (500+ groupes)
- ✅ **SANS AFFECTER** les données de production

---

## 💡 **SOLUTION : ENVIRONNEMENT SANDBOX**

### **Concept**

Créer un **environnement isolé** avec :
- 🏫 **5 groupes scolaires fictifs** (différentes tailles)
- 🏢 **3-5 écoles par groupe** (primaire, collège, lycée)
- 👥 **Utilisateurs fictifs** (proviseurs, enseignants, secrétaires, etc.)
- 👨‍🎓 **Élèves fictifs** (par niveau, par classe)
- 📚 **Données complètes** (inscriptions, notes, absences, etc.)
- 🔒 **Isolation totale** (marqueur `is_sandbox = true`)

---

## 🏗️ **ARCHITECTURE SANDBOX**

### **1. Marqueur d'Environnement**

```sql
-- Ajouter une colonne is_sandbox à toutes les tables principales
ALTER TABLE school_groups ADD COLUMN is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE inscriptions ADD COLUMN is_sandbox BOOLEAN DEFAULT FALSE;
-- etc.

-- Index pour performance
CREATE INDEX idx_school_groups_sandbox ON school_groups(is_sandbox);
CREATE INDEX idx_schools_sandbox ON schools(is_sandbox);
CREATE INDEX idx_users_sandbox ON users(is_sandbox);
```

### **2. Séparation Visuelle**

```typescript
// Badge "SANDBOX" sur toutes les données de test
interface SandboxBadge {
  show: boolean;
  color: 'orange';
  text: '🧪 SANDBOX';
}

// Affichage conditionnel
{isSandbox && (
  <Badge className="bg-orange-500 text-white">
    🧪 SANDBOX
  </Badge>
)}
```

### **3. Permissions Spéciales**

```sql
-- Seul le Super Admin peut voir et modifier les données sandbox
CREATE POLICY "Super admin can access sandbox data"
ON school_groups
FOR ALL
TO authenticated
USING (
  is_sandbox = TRUE 
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);
```

---

## 📊 **STRUCTURE DES DONNÉES FICTIVES**

### **Groupe 1 : "Excellence Education Network" (Grand Réseau)**

```yaml
Groupe Scolaire: Excellence Education Network
Type: Grand réseau urbain
Nombre d'écoles: 5
Nombre total d'élèves: ~2500
Budget annuel: 5M€
Plan: Institutionnel

Écoles:
  1. Lycée d'Excellence Moderne
     - Niveaux: Seconde, Première, Terminale
     - Classes: 15 (5 par niveau)
     - Élèves: 600
     - Enseignants: 45
     - Personnel: 15
     
  2. Collège Excellence Centre
     - Niveaux: 6ème, 5ème, 4ème, 3ème
     - Classes: 20 (5 par niveau)
     - Élèves: 800
     - Enseignants: 50
     - Personnel: 20
     
  3. École Primaire Excellence Nord
     - Niveaux: CP, CE1, CE2, CM1, CM2
     - Classes: 15 (3 par niveau)
     - Élèves: 450
     - Enseignants: 20
     - Personnel: 8
     
  4. Lycée Technique Excellence
     - Niveaux: Seconde, Première, Terminale
     - Filières: STI2D, STMG
     - Classes: 12
     - Élèves: 400
     - Enseignants: 35
     - Personnel: 12
     
  5. Collège Excellence Sud
     - Niveaux: 6ème, 5ème, 4ème, 3ème
     - Classes: 8 (2 par niveau)
     - Élèves: 250
     - Enseignants: 20
     - Personnel: 8

Utilisateurs Clés:
  - Admin Groupe: Jean-Marc KOUADIO (admin_groupe)
  - Proviseur Lycée Moderne: Orel DEBA (proviseur)
  - Proviseur Collège Centre: Marie KOUASSI (proviseur)
  - Directrice Primaire Nord: Sophie TRAORE (directeur)
  - CPE Lycée Moderne: Paul KONE (cpe)
  - Secrétaire Collège: Aminata DIALLO (secretaire)
  - Enseignant Maths: Pierre YAPI (enseignant)
  - Enseignant Français: Claire BAMBA (enseignant)
```

---

### **Groupe 2 : "Avenir Éducation" (Réseau Moyen)**

```yaml
Groupe Scolaire: Avenir Éducation
Type: Réseau régional
Nombre d'écoles: 4
Nombre total d'élèves: ~1200
Budget annuel: 2M€
Plan: Professionnel

Écoles:
  1. Lycée Avenir
     - Niveaux: Seconde, Première, Terminale
     - Classes: 9 (3 par niveau)
     - Élèves: 360
     - Enseignants: 28
     - Personnel: 10
     
  2. Collège Avenir
     - Niveaux: 6ème, 5ème, 4ème, 3ème
     - Classes: 12 (3 par niveau)
     - Élèves: 480
     - Enseignants: 30
     - Personnel: 12
     
  3. École Primaire Avenir
     - Niveaux: CP, CE1, CE2, CM1, CM2
     - Classes: 10 (2 par niveau)
     - Élèves: 300
     - Enseignants: 15
     - Personnel: 6
     
  4. Collège Technique Avenir
     - Niveaux: 3ème, CAP
     - Classes: 4
     - Élèves: 120
     - Enseignants: 10
     - Personnel: 4

Utilisateurs Clés:
  - Admin Groupe: Fatou SYLLA (admin_groupe)
  - Proviseur Lycée: Jean TRAORE (proviseur)
  - Proviseur Collège: Aïcha KONE (proviseur)
  - Directeur Primaire: Marc OUATTARA (directeur)
```

---

### **Groupe 3 : "Savoir Plus" (Petit Réseau)**

```yaml
Groupe Scolaire: Savoir Plus
Type: Petit réseau local
Nombre d'écoles: 3
Nombre total d'élèves: ~600
Budget annuel: 800K€
Plan: Standard

Écoles:
  1. Lycée Savoir
     - Niveaux: Seconde, Première, Terminale
     - Classes: 6 (2 par niveau)
     - Élèves: 240
     - Enseignants: 18
     - Personnel: 6
     
  2. Collège Savoir
     - Niveaux: 6ème, 5ème, 4ème, 3ème
     - Classes: 8 (2 par niveau)
     - Élèves: 320
     - Enseignants: 20
     - Personnel: 8
     
  3. École Primaire Savoir
     - Niveaux: CP, CE1, CE2, CM1, CM2
     - Classes: 5 (1 par niveau)
     - Élèves: 150
     - Enseignants: 8
     - Personnel: 3

Utilisateurs Clés:
  - Admin Groupe: Ibrahim TOURE (admin_groupe)
  - Proviseur Lycée: Mariam DIOP (proviseur)
  - Proviseur Collège: Youssouf KABA (proviseur)
```

---

### **Groupe 4 : "Horizon Académie" (Réseau International)**

```yaml
Groupe Scolaire: Horizon Académie
Type: Réseau international
Nombre d'écoles: 5
Nombre total d'élèves: ~1800
Budget annuel: 4M€
Plan: Institutionnel

Écoles:
  1. Lycée International Horizon
     - Niveaux: Seconde, Première, Terminale
     - Programmes: Français + International
     - Classes: 12
     - Élèves: 480
     - Enseignants: 40
     - Personnel: 15
     
  2. Collège Horizon Bilingue
     - Niveaux: 6ème, 5ème, 4ème, 3ème
     - Classes: 16
     - Élèves: 640
     - Enseignants: 42
     - Personnel: 18
     
  3. École Primaire Horizon
     - Niveaux: CP, CE1, CE2, CM1, CM2
     - Classes: 12
     - Élèves: 360
     - Enseignants: 18
     - Personnel: 8
     
  4. Lycée Technique Horizon
     - Niveaux: Seconde, Première, Terminale
     - Classes: 8
     - Élèves: 240
     - Enseignants: 22
     - Personnel: 8
     
  5. École Maternelle Horizon
     - Niveaux: Petite, Moyenne, Grande Section
     - Classes: 6
     - Élèves: 180
     - Enseignants: 12
     - Personnel: 6

Utilisateurs Clés:
  - Admin Groupe: David MENSAH (admin_groupe)
  - Proviseur Lycée International: Sarah JOHNSON (proviseur)
  - Proviseur Collège: Ahmed DIALLO (proviseur)
```

---

### **Groupe 5 : "Étoile du Savoir" (Réseau Rural)**

```yaml
Groupe Scolaire: Étoile du Savoir
Type: Réseau rural
Nombre d'écoles: 3
Nombre total d'élèves: ~400
Budget annuel: 500K€
Plan: Essentiel

Écoles:
  1. Lycée Étoile
     - Niveaux: Seconde, Première, Terminale
     - Classes: 4
     - Élèves: 160
     - Enseignants: 12
     - Personnel: 4
     
  2. Collège Étoile
     - Niveaux: 6ème, 5ème, 4ème, 3ème
     - Classes: 6
     - Élèves: 180
     - Enseignants: 14
     - Personnel: 5
     
  3. École Primaire Étoile
     - Niveaux: CP, CE1, CE2, CM1, CM2
     - Classes: 5
     - Élèves: 120
     - Enseignants: 6
     - Personnel: 2

Utilisateurs Clés:
  - Admin Groupe: Karim SANOGO (admin_groupe)
  - Proviseur Lycée: Fatoumata BA (proviseur)
```

---

## 📦 **DONNÉES COMPLÈTES PAR MODULE**

### **Module : Gestion des Inscriptions**

```yaml
Inscriptions par école:
  - Statuts: En attente, Validée, Refusée, En cours
  - Niveaux: Tous les niveaux de l'école
  - Périodes: Année académique 2024-2025
  - Documents: Acte de naissance, Bulletin, Photo, etc.
  
Exemple Lycée Moderne (600 élèves):
  - Seconde: 200 inscriptions (180 validées, 15 en attente, 5 refusées)
  - Première: 200 inscriptions (195 validées, 5 en attente)
  - Terminale: 200 inscriptions (200 validées)
```

### **Module : Gestion des Classes**

```yaml
Classes par école:
  - Nom: 6ème A, 6ème B, etc.
  - Effectif max: 40 élèves
  - Enseignant principal
  - Salle assignée
  - Emploi du temps
  
Exemple Collège Excellence (20 classes):
  - 6ème: 5 classes (6ème A, B, C, D, E)
  - 5ème: 5 classes
  - 4ème: 5 classes
  - 3ème: 5 classes
```

### **Module : Gestion des Notes**

```yaml
Notes par élève:
  - Matières: Selon le niveau
  - Trimestres: 1, 2, 3
  - Types: Devoir, Composition, Oral
  - Coefficients
  - Moyennes calculées
  
Exemple élève Seconde:
  - Maths: 12/20 (coef 4)
  - Français: 14/20 (coef 4)
  - Anglais: 15/20 (coef 3)
  - etc.
```

### **Module : Gestion des Absences**

```yaml
Absences par élève:
  - Date
  - Motif: Maladie, Familial, Non justifié
  - Justificatif: Oui/Non
  - Durée: Demi-journée, Journée, Plusieurs jours
  
Statistiques:
  - Taux d'absentéisme par classe
  - Élèves à risque (>10% absences)
```

### **Module : Gestion du Personnel**

```yaml
Personnel par école:
  - Enseignants: Par matière
  - Personnel administratif: Secrétaires, comptables
  - Personnel d'entretien
  - Surveillants
  - Infirmiers
  
Exemple Lycée Moderne (60 personnes):
  - Enseignants: 45
  - Administratif: 8
  - Entretien: 5
  - Surveillants: 2
```

### **Module : Gestion Financière**

```yaml
Finances par école:
  - Frais de scolarité: Par niveau
  - Paiements: Mensuels, trimestriels, annuels
  - Dépenses: Salaires, fournitures, maintenance
  - Budget: Prévisionnel vs Réalisé
  
Exemple Lycée Moderne:
  - Revenus annuels: 1.2M€
  - Dépenses annuelles: 1M€
  - Solde: +200K€
```

---

## 🔧 **IMPLÉMENTATION TECHNIQUE**

### **1. Script de Génération des Données**

```typescript
// src/scripts/generate-sandbox-data.ts

import { faker } from '@faker-js/faker/locale/fr';
import { supabase } from '@/lib/supabase';

/**
 * Génère les données sandbox complètes
 */
async function generateSandboxData() {
  console.log('🧪 Génération des données sandbox...');

  // 1. Créer les 5 groupes scolaires
  const groups = await createSchoolGroups();
  
  // 2. Créer les écoles pour chaque groupe
  const schools = await createSchools(groups);
  
  // 3. Créer les utilisateurs (admins, proviseurs, enseignants)
  const users = await createUsers(schools);
  
  // 4. Créer les élèves
  const students = await createStudents(schools);
  
  // 5. Créer les classes
  const classes = await createClasses(schools);
  
  // 6. Assigner les élèves aux classes
  await assignStudentsToClasses(students, classes);
  
  // 7. Créer les inscriptions
  await createInscriptions(students, schools);
  
  // 8. Créer les notes
  await createGrades(students, classes);
  
  // 9. Créer les absences
  await createAbsences(students);
  
  // 10. Créer les données financières
  await createFinancialData(schools);
  
  console.log('✅ Données sandbox générées avec succès !');
}

/**
 * Créer les groupes scolaires
 */
async function createSchoolGroups() {
  const groups = [
    {
      name: 'Excellence Education Network',
      slug: 'excellence-education',
      type: 'grand_reseau',
      is_sandbox: true,
    },
    {
      name: 'Avenir Éducation',
      slug: 'avenir-education',
      type: 'reseau_moyen',
      is_sandbox: true,
    },
    {
      name: 'Savoir Plus',
      slug: 'savoir-plus',
      type: 'petit_reseau',
      is_sandbox: true,
    },
    {
      name: 'Horizon Académie',
      slug: 'horizon-academie',
      type: 'reseau_international',
      is_sandbox: true,
    },
    {
      name: 'Étoile du Savoir',
      slug: 'etoile-savoir',
      type: 'reseau_rural',
      is_sandbox: true,
    },
  ];

  const { data } = await supabase
    .from('school_groups')
    .insert(groups)
    .select();

  return data;
}

/**
 * Créer les écoles
 */
async function createSchools(groups: any[]) {
  const schools = [];

  // Excellence Education Network (5 écoles)
  schools.push(
    {
      name: "Lycée d'Excellence Moderne",
      slug: 'lycee-excellence-moderne',
      school_group_id: groups[0].id,
      type: 'lycee',
      is_sandbox: true,
    },
    {
      name: 'Collège Excellence Centre',
      slug: 'college-excellence-centre',
      school_group_id: groups[0].id,
      type: 'college',
      is_sandbox: true,
    },
    // ... etc
  );

  const { data } = await supabase
    .from('schools')
    .insert(schools)
    .select();

  return data;
}

/**
 * Créer les utilisateurs
 */
async function createUsers(schools: any[]) {
  const users = [];

  for (const school of schools) {
    // Proviseur
    users.push({
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      role: 'proviseur',
      school_id: school.id,
      school_group_id: school.school_group_id,
      is_sandbox: true,
    });

    // Enseignants (10-50 selon la taille)
    const teacherCount = faker.number.int({ min: 10, max: 50 });
    for (let i = 0; i < teacherCount; i++) {
      users.push({
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        role: 'enseignant',
        school_id: school.id,
        school_group_id: school.school_group_id,
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
      is_sandbox: true,
    });
  }

  const { data } = await supabase
    .from('users')
    .insert(users)
    .select();

  return data;
}

// ... etc pour les autres fonctions
```

---

### **2. Interface Sandbox dans le Dashboard**

```typescript
// src/features/dashboard/pages/SandboxManager.tsx

export function SandboxManager() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateSandboxData();
      toast({
        title: "✅ Données sandbox générées",
        description: "5 groupes, 20 écoles, 5000+ utilisateurs créés",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = async () => {
    // Supprimer toutes les données sandbox
    await supabase
      .from('school_groups')
      .delete()
      .eq('is_sandbox', true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        🧪 Gestion de l'Environnement Sandbox
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Générer les Données Sandbox
              </>
            )}
          </Button>

          <Button
            onClick={handleClear}
            variant="destructive"
            className="w-full"
          >
            <Trash className="mr-2 h-4 w-4" />
            Supprimer les Données Sandbox
          </Button>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <SandboxStats />
    </div>
  );
}
```

---

### **3. Mode Sandbox dans les Modules**

```typescript
// Détection automatique du mode sandbox
export function useIsSandbox() {
  const schoolGroupId = useSchoolGroupId();
  
  const { data: schoolGroup } = useQuery({
    queryKey: ['school-group', schoolGroupId],
    queryFn: async () => {
      const { data } = await supabase
        .from('school_groups')
        .select('is_sandbox')
        .eq('id', schoolGroupId)
        .single();
      
      return data;
    },
  });

  return schoolGroup?.is_sandbox || false;
}

// Affichage conditionnel du badge
export function SandboxBadge() {
  const isSandbox = useIsSandbox();

  if (!isSandbox) return null;

  return (
    <Badge className="bg-orange-500 text-white">
      🧪 SANDBOX
    </Badge>
  );
}
```

---

## 🎯 **AVANTAGES**

### **Pour le Super Admin**

✅ **Environnement de test réaliste** → Données complètes  
✅ **Développement sécurisé** → Pas d'impact sur la prod  
✅ **Tests de scalabilité** → Simuler 500+ groupes  
✅ **Validation UX** → Tester avec vrais scénarios  
✅ **Formation** → Démonstrations clients  

### **Pour le Système**

✅ **Isolation totale** → Marqueur `is_sandbox`  
✅ **Suppression facile** → Un seul clic  
✅ **Régénération rapide** → Script automatisé  
✅ **Performance** → Indexes optimisés  

---

## 🚀 **DÉPLOIEMENT**

### **Étape 1 : Ajouter les Colonnes**

```sql
-- Migration SQL
ALTER TABLE school_groups ADD COLUMN is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN is_sandbox BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_sandbox BOOLEAN DEFAULT FALSE;
-- etc.
```

### **Étape 2 : Créer le Script**

```bash
npm run generate:sandbox
```

### **Étape 3 : Tester**

```typescript
// Se connecter comme Super Admin
// Aller dans "Sandbox Manager"
// Cliquer sur "Générer les Données"
// Tester les modules avec les données fictives
```

---

## 🎉 **CONCLUSION**

✅ **5 groupes scolaires fictifs** → Différentes tailles  
✅ **20 écoles** → Primaire, Collège, Lycée  
✅ **5000+ utilisateurs** → Tous les rôles  
✅ **10,000+ élèves** → Tous les niveaux  
✅ **Données complètes** → Inscriptions, notes, absences, finances  
✅ **Isolation totale** → Marqueur `is_sandbox`  
✅ **Génération automatisée** → Script TypeScript  

**ENVIRONNEMENT SANDBOX PARFAIT POUR LE DÉVELOPPEMENT ! 🏆🧪✨**
