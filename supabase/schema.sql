-- Tabla de participantes
create table if not exists participantes (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  picks jsonb not null,
  archivo_path text,
  creado timestamptz default now()
);

-- Tabla singleton de resultados
create table if not exists resultados (
  id int primary key default 1 check (id = 1),
  scores jsonb not null default '[]'::jsonb,
  knockout jsonb not null default '{
    "winner": "", "runnerUp": "",
    "semis": ["",""],
    "qf": ["","","",""],
    "r16": ["","","","","","","",""],
    "r32": ["","","","","","","","","","","","","","","",""]
  }'::jsonb,
  bonus jsonb not null default '{
    "goldenBoot": "", "topEspScorer": "",
    "topTeamOverride": "", "mostConcededOverride": ""
  }'::jsonb,
  bracket jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Migración: añadir bracket (cuadro de eliminatorias) si la tabla ya existe sin esa columna
alter table resultados add column if not exists bracket jsonb not null default '[]'::jsonb;

-- Insertar fila inicial si no existe
insert into resultados (id) values (1) on conflict do nothing;

-- Tabla de settings (PIN, modo España, estado de sync)
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  spain_mode text not null default 'replace',
  admin_pin_hash text not null default '',
  sync_meta jsonb not null default '{}'::jsonb
);
insert into settings (id) values (1) on conflict do nothing;

-- Migración: añadir sync_meta si ya existe la tabla sin esa columna
alter table settings add column if not exists sync_meta jsonb not null default '{}'::jsonb;

-- RLS: lectura pública en todo
alter table participantes enable row level security;
alter table resultados enable row level security;
alter table settings enable row level security;

create policy "lectura publica participantes" on participantes for select using (true);
create policy "lectura publica resultados" on resultados for select using (true);
create policy "lectura publica settings" on settings for select using (true);

-- Habilitar Realtime en resultados para actualizaciones en vivo
alter publication supabase_realtime add table resultados;

-- Bucket de Storage para archivos Excel
-- Ejecutar esto en el SQL Editor O crearlo manualmente en el dashboard:
-- insert into storage.buckets (id, name, public) values ('excels', 'excels', false);
