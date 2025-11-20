# 🛡️ RATE LIMITING - Guide Complet E-Pilot

**Date:** 20 novembre 2025  
**Importance:** ⭐⭐⭐⭐⭐ **CRITIQUE**

---

## 🎯 C'EST QUOI LE RATE LIMITING?

**Définition simple:**
Le Rate Limiting limite le **nombre de requêtes** qu'un utilisateur peut faire dans un **temps donné**.

**Exemple concret:**
- ✅ Maximum **100 requêtes par minute** par utilisateur
- ✅ Maximum **10 créations de groupes par heure**
- ✅ Maximum **5 tentatives de connexion par 15 minutes**

---

## 🚨 POURQUOI C'EST CAPITAL?

### 1. 🛡️ **Sécurité - Protection contre les attaques**

#### Attaque par Force Brute
**Sans Rate Limiting:**
```
Hacker essaie 10,000 mots de passe en 1 minute
→ Peut trouver le mot de passe rapidement
→ COMPTE PIRATÉ ❌
```

**Avec Rate Limiting:**
```
Limite: 5 tentatives par 15 minutes
→ Hacker bloqué après 5 essais
→ COMPTE PROTÉGÉ ✅
```

#### Attaque DDoS (Déni de Service)
**Sans Rate Limiting:**
```
Attaquant envoie 100,000 requêtes/seconde
→ Serveur surchargé
→ APPLICATION INACCESSIBLE ❌
→ Coût Supabase EXPLOSE 💸
```

**Avec Rate Limiting:**
```
Limite: 100 requêtes/minute par IP
→ Requêtes excessives bloquées
→ APPLICATION RESTE ACCESSIBLE ✅
→ Coûts maîtrisés 💰
```

---

### 2. 💰 **Coûts - Protection financière**

#### Scénario réel E-Pilot:

**Sans Rate Limiting:**
```
Un utilisateur malveillant (ou bug) fait:
- 1,000 requêtes/seconde à Supabase
- 24h/24 pendant 1 mois
= 2,592,000,000 requêtes/mois

Coût Supabase:
- Plan Pro: $25/mois pour 5M requêtes
- Dépassement: $0.50 par 100k requêtes
= $12,935/mois 💸💸💸
```

**Avec Rate Limiting:**
```
Limite: 100 requêtes/minute par utilisateur
= 144,000 requêtes/jour max
= 4,320,000 requêtes/mois

Coût Supabase:
- Plan Pro: $25/mois ✅
```

**ÉCONOMIE: $12,910/mois!** 💰

---

### 3. ⚡ **Performance - Stabilité de l'application**

#### Sans Rate Limiting:
```
100 utilisateurs font chacun 1000 requêtes/seconde
→ 100,000 requêtes/seconde au total
→ Base de données surchargée
→ Temps de réponse: 30 secondes ❌
→ Application inutilisable
```

#### Avec Rate Limiting:
```
100 utilisateurs limités à 100 requêtes/minute
→ 167 requêtes/seconde au total
→ Base de données fluide
→ Temps de réponse: 100ms ✅
→ Application rapide
```

---

### 4. 🐛 **Protection contre les bugs**

#### Scénario réel:

**Bug dans le code:**
```javascript
// ❌ BUG - Boucle infinie
useEffect(() => {
  fetchData(); // Appelle l'API
}, [data]); // data change à chaque fetch → boucle infinie!
```

**Sans Rate Limiting:**
```
→ 10,000 requêtes en 10 secondes
→ Serveur crash
→ Facture énorme
```

**Avec Rate Limiting:**
```
→ 100 requêtes puis BLOQUÉ
→ Alerte envoyée
→ Bug détecté rapidement
→ Dégâts limités ✅
```

---

## 🎯 EXEMPLES CONCRETS POUR E-PILOT

### 1. Connexion / Authentification

```typescript
// ✅ LIMITE RECOMMANDÉE
- 5 tentatives de connexion par 15 minutes
- 10 demandes de reset password par heure
- 3 créations de compte par IP par jour
```

**Pourquoi?**
- Empêche force brute sur mots de passe
- Empêche spam de création de comptes
- Empêche abus de reset password

---

### 2. Création de Données

```typescript
// ✅ LIMITES RECOMMANDÉES
- 10 créations de groupes scolaires par heure
- 50 créations d'utilisateurs par heure
- 100 créations d'écoles par jour
```

**Pourquoi?**
- Empêche spam de données
- Empêche saturation de la BD
- Détecte comportements anormaux

---

### 3. Requêtes de Lecture

```typescript
// ✅ LIMITES RECOMMANDÉES
- 100 requêtes API par minute (lecture)
- 1000 requêtes API par heure
- 10,000 requêtes API par jour
```

**Pourquoi?**
- Empêche scraping de données
- Protège contre DDoS
- Maîtrise les coûts

---

### 4. Modifications de Données

```typescript
// ✅ LIMITES RECOMMANDÉES
- 50 updates par minute
- 500 updates par heure
- 20 suppressions par heure
```

**Pourquoi?**
- Empêche modifications massives malveillantes
- Protège l'intégrité des données
- Détecte bugs rapidement

---

## 🔧 IMPLÉMENTATION DANS E-PILOT

### Option 1: Rate Limiting Supabase (Natif) ✅

**Avantages:**
- ✅ Déjà intégré dans Supabase
- ✅ Pas de code supplémentaire
- ✅ Gestion automatique

**Configuration:**
```sql
-- Dans Supabase Dashboard → Settings → API

-- Rate limits par défaut:
- Anonymous users: 100 req/min
- Authenticated users: 200 req/min
- Service role: Unlimited

-- Personnalisation possible via Dashboard
```

---

### Option 2: Rate Limiting Custom (Edge Functions) ✅

**Pour contrôle précis:**

```typescript
// supabase/functions/rate-limiter/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

// Configuration des limites
const RATE_LIMITS = {
  login: { max: 5, window: 15 * 60 * 1000 }, // 5 par 15min
  createGroup: { max: 10, window: 60 * 60 * 1000 }, // 10 par heure
  api: { max: 100, window: 60 * 1000 }, // 100 par minute
};

serve(async (req) => {
  const { action, userId } = await req.json();
  
  // Récupérer le compteur de l'utilisateur
  const key = `rate_limit:${userId}:${action}`;
  const { data: counter } = await supabase
    .from('rate_limit_counters')
    .select('count, reset_at')
    .eq('key', key)
    .single();
  
  const limit = RATE_LIMITS[action];
  const now = Date.now();
  
  // Vérifier si la fenêtre est expirée
  if (counter && counter.reset_at < now) {
    // Reset le compteur
    await supabase
      .from('rate_limit_counters')
      .update({ count: 0, reset_at: now + limit.window })
      .eq('key', key);
  }
  
  // Vérifier la limite
  if (counter && counter.count >= limit.max) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retry_after: counter.reset_at - now,
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Incrémenter le compteur
  await supabase.rpc('increment_rate_limit', { key });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

### Option 3: Rate Limiting Frontend (Première ligne) ✅

**Pour UX et économie de requêtes:**

```typescript
// src/hooks/useRateLimitedMutation.ts

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const useRateLimitedMutation = <T, V>(
  mutationFn: (variables: V) => Promise<T>,
  config: RateLimitConfig
) => {
  const [requests, setRequests] = useState<number[]>([]);
  
  return useMutation({
    mutationFn: async (variables: V) => {
      const now = Date.now();
      
      // Nettoyer les anciennes requêtes
      const recentRequests = requests.filter(
        time => now - time < config.windowMs
      );
      
      // Vérifier la limite
      if (recentRequests.length >= config.maxRequests) {
        const oldestRequest = Math.min(...recentRequests);
        const waitTime = config.windowMs - (now - oldestRequest);
        
        toast.error('⏱️ Trop de requêtes', {
          description: `Veuillez patienter ${Math.ceil(waitTime / 1000)}s`,
        });
        
        throw new Error('Rate limit exceeded');
      }
      
      // Ajouter la requête actuelle
      setRequests([...recentRequests, now]);
      
      // Exécuter la mutation
      return mutationFn(variables);
    },
  });
};

// Utilisation
const createGroup = useRateLimitedMutation(
  (data) => supabase.from('school_groups').insert(data),
  { maxRequests: 10, windowMs: 60 * 60 * 1000 } // 10 par heure
);
```

---

## 📊 TABLE DE RATE LIMITS RECOMMANDÉE

### Pour E-Pilot

| Action | Limite | Fenêtre | Raison |
|--------|--------|---------|--------|
| **Authentification** |
| Connexion | 5 | 15 min | Anti force brute |
| Reset password | 3 | 1 heure | Anti spam |
| Création compte | 3 | 1 jour | Anti spam |
| **Création de données** |
| Créer groupe | 10 | 1 heure | Usage normal |
| Créer école | 50 | 1 heure | Usage normal |
| Créer utilisateur | 100 | 1 heure | Import batch |
| **Lecture** |
| API GET | 100 | 1 minute | Performance |
| Export CSV | 10 | 1 heure | Ressources serveur |
| **Modification** |
| UPDATE | 50 | 1 minute | Usage normal |
| DELETE | 20 | 1 heure | Sécurité |
| Bulk actions | 5 | 1 heure | Ressources serveur |

---

## 🚨 ALERTES ET MONITORING

### Créer une table de logs

```sql
-- Table pour tracker les violations
CREATE TABLE rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_violations_user ON rate_limit_violations(user_id);
CREATE INDEX idx_violations_created ON rate_limit_violations(created_at DESC);
```

### Alertes automatiques

```typescript
// Edge Function pour alertes
const checkViolations = async (userId: string) => {
  const { data: violations } = await supabase
    .from('rate_limit_violations')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000));
  
  // Si plus de 10 violations en 24h
  if (violations.length > 10) {
    // Envoyer alerte à l'admin
    await sendAdminAlert({
      type: 'RATE_LIMIT_ABUSE',
      userId,
      count: violations.length,
    });
    
    // Suspendre temporairement l'utilisateur
    await supabase
      .from('users')
      .update({ status: 'suspended', suspended_reason: 'Rate limit abuse' })
      .eq('id', userId);
  }
};
```

---

## 🎯 PLAN D'IMPLÉMENTATION POUR E-PILOT

### Phase 1: Immédiat (Cette semaine) ⭐⭐⭐⭐⭐

1. **Activer Rate Limiting Supabase natif**
   - Dashboard Supabase → Settings → API
   - Configurer limites par défaut

2. **Ajouter Rate Limiting sur connexion**
   - 5 tentatives par 15 minutes
   - Bloquer IP après dépassement

### Phase 2: Court terme (Ce mois) ⭐⭐⭐⭐

3. **Implémenter Rate Limiting custom**
   - Edge Function pour actions critiques
   - Table `rate_limit_counters`

4. **Ajouter monitoring**
   - Table `rate_limit_violations`
   - Alertes admin

### Phase 3: Moyen terme (Prochain mois) ⭐⭐⭐

5. **Rate Limiting frontend**
   - Hook `useRateLimitedMutation`
   - Feedback utilisateur

6. **Dashboard admin**
   - Voir les violations
   - Gérer les suspensions

---

## 💡 BONNES PRATIQUES

### ✅ À FAIRE

1. **Limites progressives**
   ```
   - Utilisateur normal: 100 req/min
   - Utilisateur premium: 200 req/min
   - Admin: 500 req/min
   ```

2. **Messages clairs**
   ```typescript
   toast.error('⏱️ Trop de requêtes', {
     description: 'Limite: 10 créations/heure. Réessayez dans 45 minutes.',
   });
   ```

3. **Headers informatifs**
   ```typescript
   Response.headers = {
     'X-RateLimit-Limit': '100',
     'X-RateLimit-Remaining': '45',
     'X-RateLimit-Reset': '1637000000',
   };
   ```

### ❌ À ÉVITER

1. **Limites trop strictes**
   ```
   ❌ 10 requêtes/jour → Utilisateurs frustrés
   ✅ 10,000 requêtes/jour → Usage normal
   ```

2. **Pas de feedback**
   ```
   ❌ Erreur 429 sans explication
   ✅ Message clair + temps d'attente
   ```

3. **Même limite pour tout**
   ```
   ❌ Lecture et écriture même limite
   ✅ Lecture: 1000/h, Écriture: 100/h
   ```

---

## 🎯 CONCLUSION

### Rate Limiting est CAPITAL pour E-Pilot car:

1. **Sécurité** 🛡️
   - Protège contre force brute
   - Protège contre DDoS
   - Détecte comportements suspects

2. **Coûts** 💰
   - Économie de **$10,000+/mois** potentielle
   - Maîtrise de la facture Supabase
   - Prédictibilité des coûts

3. **Performance** ⚡
   - Application stable
   - Temps de réponse rapides
   - Expérience utilisateur fluide

4. **Qualité** 🐛
   - Détecte les bugs rapidement
   - Limite les dégâts
   - Facilite le debugging

### Recommandation:

✅ **IMPLÉMENTER IMMÉDIATEMENT** le Rate Limiting Supabase natif  
✅ **PLANIFIER** le Rate Limiting custom pour actions critiques  
✅ **MONITORER** les violations régulièrement

**C'est un investissement de 2-3 jours qui peut sauver l'application et économiser des milliers d'euros!** 🎯💰🛡️

---

**Date:** 20 novembre 2025  
**Priorité:** ⭐⭐⭐⭐⭐ CRITIQUE  
**Impact:** Sécurité + Coûts + Performance
