create table if not exists produtos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  sku text unique not null,
  url text,
  preco_atual numeric
);

create table if not exists concorrentes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  url_base text not null
);

create table if not exists precos_coletados (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid references produtos(id),
  concorrente_id uuid references concorrentes(id),
  preco numeric,
  data_coleta timestamptz default now()
);

create table if not exists produto_concorrente_urls (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid references produtos(id),
  concorrente_id uuid references concorrentes(id),
  url_produto text not null
);

create table if not exists alertas_configuracao (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid references produtos(id) unique,
  threshold_percent numeric not null
);

create table if not exists alertas (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid references produtos(id),
  concorrente_id uuid references concorrentes(id),
  preco_concorrente numeric,
  preco_meu numeric,
  diff_percent numeric,
  threshold_percent numeric,
  mensagem text,
  lido boolean default false,
  criado_em timestamptz default now()
);
