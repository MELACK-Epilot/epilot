# 🇨🇬 RÔLES FINAUX SIMPLIFIÉS - E-PILOT CONGO

## 🎯 CLARIFICATION IMPORTANTE

### Directeur vs Proviseur = MÊME RÔLE!

**Différence:** Juste la terminologie selon le niveau
```
🏫 PRIMAIRE/COLLÈGE → Directeur
🎓 LYCÉE → Proviseur

Mais dans le système = MÊME profil d'accès!
```

---

## ⭐ 3 RÔLES OBLIGATOIRES + 1 OPTIONNEL

### 🎓 1. CHEF D'ÉTABLISSEMENT (Niveau 80)
**Appelé "Directeur" (Primaire/Collège) OU "Proviseur" (Lycée)**

**Accès COMPLET - Responsable de tout**

**Responsabilités:**
- Direction générale de l'établissement
- Validation bulletins et décisions importantes
- Supervision discipline et vie scolaire
- Approbation finances (validation uniquement)
- Relations avec Ministère et parents
- Rapports statistiques

**Modules:**
```
✅ Gestion des élèves (inscriptions, dossiers, effectifs)
✅ Bulletins scolaires (validation finale)
✅ Notes et évaluations (consultation, validation)
✅ Vie scolaire (absences, retards, discipline)
✅ Emploi du temps (supervision)
✅ Caisse scolaire (consultation + validation)
✅ Statistiques (rapports ministère)
✅ Communication (parents, personnel, administration)
✅ Documents administratifs (consultation)
```

**Profil d'Accès:** `CHEF_ETABLISSEMENT`
```typescript
{
  pedagogie: { read: true, write: true, delete: false, export: true, validate: true },
  vie_scolaire: { read: true, write: true, delete: false, export: true, validate: true },
  administration: { read: true, write: true, delete: false, export: true, validate: true },
  finances: { read: true, write: false, delete: false, export: true, validate: true },
  statistiques: { read: true, write: false, delete: false, export: true, validate: false }
}
```

**Résumé:** TOUT sauf saisie finances (validation uniquement) et suppression

---

### 💰 2. COMPTABLE/ÉCONOME (Niveau 35)
**Gestion financière UNIQUEMENT**

**Responsabilités:**
- Gestion de la caisse scolaire
- Enregistrement des paiements (frais scolaires)
- Facturation (scolarité, fournitures)
- Suivi des paiements et relances
- Rapports financiers mensuels
- Paiement salaires (si école privée)

**Modules:**
```
✅ Caisse scolaire (gestion complète)
✅ Paiements (enregistrement, suivi)
✅ Facturation (création factures)
✅ Statistiques financières (rapports)
✅ Gestion élèves (consultation pour paiements)
❌ PAS de suppression transactions (audit trail)
❌ PAS d'accès notes/bulletins
❌ PAS d'accès vie scolaire
```

**Profil d'Accès:** `FINANCIER_SANS_SUPPRESSION`
```typescript
{
  pedagogie: { read: false, write: false, delete: false, export: false, validate: false },
  vie_scolaire: { read: false, write: false, delete: false, export: false, validate: false },
  administration: { read: true, write: false, delete: false, export: false, validate: false }, // Consultation élèves
  finances: { read: true, write: true, delete: false, export: true, validate: false },
  statistiques: { read: true, write: false, delete: false, export: true, validate: false }
}
```

**Résumé:** FINANCES uniquement, PAS de suppression, consultation élèves (pour paiements)

---

### 📋 3. SECRÉTAIRE (Niveau 30)
**Administration UNIQUEMENT**

**Responsabilités:**
- Inscriptions des nouveaux élèves
- Gestion des dossiers administratifs
- Génération certificats de scolarité
- Accueil des parents
- Courriers et correspondances
- Archivage documents

**Modules:**
```
✅ Gestion des élèves (inscriptions, dossiers, effectifs)
✅ Certificats (génération automatique)
✅ Documents administratifs (création, gestion)
✅ Communication (courriers, parents)
✅ Bulletins (consultation pour parents)
✅ Emploi du temps (consultation)
✅ Vie scolaire (consultation absences)
❌ PAS d'accès notes (saisie)
❌ PAS d'accès finances
❌ PAS de modification bulletins
```

**Profil d'Accès:** `ADMINISTRATIF_BASIQUE`
```typescript
{
  pedagogie: { read: true, write: false, delete: false, export: false, validate: false },
  vie_scolaire: { read: true, write: false, delete: false, export: false, validate: false },
  administration: { read: true, write: true, delete: false, export: true, validate: false },
  finances: { read: false, write: false, delete: false, export: false, validate: false },
  statistiques: { read: true, write: false, delete: false, export: true, validate: false }
}
```

**Résumé:** ADMINISTRATION + consultation pédagogie, PAS finances, PAS notes

---

### 👨‍🏫 4. ENSEIGNANT (Niveau 45) - OPTIONNEL
**Saisie notes UNIQUEMENT (si école a plusieurs ordinateurs)**

**Responsabilités:**
- Saisie des notes de ses matières
- Consultation bulletins de ses élèves
- Consultation emploi du temps
- Consultation liste élèves

**Modules:**
```
✅ Notes et évaluations (saisie ses matières)
✅ Bulletins (consultation uniquement)
✅ Emploi du temps (consultation)
✅ Gestion élèves (consultation liste)
✅ Vie scolaire (consultation absences)
❌ PAS de modification bulletins
❌ PAS d'accès finances
❌ PAS d'accès administration
❌ PAS de suppression
```

**Profil d'Accès:** `ENSEIGNANT_SAISIE_NOTES`
```typescript
{
  pedagogie: { read: true, write: true, delete: false, export: false, validate: false }, // Saisie notes uniquement
  vie_scolaire: { read: true, write: false, delete: false, export: false, validate: false },
  administration: { read: false, write: false, delete: false, export: false, validate: false },
  finances: { read: false, write: false, delete: false, export: false, validate: false },
  statistiques: { read: false, write: false, delete: false, export: false, validate: false }
}
```

**Résumé:** SAISIE NOTES uniquement, consultation élèves/bulletins/emploi du temps

---

## 🎯 TERMINOLOGIE SELON LE NIVEAU

### Système Éducatif Congo

```
📚 PRIMAIRE (CP1 → CM2)
   Chef: DIRECTEUR
   Profil: CHEF_ETABLISSEMENT

🏫 COLLÈGE (6ème → 3ème)
   Chef: DIRECTEUR
   Profil: CHEF_ETABLISSEMENT

🎓 LYCÉE (2nde → Terminale)
   Chef: PROVISEUR
   Profil: CHEF_ETABLISSEMENT
```

**Dans E-Pilot:**
- 1 seul profil: `CHEF_ETABLISSEMENT`
- Label affiché: "Directeur" OU "Proviseur" selon type établissement
- Permissions: IDENTIQUES

---

## 📊 IMPLÉMENTATION TECHNIQUE

### Table: users
```sql
role VARCHAR(50) CHECK (role IN (
  'chef_etablissement',  -- Directeur OU Proviseur
  'comptable',
  'secretaire',
  'enseignant'
))
```

### Table: schools
```sql
type VARCHAR(20) CHECK (type IN (
  'primaire',
  'college',
  'lycee'
))
```

### Affichage Dynamique
```typescript
function getRoleLabel(user: User, school: School): string {
  if (user.role === 'chef_etablissement') {
    return school.type === 'lycee' ? 'Proviseur' : 'Directeur';
  }
  return ROLE_LABELS[user.role];
}
```

**Exemple:**
```
User: Jean Dupont
Role: chef_etablissement
École: Lycée Victor Hugo

Affichage: "Jean Dupont - Proviseur"

User: Marie Martin
Role: chef_etablissement
École: Collège Savorgnan de Brazza

Affichage: "Marie Martin - Directeur"
```

---

## 🔄 WORKFLOWS SIMPLIFIÉS

### 1. Inscription Élève
```
1. Parent vient à l'école
2. SECRÉTAIRE enregistre dans système
3. SECRÉTAIRE génère certificat inscription
4. Parent paie frais
5. COMPTABLE enregistre paiement
6. DIRECTEUR/PROVISEUR valide si nécessaire
```

### 2. Saisie Notes (École pauvre - 1 PC)
```
1. Enseignants donnent notes sur papier
2. SECRÉTAIRE ou DIRECTEUR/PROVISEUR saisit dans système
3. DIRECTEUR/PROVISEUR valide bulletins
4. SECRÉTAIRE imprime bulletins
5. Distribution aux parents
```

### 3. Saisie Notes (École moyenne - 3 PCs)
```
1. ENSEIGNANTS saisissent directement leurs notes
2. DIRECTEUR/PROVISEUR valide bulletins
3. SECRÉTAIRE imprime bulletins
4. Distribution aux parents
```

### 4. Gestion Finances
```
1. Parent paie frais
2. COMPTABLE enregistre paiement
3. COMPTABLE génère reçu automatique
4. DIRECTEUR/PROVISEUR consulte rapports mensuels
5. DIRECTEUR/PROVISEUR valide si montants importants
```

### 5. Gestion Absences
```
1. Surveillant note absences sur papier
2. SECRÉTAIRE ou DIRECTEUR/PROVISEUR saisit dans système
3. Système génère SMS parents (optionnel)
4. DIRECTEUR/PROVISEUR consulte statistiques
```

---

## 💡 SCÉNARIOS D'UTILISATION

### Scénario A: PRIMAIRE PAUVRE (1 ordinateur)
```
👤 Personnel:
- 1 Directeur
- 1 Comptable
- 1 Secrétaire

💻 Organisation:
- Matin: Secrétaire (inscriptions, accueil)
- Après-midi: Comptable (paiements)
- Soir: Directeur (validation, supervision)

📝 Notes: Sur papier → Secrétaire ou Directeur saisit
```

### Scénario B: COLLÈGE MOYEN (2 ordinateurs)
```
👤 Personnel:
- 1 Directeur
- 1 Comptable
- 1 Secrétaire
- X Enseignants (optionnel)

💻 Organisation:
- PC 1: Secrétariat (Secrétaire)
- PC 2: Comptabilité (Comptable) + Salle profs (Enseignants)

📝 Notes: Enseignants saisissent directement
```

### Scénario C: LYCÉE ÉQUIPÉ (3+ ordinateurs)
```
👤 Personnel:
- 1 Proviseur
- 1 Comptable
- 1 Secrétaire
- X Enseignants

💻 Organisation:
- PC 1: Secrétariat (Secrétaire)
- PC 2: Comptabilité (Comptable)
- PC 3+: Salle profs (Enseignants)

📝 Notes: Enseignants saisissent directement
📊 Validation: Proviseur valide en ligne
```

---

## 📋 RÉSUMÉ FINAL

### 3 RÔLES OBLIGATOIRES

1. **CHEF D'ÉTABLISSEMENT** (Directeur/Proviseur)
   - Profil: `CHEF_ETABLISSEMENT`
   - Accès: COMPLET (sauf suppression)
   - Label: Dynamique selon type école

2. **COMPTABLE/ÉCONOME**
   - Profil: `FINANCIER_SANS_SUPPRESSION`
   - Accès: Finances uniquement
   - Pas de suppression (audit)

3. **SECRÉTAIRE**
   - Profil: `ADMINISTRATIF_BASIQUE`
   - Accès: Administration uniquement
   - Consultation pédagogie

### 1 RÔLE OPTIONNEL

4. **ENSEIGNANT**
   - Profil: `ENSEIGNANT_SAISIE_NOTES`
   - Accès: Saisie notes uniquement
   - Si école a plusieurs PCs

---

## 🎉 AVANTAGES SOLUTION FINALE

```
✅ SIMPLICITÉ MAXIMALE (3-4 rôles)
✅ Formation minimale (3-4 personnes)
✅ Adapté réalité Congo (peu d'ordinateurs)
✅ Terminologie correcte (Directeur/Proviseur)
✅ Contrôle centralisé (Chef établissement)
✅ Sécurité financière (pas de suppression)
✅ Évolutif (ajout Enseignants si besoin)
✅ Coût formation réduit
✅ Maintenance simple
```

---

## 🚀 PROCHAINE ÉTAPE

**Voulez-vous que j'implémente ces 4 profils dans le système?**

Je vais créer:
1. ✅ Enum des 4 rôles
2. ✅ Profils d'accès détaillés
3. ✅ Fonction affichage dynamique (Directeur/Proviseur)
4. ✅ Migration base de données
5. ✅ Interface d'assignation simplifiée

**Prêt à implémenter?** 💡

---

**Développé avec ❤️ pour Écoles Congo-Brazzaville** 🇨🇬  
**Version:** 38.0 Rôles Finaux Simplifiés  
**Date:** 16 Novembre 2025  
**Statut:** 🟢 Terminologie Correcte - Prêt à Implémenter
