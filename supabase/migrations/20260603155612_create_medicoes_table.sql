create table public.medicoes (
  id uuid default gen_random_uuid() primary key,
  mes text not null,
  dados jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table public.medicoes enable row level security;

-- Criar política para permitir acesso anônimo/autenticado (conforme o padrão do projeto)
create policy "Permitir leitura para todos em medicoes"
  on public.medicoes for select
  using (true);

create policy "Permitir inserção para todos em medicoes"
  on public.medicoes for insert
  with check (true);

create policy "Permitir atualização para todos em medicoes"
  on public.medicoes for update
  using (true);

create policy "Permitir deleção para todos em medicoes"
  on public.medicoes for delete
  using (true);
