-- ==========================================================
--  SYNCHRONISATION auth.users -> public.users
--  Date : 04/11/2025
--  Objectif : garantir que tout utilisateur Auth possède
--             sa fiche métier dans public.users
-- ==========================================================

-- 🛑 À exécuter une seule fois pour mettre à jour la base actuelle
--    Puis laisser le trigger gérer les futurs utilisateurs

begin;

-- 1) Insérer les utilisateurs Auth manquants dans public.users
insert into public.users (
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at,
  updated_at
)
select
  au.id,
  au.email,
  coalesce(split_part(au.email, '@', 1), '') as first_name,
  '' as last_name,
  'autre'::public.user_role as role,
  'inactive'::public.user_status as status,
  au.created_at,
  au.created_at
from auth.users au
where not exists (
  select 1 from public.users pu where pu.id = au.id
);

-- 2) Fonction de trigger : création automatique dans public.users
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    created_at,
    updated_at
  ) values (
    new.id,
    new.email,
    coalesce(split_part(new.email, '@', 1), ''),
    '',
    'autre'::user_role,
    'inactive'::user_status,
    new.created_at,
    new.created_at
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 3) Trigger sur auth.users (INSERT)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_auth_user();
  end if;
end;
$$;

-- 4) (Optionnel) Trigger suppression : garder cohérence
create or replace function public.handle_delete_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_deleted'
  ) then
    create trigger on_auth_user_deleted
    after delete on auth.users
    for each row
    execute function public.handle_delete_auth_user();
  end if;
end;
$$;

commit;

-- ==========================================================
--  POST-ACTION : Compléter les informations utilisateurs
-- ==========================================================
-- Les nouvelles fiches auront :
--   first_name  = partie avant @
--   last_name   = ''
--   role        = 'autre'
--   status      = 'inactive'
-- Il faudra ensuite mettre à jour :
--   - first_name / last_name
--   - role (ex: 'proviseur')
--   - school_id / school_group_id
--   - status = 'active'
-- Exemple :
-- UPDATE public.users
-- SET first_name = 'Ramsès',
--     last_name = 'MELACK',
--     role = 'proviseur'::user_role,
--     status = 'active'::user_status
-- WHERE email = 'int01@epilot.cg';
-- ==========================================================
