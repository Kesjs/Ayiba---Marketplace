-- 1. Ajout des caractéristiques dynamiques à la table articles
alter table public.articles add column if not exists caracteristiques jsonb default '[]'::jsonb;

-- 2. Création de la table article_questions (Foire Aux Questions)
create table if not exists public.article_questions (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references public.articles on delete cascade not null,
  client_id uuid references public.users on delete cascade not null,
  question text not null,
  reponse text,
  repondu_le timestamptz,
  created_at timestamptz default now()
);

-- Index pour performance
create index if not exists idx_article_questions_article on public.article_questions(article_id);
create index if not exists idx_article_questions_client on public.article_questions(client_id);

-- RLS pour article_questions
alter table public.article_questions enable row level security;

-- Tout le monde peut lire les questions
create policy "lecture publique questions" on public.article_questions
  for select using (true);

-- Le client peut poser une question
create policy "création question client" on public.article_questions
  for insert with check (auth.uid() = client_id);

-- Le vendeur peut répondre aux questions sur ses articles
create policy "réponse vendeur" on public.article_questions
  for update using (
    exists (
      select 1 from public.articles a
      where a.id = article_id
      and a.vendeur_id = auth.uid()
    )
  );

-- 3. Création de la table article_signalements (Signalements)
create table if not exists public.article_signalements (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references public.articles on delete cascade not null,
  client_id uuid references public.users on delete set null,
  motif text not null,
  details text,
  statut text check (statut in ('nouveau', 'traité', 'rejeté')) default 'nouveau',
  created_at timestamptz default now()
);

-- Index pour performance
create index if not exists idx_article_signalements_article on public.article_signalements(article_id);

-- RLS pour article_signalements
alter table public.article_signalements enable row level security;

-- Seuls les admins peuvent lire les signalements (on se base sur le rôle admin si existant)
create policy "lecture admin signalements" on public.article_signalements
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Tout le monde peut créer un signalement
create policy "création signalement" on public.article_signalements
  for insert with check (
    client_id = auth.uid() or client_id is null
  );
