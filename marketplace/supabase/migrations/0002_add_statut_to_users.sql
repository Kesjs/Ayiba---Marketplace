-- Add statut column to users table
alter table public.users 
add column statut text check (statut in ('actif','suspendu','banni')) default 'actif';

-- Add index for faster queries
create index idx_users_statut on public.users(statut);
