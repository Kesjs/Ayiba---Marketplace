-- Extensions
create extension if not exists "uuid-ossp";

-- Users
create table public.users (
  id uuid references auth.users primary key,
  phone text unique not null,
  full_name text,
  avatar_url text,
  role text check (role in ('client','vendeur','livreur')) default 'client',
  note_moyenne numeric(3,2) default 0,
  nb_avis integer default 0,
  created_at timestamptz default now()
);

-- Addresses
create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users not null,
  label text check (label in ('domicile','bureau','autre')) default 'domicile',
  adresse_complete text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  est_defaut boolean default false,
  created_at timestamptz default now()
);

-- Products
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  vendeur_id uuid references public.users not null,
  nom text not null,
  description text,
  prix numeric(10,2) not null,
  ancien_prix numeric(10,2),
  categorie text not null,
  photos text[] default '{}',
  latitude numeric(10,7),
  longitude numeric(10,7),
  statut text check (statut in ('actif','en_attente','suspendu')) default 'en_attente',
  created_at timestamptz default now()
);

-- Favorites
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users not null,
  product_id uuid references public.products not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Orders
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.users not null,
  vendeur_id uuid references public.users not null,
  product_id uuid references public.products not null,
  quantite integer default 1,
  montant_total numeric(10,2) not null,
  statut text check (statut in (
    'en_attente','payé','en_preparation',
    'collecté','en_livraison','livré','annulé'
  )) default 'en_attente',
  statut_paiement text check (statut_paiement in (
    'non_payé','en_sequestre','débloqué','remboursé'
  )) default 'non_payé',
  fedapay_transaction_id text,
  otp_livraison text,
  otp_confirme boolean default false,
  livreur_latitude numeric(10,7),
  livreur_longitude numeric(10,7),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Deliveries
create table public.deliveries (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders not null,
  livreur_id uuid references public.users,
  statut text check (statut in (
    'disponible','acceptée','collectée','livrée','échouée'
  )) default 'disponible',
  otp_collecte text,
  otp_collecte_confirme boolean default false,
  otp_livraison text,
  otp_livraison_confirme boolean default false,
  created_at timestamptz default now()
);

-- Conversations
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.users not null,
  vendeur_id uuid references public.users not null,
  product_id uuid references public.products,
  created_at timestamptz default now(),
  unique(client_id, vendeur_id, product_id)
);

-- Messages
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations not null,
  sender_id uuid references public.users not null,
  contenu text,
  photo_url text,
  lu boolean default false,
  created_at timestamptz default now()
);

-- Reviews
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders not null unique,
  client_id uuid references public.users not null,
  vendeur_id uuid references public.users not null,
  note integer check (note between 1 and 5) not null,
  commentaire text,
  photo_url text,
  created_at timestamptz default now()
);

-- Disputes
create table public.disputes (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders not null,
  client_id uuid references public.users not null,
  motif text not null,
  statut text check (statut in ('ouvert','en_cours','résolu')) default 'ouvert',
  created_at timestamptz default now()
);

-- Activer RLS sur toutes les tables
alter table public.users enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.deliveries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;

-- Users
create policy "lecture propre" on public.users
  for select using (auth.uid() = id);
create policy "modification propre" on public.users
  for update using (auth.uid() = id);

-- Addresses
create policy "lecture propre" on public.addresses
  for all using (auth.uid() = user_id);

-- Products : lecture publique, écriture vendeur
create policy "lecture publique" on public.products
  for select using (statut = 'actif');
create policy "écriture vendeur" on public.products
  for all using (auth.uid() = vendeur_id);

-- Favorites
create policy "gestion propre" on public.favorites
  for all using (auth.uid() = user_id);

-- Orders
create policy "lecture client ou vendeur" on public.orders
  for select using (
    auth.uid() = client_id or auth.uid() = vendeur_id
  );
create policy "création client" on public.orders
  for insert with check (auth.uid() = client_id);
create policy "modification client ou vendeur" on public.orders
  for update using (
    auth.uid() = client_id or auth.uid() = vendeur_id
  );

-- Conversations
create policy "lecture participants" on public.conversations
  for select using (
    auth.uid() = client_id or auth.uid() = vendeur_id
  );
create policy "création client" on public.conversations
  for insert with check (auth.uid() = client_id);

-- Messages
create policy "lecture participants" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.client_id = auth.uid() or c.vendeur_id = auth.uid())
    )
  );
create policy "envoi participants" on public.messages
  for insert with check (auth.uid() = sender_id);
create policy "marquer lu" on public.messages
  for update using (auth.uid() = sender_id);

-- Reviews
create policy "lecture publique" on public.reviews
  for select using (true);
create policy "création client" on public.reviews
  for insert with check (auth.uid() = client_id);

-- Disputes
create policy "lecture client" on public.disputes
  for select using (auth.uid() = client_id);
create policy "création client" on public.disputes
  for insert with check (auth.uid() = client_id);

-- Deliveries : livreur et vendeur/client concernés
create policy "lecture livreur ou order" on public.deliveries
  for select using (
    auth.uid() = livreur_id or
    exists (
      select 1 from public.orders o
      where o.id = order_id
      and (o.client_id = auth.uid() or o.vendeur_id = auth.uid())
    )
  );
