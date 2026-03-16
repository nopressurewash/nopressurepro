-- Supabase schema foundation for No Pressure Pro phase 1
-- Business ownership: businesses.id is the workspace identifier
-- Multi-tenant readiness: every domain object carries business_id

create table if not exists profiles (
  id uuid primary key,
  email text not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_profile_id uuid references profiles(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  profile_id uuid references profiles(id) not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, profile_id)
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  suburb text,
  phone text,
  email text,
  address text,
  total_jobs int not null default 0,
  total_value numeric(12,2) not null default 0,
  client_type text not null default 'Residential',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  client_id uuid references clients(id),
  client_name text,
  suburb text,
  phone text,
  email text,
  service_type text,
  recommended numeric(12,2) not null,
  status text not null,
  scheduled_date date,
  scheduled_time text,
  notes text,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  quote_id uuid references quotes(id),
  client_name text,
  suburb text,
  phone text,
  service_type text,
  amount numeric(12,2) not null,
  status text not null,
  issue_date date not null,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists schedule_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  date_key text not null,
  note text,
  updated_at timestamptz not null default now()
  ,
  unique (business_id, date_key)
);

create table if not exists rates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  driveway numeric(12,2) not null,
  paths numeric(12,2) not null,
  patio numeric(12,2) not null,
  house_wash numeric(12,2) not null,
  roof_wash numeric(12,2) not null,
  walls_extras numeric(12,2) not null,
  unique (business_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quote_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  quote_id uuid references quotes(id) on delete cascade not null,
  category text not null,
  created_at timestamptz not null default now(),
  caption text,
  metadata jsonb
);
