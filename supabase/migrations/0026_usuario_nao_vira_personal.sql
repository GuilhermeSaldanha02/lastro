-- ============================================================
-- lastro · 0026 — conta de usuário não vira personal
-- (PRD §11, emenda 2026-09-13; DECISIONS 2026-09-13 (1))
-- ============================================================
-- A 0025 abriu `ativar_area_de_trabalho` para QUALQUER conta: quem já
-- treinava informava o CREF e ganhava a fila. O dono corrigiu a regra:
--
--   · conta que nasce USUÁRIO continua usuário para sempre;
--   · os dois modos (treino / trabalho) são só de quem NASCEU personal.
--
-- Depois desta migração, o único caminho até `tipo_conta = 'personal'` é
-- o trigger de cadastro (`usuario_cria_perfil`), lendo a cápsula PERSONAL
-- do cadastro por e-mail. Update direto já estava fechado pelo GRANT de
-- coluna da 0025.
--
-- A função continua existindo porque o estado `personal` com `cref` nulo
-- continua legítimo: o trigger anula CREF fora da régua, e essa conta
-- precisa de uma porta para informar o registro. É só isso que ela faz
-- agora.
--
-- Ninguém usou o caminho aberto pela 0025: conferido em 2026-09-13, as
-- únicas contas `personal` do banco nasceram personal no cadastro.
-- ============================================================

create or replace function public.ativar_area_de_trabalho(
  p_cref text,
  p_telefone_whatsapp text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid := (select auth.uid());
  v_tipo text;
  v_cref text;
begin
  if v_id is null then
    raise exception 'sem sessão';
  end if;

  -- A regra da 0026, ANTES de qualquer validação: conta de usuário não
  -- recebe mensagem sobre CREF, porque para ela não existe CREF certo.
  select tipo_conta, cref into v_tipo, v_cref from public.usuario where id = v_id;
  if v_tipo is distinct from 'personal' then
    raise exception 'conta de usuário não vira personal';
  end if;

  if v_cref is not null then
    raise exception 'cref já informado';
  end if;

  if not public.cref_valido(p_cref) then
    raise exception 'cref inválido';
  end if;

  if p_telefone_whatsapp is null or p_telefone_whatsapp !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'telefone inválido';
  end if;

  update public.usuario
     set cref = p_cref,
         telefone_whatsapp = p_telefone_whatsapp,
         modo_ativo = 'trabalho'
   where id = v_id;
end $$;

revoke all on function public.ativar_area_de_trabalho(text, text) from public, anon;
grant execute on function public.ativar_area_de_trabalho(text, text) to authenticated;
