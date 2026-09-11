-- ============================================================
-- lastro · migração 0022 — o vínculo aluno↔personal, e a fila de alertas
-- Fonte: PRD.md §11 (revisada em 2026-09-10 pelas entrevistas) ·
-- DECISIONS.md "2026-09-10 (6)" e "(8)" · "2026-09-11 (1)" (esta).
--
-- É A PRIMEIRA VEZ que uma conta lê dado de outra neste banco. A FF5
-- ("isolamento total por auth.uid()") deixa de ser literal aqui, e por
-- isso cada policy abaixo está comentada: a próxima pessoa que mexer
-- nisto precisa saber o que é deliberado e o que seria furo.
-- ============================================================

-- ============================================================
-- 1. O telefone mora no ALUNO, não no vínculo
-- ============================================================
-- A §11.7 escreveu "o número vem do aluno, com consentimento, e SOME
-- quando ele revoga", assumindo o número guardado na concessão. O dono
-- decidiu diferente em 2026-09-11: o contato é obrigatório no cadastro,
-- para TODA conta, com ou sem personal.
--
-- O que "some na revogação" passa a significar: o ACESSO do personal ao
-- número desaparece (a policy `usuario_visivel_ao_personal` abaixo exige
-- vínculo aceito), não o número. Apagar o telefone do aluno porque ele
-- demitiu o personal seria apagar dado do próprio aluno. A garantia de
-- consentimento continua por construção — só que pela RLS, não pelo
-- delete.
--
-- NULLABLE, e isto não é descuido. `not null` aqui quebraria a criação
-- de conta: o login com Google não entrega telefone, e o trigger
-- `usuario_cria_perfil` (0004) roda DENTRO do insert em auth.users —
-- exceção ali aborta o signup inteiro, como o comentário da 0004 já
-- avisa. A obrigatoriedade é do app (cadastro por e-mail, Ajustes, e o
-- aceite do convite), não do banco.
alter table public.usuario add column telefone_whatsapp text;

-- E.164 SEM o `+`, só dígitos — exatamente o formato que o link `wa.me`
-- exige. Normalizar na escrita (e não na leitura) é o que impede um
-- número pontuado de virar link quebrado: o WhatsApp falha em SILÊNCIO
-- com número malformado, abre a tela e não acha ninguém.
-- 10 dígitos é o mínimo plausível com código de país; 15 é o máximo da
-- própria E.164.
alter table public.usuario
  add constraint usuario_telefone_e164_sem_mais
  check (telefone_whatsapp is null or telefone_whatsapp ~ '^[1-9][0-9]{9,14}$');

comment on column public.usuario.telefone_whatsapp is
  'E.164 sem o +, só dígitos. Usado EXCLUSIVAMENTE para compor o link wa.me que o personal abre (PRD §11.7). O app nunca envia nada para este número — quem aperta enviar é a pessoa.';

-- ============================================================
-- 1b. O trigger de perfil passa a carregar o telefone do cadastro
-- ============================================================
-- O dono decidiu que contato é obrigatório no cadastro zero, então o
-- número chega em `options.data` do `signUp` (vira `raw_user_meta_data`) e
-- precisa pousar no perfil no mesmo instante em que a conta nasce.
--
-- A VALIDAÇÃO DENTRO DO TRIGGER É O PONTO DELICADO desta migração. A
-- coluna tem check constraint; se o metadado vier malformado, a exceção
-- sobe DENTRO do insert em `auth.users` e aborta a criação da conta
-- inteira — não só o perfil. O comentário da 0004 já avisava disso sobre
-- o nome, e o telefone é pior, porque ele vem de campo digitado à mão.
-- Por isso: bate o regex, ou entra NULL. Nunca lança.
--
-- Recriado com `create or replace` mantendo o corpo original do nome —
-- não há duas definições concorrentes desta função.
create or replace function public.usuario_cria_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_telefone text := nullif(new.raw_user_meta_data ->> 'telefone_whatsapp', '');
begin
  if v_telefone is not null and v_telefone !~ '^[1-9][0-9]{9,14}$' then
    v_telefone := null;
  end if;

  insert into public.usuario (id, nome, telefone_whatsapp)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'nome',
      split_part(new.email, '@', 1)
    ),
    v_telefone
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ============================================================
-- 2. vinculo_personal — a concessão, revogável e auditável
-- ============================================================
-- §11.4.3: o personal CONVIDA, o aluno ACEITA, o aluno REVOGA. Nunca por
-- ação unilateral do personal — é por isso que não existe uma única
-- policy aqui que deixe o personal escrever `estado = 'aceito'`.
create table public.vinculo_personal (
  id           uuid primary key default gen_random_uuid(),
  personal_id  uuid not null references auth.users(id) on delete cascade,
  -- NULL enquanto o convite é só um convite. Um convite pendente não
  -- aponta para ninguém, de propósito: digitar o e-mail (ou o id) de
  -- alguém não pode criar relação com essa pessoa.
  aluno_id     uuid references auth.users(id) on delete cascade,
  codigo       text not null unique,
  estado       text not null default 'pendente',
  criado_em    timestamptz not null default now(),
  aceito_em    timestamptz,
  revogado_em  timestamptz,

  constraint vinculo_estado_valido
    check (estado in ('pendente', 'aceito', 'revogado')),
  -- Pendente não tem aluno; aceito e revogado têm. Sem isto, um vínculo
  -- "aceito" sem aluno passaria pela RLS de leitura com `aluno_id is null`
  -- e a comparação viraria NULL (nem true nem false) em todo lugar.
  constraint vinculo_aluno_conforme_estado check (
    (estado = 'pendente' and aluno_id is null)
    or (estado in ('aceito', 'revogado') and aluno_id is not null)
  ),
  constraint vinculo_nao_auto
    check (aluno_id is null or aluno_id <> personal_id),
  -- Alfabeto sem caractere ambíguo (sem I, L, O, 0, 1): o código é lido
  -- em voz alta e digitado à mão. 10 caracteres de um alfabeto de 32 são
  -- 50 bits — a constraint garante a FORMA, a entropia vem de
  -- `crypto.getRandomValues` no app. Aceitável porque o código só
  -- ATRELA quem o usa: adivinhar um código alheio faz o atacante virar
  -- aluno de um personal qualquer, expondo o dado do atacante.
  constraint vinculo_codigo_formato check (codigo ~ '^[A-HJ-NP-Z2-9]{10}$')
);

-- UM personal por aluno, ao mesmo tempo. A §11.2 fala de "aluno
-- vinculado" no singular e o produto inteiro assume isso (a prescrição
-- vai para UM humano). Convite novo com vínculo aceito vivo é recusado
-- pela função de aceite, com mensagem — não em silêncio.
create unique index vinculo_aluno_um_personal
  on public.vinculo_personal (aluno_id) where estado = 'aceito';

create index vinculo_personal_estado_idx
  on public.vinculo_personal (personal_id, estado);

-- ============================================================
-- 3. Os dois helpers que a RLS de leitura cruzada usa
-- ============================================================
-- `security definer` porque a policy de `treino`/`serie`/`usuario`
-- precisa consultar `vinculo_personal`, e sem definer isso dispararia a
-- RLS de `vinculo_personal` dentro da RLS da outra tabela — recursão.
-- `stable` para o planner avaliar uma vez por statement.
create or replace function public.tem_vinculo_aceito(p_aluno uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.vinculo_personal v
    where v.aluno_id = p_aluno
      and v.personal_id = (select auth.uid())
      and v.estado = 'aceito'
  )
$$;

comment on function public.tem_vinculo_aceito(uuid) is
  'true quando quem chama é o personal com vínculo ACEITO do aluno informado. É a única porta da leitura cruzada — revogar fecha todas de uma vez.';

-- O caminho inverso: o aluno precisa ver o NOME de quem ele autorizou.
-- Mostrar "vinculado a um personal" sem dizer a quem seria pior que não
-- mostrar nada.
create or replace function public.e_meu_personal(p_personal uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.vinculo_personal v
    where v.personal_id = p_personal
      and v.aluno_id = (select auth.uid())
      and v.estado = 'aceito'
  )
$$;

-- ============================================================
-- 4. RLS do vínculo — escrita fatiada de propósito
-- ============================================================
alter table public.vinculo_personal enable row level security;

-- O personal vê os vínculos dele (pendentes, aceitos e revogados).
create policy vinculo_leitura_personal on public.vinculo_personal
  for select to authenticated using (personal_id = (select auth.uid()));

-- O aluno vê o vínculo dele.
create policy vinculo_leitura_aluno on public.vinculo_personal
  for select to authenticated using (aluno_id = (select auth.uid()));

-- Criar convite: só para si mesmo, só pendente, só sem aluno.
-- NÃO é `for all`. Um `for all` aqui deixaria o personal gravar
-- `estado = 'aceito', aluno_id = <qualquer um>` e conceder acesso a si
-- mesmo sobre os dados de quem ele quisesse — a violação exata que a
-- §11.4.3 proíbe.
create policy vinculo_convite_proprio on public.vinculo_personal
  for insert to authenticated
  with check (
    personal_id = (select auth.uid())
    and estado = 'pendente'
    and aluno_id is null
  );

-- Desistir de um convite que ninguém aceitou. Vínculo aceito não se
-- apaga: ele se revoga, e a linha fica para auditoria (§11.4.3).
create policy vinculo_apaga_convite_pendente on public.vinculo_personal
  for delete to authenticated
  using (personal_id = (select auth.uid()) and estado = 'pendente');

-- SEM policy de UPDATE, para ninguém. Aceitar e revogar são transições
-- de estado com regra, e regra em policy de update é regra que se
-- esquece: `with check` valida a linha final, não o que mudou — dava
-- para revogar e trocar o `personal_id` no mesmo statement. As duas
-- transições vivem nas funções da seção 5, que são o único caminho.
grant select, insert, delete on public.vinculo_personal to authenticated;

-- ============================================================
-- 5. Aceitar e revogar — as duas únicas transições de estado
-- ============================================================
-- `security definer` contorna a RLS por completo: TODA guarda desta
-- operação está no corpo da função, não em policy. São quatro, e cada
-- uma é a ausência de um furo:
--   a) o aluno é `auth.uid()`, NUNCA um parâmetro;
--   b) o convite tem que estar `pendente` (código já usado não reabre);
--   c) o aluno não pode ter outro personal aceito;
--   d) o telefone é obrigatório no aceite — é o que o botão do §11.7 usa.
create or replace function public.aceitar_convite_personal(
  p_codigo text,
  p_telefone_whatsapp text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := (select auth.uid());
  v_id    uuid;
begin
  if v_aluno is null then
    raise exception 'sem sessão';
  end if;

  -- Normalização do telefone é do APP (`telefone-whatsapp.ts`, função
  -- pura e testada). Aqui só se recusa o que não serve para o link.
  if p_telefone_whatsapp is null or p_telefone_whatsapp !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'telefone inválido';
  end if;

  if exists (
    select 1 from public.vinculo_personal
    where aluno_id = v_aluno and estado = 'aceito'
  ) then
    raise exception 'já existe vínculo aceito';
  end if;

  update public.vinculo_personal
     set aluno_id = v_aluno,
         estado = 'aceito',
         aceito_em = now()
   where codigo = p_codigo
     and estado = 'pendente'
     and personal_id <> v_aluno
  returning id into v_id;

  if v_id is null then
    raise exception 'código inválido';
  end if;

  update public.usuario
     set telefone_whatsapp = p_telefone_whatsapp
   where id = v_aluno;

  return v_id;
end $$;

-- Revogar é do ALUNO e de mais ninguém (§11.4.3). O personal não aparece
-- aqui de propósito: "o personal me tirou da lista" não é a operação que
-- a seção descreve, e inventá-la agora seria escopo que ninguém pediu.
create or replace function public.revogar_vinculo_personal()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := (select auth.uid());
begin
  if v_aluno is null then
    raise exception 'sem sessão';
  end if;

  update public.vinculo_personal
     set estado = 'revogado', revogado_em = now()
   where aluno_id = v_aluno and estado = 'aceito';
end $$;

revoke all on function public.aceitar_convite_personal(text, text) from public;
revoke all on function public.revogar_vinculo_personal() from public;
grant execute on function public.aceitar_convite_personal(text, text) to authenticated;
grant execute on function public.revogar_vinculo_personal() to authenticated;

-- ============================================================
-- 6. A leitura cruzada — policies SEPARADAS, nunca `or` na existente
-- ============================================================
-- As policies de 0001 (`treino_proprio`, `serie_propria`) são `for all`.
-- Enfiar a cláusula do vínculo dentro delas com `or` daria ao personal
-- INSERT, UPDATE e DELETE nas séries do aluno — em silêncio, porque
-- `for all` cobre tudo. Policy nova, `for select`, é o que mantém a
-- concessão sendo só LEITURA. As de 0001 ficam intactas.
--
-- Consequência no trigger `serie_herda_usuario` (0001): ele é SEM
-- definer exatamente para que a RLS de `treino` esconda o treino alheio
-- e o insert falhe ali. Agora que o personal ENXERGA o treino do aluno,
-- essa premissa mudou — o insert dele passa do trigger e morre no
-- `with check` de `serie_propria`. Continua barrado, um passo depois.
-- Isto só permanece verdade enquanto a concessão for SELECT-only.
create policy treino_visivel_ao_personal on public.treino
  for select to authenticated using (public.tem_vinculo_aceito(usuario_id));

create policy serie_visivel_ao_personal on public.serie
  for select to authenticated using (public.tem_vinculo_aceito(usuario_id));

-- Nome e telefone do aluno: é o que compõe a mensagem do §11.7.
create policy usuario_visivel_ao_personal on public.usuario
  for select to authenticated using (public.tem_vinculo_aceito(id));

-- E o nome do personal para o aluno que o autorizou.
create policy usuario_personal_visivel_ao_aluno on public.usuario
  for select to authenticated using (public.e_meu_personal(id));

-- ============================================================
-- 7. alerta_personal — sem esta tabela o módulo não tem medida
-- ============================================================
-- Duas razões independentes, nenhuma delas "histórico por higiene":
--
-- (a) A MEDIDA da §11.7. O que decide se o módulo funciona é "o grupo
--     muscular alertado recebeu estímulo na semana seguinte?". Sem
--     registrar QUAL grupo foi alertado, de QUAL aluno, em QUE semana,
--     essa pergunta não tem como ser respondida depois.
--
-- (b) O teto de 2 por aluno/semana NÃO impede o modo de morte que o P2
--     descreveu. Um exercício empacado há seis semanas gera os mesmos
--     dois alertas em seis segundas seguidas — "Peito: atenção" repetido
--     no eixo do TEMPO mata igual a "Peito / Bíceps / Costas / Tríceps"
--     no eixo do grupo. Supressão de repetição exige lembrar o que já
--     foi mostrado.
create table public.alerta_personal (
  id           uuid primary key default gen_random_uuid(),
  vinculo_id   uuid not null references public.vinculo_personal(id) on delete cascade,
  -- Segunda-feira ISO-8601 da semana em que o alerta foi emitido. Mesma
  -- convenção de semana do agregador (`semanas.ts`) — não inventar outra.
  semana_inicio date not null,
  tipo         text not null,
  -- Grupo muscular ou nome do exercício, conforme o tipo. É o "alvo" que
  -- a medida de (a) vai reencontrar nos treinos da semana seguinte.
  alvo         text not null,
  prioridade   smallint not null,
  criado_em    timestamptz not null default now(),
  -- §11.7: "o clique acontece dentro do lastro e é registrável". Este é
  -- o registro. NULL = o personal leu (ou não) e não agiu.
  acionado_em  timestamptz,

  -- TRÊS tipos, e a ausência de um quarto é a decisão mais importante
  -- desta tabela. "Grupo abaixo da faixa de referência" foi cortado: ele
  -- dispara para quase todo grupo de quase todo aluno toda semana, que é
  -- literalmente o modo de morte do §11.4.6. Os três que ficaram são
  -- TENDÊNCIA POR CONSTRUÇÃO — nenhum deles pode ser disparado por uma
  -- sessão ruim isolada:
  --   grupo_sem_estimulo   → 21+ dias parado (a régua de 3 semanas do P2)
  --   estagnacao_exercicio → 4+ semanas sem progresso (SEMANAS_ESTAGNACAO)
  --   queda_volume         → 3 semanas de queda contínua
  constraint alerta_tipo_valido check (tipo in (
    'grupo_sem_estimulo',
    'estagnacao_exercicio',
    'queda_volume'
  )),
  constraint alerta_prioridade_valida check (prioridade between 1 and 1000)
);

-- Idempotência da emissão: abrir a fila duas vezes na mesma segunda não
-- duplica alerta. É o que permite gravar na leitura sem medo.
create unique index alerta_unico_por_semana
  on public.alerta_personal (vinculo_id, semana_inicio, tipo, alvo);

create index alerta_vinculo_semana_idx
  on public.alerta_personal (vinculo_id, semana_inicio desc);

alter table public.alerta_personal enable row level security;

-- Só o personal do vínculo ACEITO. Revogar fecha o acesso sem apagar a
-- linha: a medida de (a) sobrevive à revogação, o acesso não.
--
-- O ALUNO não vê esta tabela, e isso é deliberado: ele não perde
-- diagnóstico nenhum (§11.2 — os sinais continuam inteiros na Análise
-- dele). Isto aqui é a fila de TRABALHO do personal, não uma segunda
-- cópia do diagnóstico.
create policy alerta_do_personal on public.alerta_personal
  for select to authenticated using (
    exists (
      select 1 from public.vinculo_personal v
      where v.id = vinculo_id
        and v.personal_id = (select auth.uid())
        and v.estado = 'aceito'
    )
  );

create policy alerta_emissao_do_personal on public.alerta_personal
  for insert to authenticated with check (
    exists (
      select 1 from public.vinculo_personal v
      where v.id = vinculo_id
        and v.personal_id = (select auth.uid())
        and v.estado = 'aceito'
    )
  );

create policy alerta_acionamento_do_personal on public.alerta_personal
  for update to authenticated using (
    exists (
      select 1 from public.vinculo_personal v
      where v.id = vinculo_id
        and v.personal_id = (select auth.uid())
        and v.estado = 'aceito'
    )
  );

-- O `with check` de um update valida a linha final, não o que mudou —
-- com a policy acima o personal poderia reescrever `tipo`/`alvo` e
-- corromper justamente a medida que esta tabela existe para permitir.
-- O trigger trava tudo menos `acionado_em`.
create or replace function public.alerta_so_aciona()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.vinculo_id is distinct from old.vinculo_id
     or new.semana_inicio is distinct from old.semana_inicio
     or new.tipo is distinct from old.tipo
     or new.alvo is distinct from old.alvo
     or new.prioridade is distinct from old.prioridade
     or new.criado_em is distinct from old.criado_em then
    raise exception 'alerta_personal: só acionado_em pode mudar';
  end if;
  return new;
end $$;

create trigger alerta_personal_so_aciona before update on public.alerta_personal
  for each row execute function public.alerta_so_aciona();

-- Sem `delete`: apagar alerta apagaria a medida. Mesma razão da 0020.
grant select, insert, update on public.alerta_personal to authenticated;
