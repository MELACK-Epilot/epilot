# ✅ Correction Avatars - Fallback sur Logo Groupe

## 🎯 Problème Identifié

Les admins de groupe n'avaient pas de photo de profil personnelle (`avatar_url` est `null`), mais ils ont un **logo de groupe scolaire** qui doit être utilisé comme photo de profil.

## 🔧 Solution Technique

### Logique de Fallback (COALESCE)

La vue `messages_with_read_status` a été modifiée pour utiliser intelligemment la meilleure image disponible :

```sql
COALESCE(sender.avatar_url, sg.logo) as sender_avatar
```

1. **Priorité 1** : Photo personnelle de l'utilisateur (`profiles.avatar_url`)
2. **Priorité 2** : Logo du groupe scolaire (`school_groups.logo`)
3. **Fallback** : `NULL` (Affichage des initiales côté frontend)

### Vue SQL Mise à Jour

```sql
CREATE OR REPLACE VIEW messages_with_read_status AS
SELECT 
  m.id,
  ...
  -- Avatar intelligent
  COALESCE(sender.avatar_url, sg.logo) as sender_avatar,
  ...
FROM messages m
LEFT JOIN profiles sender ON m.sender_id = sender.id
LEFT JOIN school_groups sg ON sender.school_group_id = sg.id
...
```

## 📊 Résultat Visuel

### Cas 1 : Admin de Groupe (Sans photo perso, avec logo groupe)
- **Affiche** : Le logo du groupe (ex: Logo "L'INTELIGENCE CELESTE")
- **Source** : `school_groups.logo` (Base64)

### Cas 2 : Utilisateur avec Photo Perso
- **Affiche** : Sa photo de profil
- **Source** : `profiles.avatar_url`

### Cas 3 : Utilisateur sans rien (ex: Super Admin sans groupe)
- **Affiche** : Initiales dans un cercle dégradé
- **Source** : Frontend fallback

## ✅ Avantages

- ✅ **Automatique** : Pas besoin de configurer manuellement les photos
- ✅ **Cohérent** : Les admins représentent leur groupe scolaire
- ✅ **Immédiat** : Les logos existants s'affichent tout de suite
- ✅ **Robuste** : Fallback sur initiales si pas de logo

**Les logos des groupes s'affichent maintenant comme photos de profil pour les admins !** 🚀✨
