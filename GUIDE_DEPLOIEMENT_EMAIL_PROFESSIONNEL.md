# 📧 Guide de Déploiement - Système d'Email Professionnel

**Date**: 26 Novembre 2025  
**Status**: ✅ **PRÊT POUR DÉPLOIEMENT**

---

## 🎯 Objectif

Remplacer la simulation d'envoi d'emails par un **système professionnel et dynamique** qui communique avec la base de données et envoie de vrais emails via **Resend**.

---

## 📦 Composants Implémentés

### 1. Table `email_logs`
**Fichier**: `database/CREATE_EMAIL_LOGS_TABLE.sql`

Stocke l'historique de tous les emails envoyés :
- ID du paiement
- Email destinataire
- Type d'email (receipt, reminder, overdue)
- Statut (pending, sent, failed)
- Date d'envoi
- Message d'erreur (si échec)

### 2. Edge Function `send-payment-email`
**Fichier**: `supabase/functions/send-payment-email/index.ts`

Fonction serverless qui :
- Récupère les détails du paiement depuis `payments_enriched`
- Récupère l'email du groupe scolaire
- Génère un email HTML professionnel selon le type
- Envoie l'email via l'API Resend
- Enregistre le log dans `email_logs`

### 3. Hook `usePaymentActions` (Modifié)
**Fichier**: `src/features/dashboard/hooks/usePaymentActions.ts`

Appelle maintenant la vraie Edge Function au lieu de simuler.

---

## 🚀 Étapes de Déploiement

### Étape 1 : Créer un Compte Resend (Gratuit)

1. Aller sur [resend.com](https://resend.com)
2. Créer un compte gratuit (3000 emails/mois)
3. Vérifier votre domaine (ou utiliser le domaine de test)
4. Générer une clé API

### Étape 2 : Créer la Table `email_logs`

Exécuter le script SQL dans Supabase :

```bash
# Via l'interface Supabase
SQL Editor > New Query > Coller le contenu de CREATE_EMAIL_LOGS_TABLE.sql > Run
```

Ou via le MCP Server :

```typescript
mcp3_execute_sql({
  project_id: "csltuxbanvweyfzqpfap",
  query: "-- Contenu du fichier CREATE_EMAIL_LOGS_TABLE.sql"
})
```

### Étape 3 : Déployer l'Edge Function

```bash
# Se connecter à Supabase CLI
supabase login

# Lier le projet
supabase link --project-ref csltuxbanvweyfzqpfap

# Déployer la fonction
supabase functions deploy send-payment-email

# Configurer la clé API Resend
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Ou via le MCP Server :

```typescript
mcp3_deploy_edge_function({
  project_id: "csltuxbanvweyfzqpfap",
  name: "send-payment-email",
  files: [
    {
      name: "index.ts",
      content: "// Contenu du fichier index.ts"
    }
  ],
  entrypoint_path: "index.ts"
})
```

### Étape 4 : Configurer les Secrets

Dans le Dashboard Supabase :
1. Aller dans **Settings > Edge Functions**
2. Ajouter les secrets :
   - `RESEND_API_KEY` : Votre clé API Resend
   - `SUPABASE_URL` : URL de votre projet (auto-configuré)
   - `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (auto-configuré)

### Étape 5 : Tester l'Envoi d'Email

Dans l'application, cliquer sur "Relancer" dans une alerte de paiement.

Vérifier :
1. **Console** : Aucune erreur
2. **Table `email_logs`** : Un nouveau log avec `status = 'sent'`
3. **Boîte email** : Email reçu

---

## 📧 Types d'Emails Envoyés

### 1. Reçu de Paiement (`receipt`)
- **Quand** : Après validation d'un paiement
- **Contenu** : Confirmation, montant, facture, date
- **Couleur** : Vert (succès)

### 2. Rappel de Paiement (`reminder`)
- **Quand** : Paiement en attente (non en retard)
- **Contenu** : Rappel, montant, date d'échéance
- **Couleur** : Jaune (attention)

### 3. Paiement en Retard (`overdue`)
- **Quand** : Paiement dépassé la date d'échéance
- **Contenu** : Alerte, montant, date dépassée, urgence
- **Couleur** : Rouge (critique)

---

## 🔍 Vérification de la Configuration

### Vérifier que la Table Existe

```sql
SELECT * FROM email_logs LIMIT 5;
```

### Vérifier que l'Edge Function est Déployée

```bash
supabase functions list
```

Ou dans le Dashboard Supabase : **Edge Functions** > Voir `send-payment-email`

### Tester Manuellement l'Edge Function

```bash
curl -X POST https://csltuxbanvweyfzqpfap.supabase.co/functions/v1/send-payment-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "63ffa6d7-4d61-4655-93bc-534ffaeb7eba", "type": "reminder"}'
```

---

## 📊 Suivi des Emails

### Voir l'Historique des Emails

```sql
SELECT 
  el.created_at,
  el.email_type,
  el.recipient_email,
  el.status,
  p.invoice_number,
  p.amount
FROM email_logs el
JOIN payments p ON el.payment_id = p.id
ORDER BY el.created_at DESC
LIMIT 20;
```

### Statistiques d'Envoi

```sql
SELECT 
  email_type,
  status,
  COUNT(*) as count
FROM email_logs
GROUP BY email_type, status
ORDER BY email_type, status;
```

---

## 🎉 Résultat Final

Vous avez maintenant un **système d'email professionnel** qui :
- ✅ Envoie de **vrais emails** via Resend
- ✅ Stocke l'**historique** dans la base de données
- ✅ Gère les **erreurs** et les logs
- ✅ Utilise des **templates HTML** professionnels
- ✅ Est **scalable** (3000 emails/mois gratuits, puis payant)
- ✅ Est **dynamique** et communique avec Supabase

Fini les simulations ! 🚀
