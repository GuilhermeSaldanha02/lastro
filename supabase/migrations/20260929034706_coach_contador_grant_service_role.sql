-- lastro · AN-08 F0-CUSTO — o e2e (j34) lê o contador com o cliente admin
-- para provar que a resposta local contou. A service_role deste projeto não
-- tem GRANT em tabela nenhuma do PostgREST (regra 22 do PROGRESS); só leitura.
grant select on public.coach_contador_diario to service_role;
