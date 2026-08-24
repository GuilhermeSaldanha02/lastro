-- supabase/migrations/0012_idiomas.sql
-- Módulo de idiomas (pedido do dono, 2026-08-24): app hoje é 100% PT-BR
-- fixo no código. Dono pediu "tudo" — inglês e espanhol, sem curadoria
-- humana, "é só olhar no meaning oxford" — ou seja, terminologia padrão
-- de academia em cada idioma, não tradução literal palavra-por-palavra
-- (ver DECISIONS.md: isto reverte a posição da ADR anterior contra
-- tradução automática do catálogo, por decisão explícita do dono).
--
-- Tabela de tradução, não colunas nome_en/nome_es: um 3º idioma no
-- futuro vira uma linha, não uma migração. exercicio.nome e
-- grupo_muscular.nome continuam sendo o PT-BR — fonte única, sem
-- lookup nenhum pra quem usa o app em português.
--
-- Por que o catálogo primeiro, antes de qualquer string de UI: o
-- parecer semanal (Gemini) recebe o resumo compacto com nome de
-- exercício. Se o nome já vier traduzido no resumo, o parecer sai
-- consistente; se só instruirmos o prompt a "responder em inglês", o
-- modelo teria que inventar nome de exercício a cada chamada,
-- inconsistente entre pareceres (decisão tomada com o dono,
-- 2026-08-24). Por isso esta migração é a fundação: UI, prompt e
-- validador dependem dela, não o contrário.

create table public.exercicio_traducao (
  exercicio_id uuid not null references public.exercicio(id) on delete cascade,
  idioma text not null check (idioma in ('en', 'es')),
  nome text not null,
  primary key (exercicio_id, idioma)
);

comment on table public.exercicio_traducao is
  'Nome do exercício em inglês/espanhol, terminologia padrão de academia (não tradução literal). exercicio.nome (PT-BR) continua a fonte única para quem usa o app em português — nenhuma leitura em PT-BR passa por aqui.';

alter table public.exercicio_traducao enable row level security;

create policy exercicio_traducao_leitura
  on public.exercicio_traducao
  for select
  to authenticated
  using (true);

create table public.grupo_muscular_traducao (
  grupo_muscular_id text not null references public.grupo_muscular(id) on delete cascade,
  idioma text not null check (idioma in ('en', 'es')),
  nome text not null,
  primary key (grupo_muscular_id, idioma)
);

comment on table public.grupo_muscular_traducao is
  'Nome do grupo muscular em inglês/espanhol. Mesmo raciocínio de exercicio_traducao.';

alter table public.grupo_muscular_traducao enable row level security;

create policy grupo_muscular_traducao_leitura
  on public.grupo_muscular_traducao
  for select
  to authenticated
  using (true);

-- Preferência de idioma da pessoa, mesmo raciocínio da 0009
-- (meta_treinos_semana): NULL é o estado honesto de "ainda não
-- escolheu" — sem default 'pt-BR' cravado que ninguém decidiu. Vive em
-- public.usuario e é lido no servidor (não localStorage, como o tema)
-- porque o catálogo e o parecer são resolvidos no servidor antes de
-- qualquer render.
alter table public.usuario
  add column idioma text
    constraint idioma_valido check (
      idioma is null or idioma in ('pt-BR', 'en', 'es')
    );

-- Tradução dos 10 grupos musculares.
insert into public.grupo_muscular_traducao (grupo_muscular_id, idioma, nome) values
  ('abdomen', 'en', 'Abs'),
  ('abdomen', 'es', 'Abdomen'),
  ('biceps', 'en', 'Biceps'),
  ('biceps', 'es', 'Bíceps'),
  ('costas', 'en', 'Back'),
  ('costas', 'es', 'Espalda'),
  ('gluteo', 'en', 'Glutes'),
  ('gluteo', 'es', 'Glúteos'),
  ('ombro', 'en', 'Shoulders'),
  ('ombro', 'es', 'Hombro'),
  ('panturrilha', 'en', 'Calves'),
  ('panturrilha', 'es', 'Pantorrilla'),
  ('peito', 'en', 'Chest'),
  ('peito', 'es', 'Pecho'),
  ('posterior_coxa', 'en', 'Hamstrings'),
  ('posterior_coxa', 'es', 'Isquiotibiales'),
  ('quadriceps', 'en', 'Quadriceps'),
  ('quadriceps', 'es', 'Cuádriceps'),
  ('triceps', 'en', 'Triceps'),
  ('triceps', 'es', 'Tríceps');

-- Tradução dos 102 exercícios do catálogo (2026-08-24). Terminologia
-- padrão de academia em cada idioma — ex.: "Levantamento terra" vira
-- "Deadlift" (não "Earth Lift"), "Rosca direta" vira "Barbell Curl"
-- (não "Direct Thread").
insert into public.exercicio_traducao (exercicio_id, idioma, nome) values
  ('d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b', 'en', 'Lower Ab Crunch'),
  ('d08f9e23-09cd-40c5-a56c-f2a7cb9ac73b', 'es', 'Abdominal inferior'),
  ('6fb49df0-a2f5-4865-9d7f-342cc2f67f17', 'en', 'Machine Crunch'),
  ('6fb49df0-a2f5-4865-9d7f-342cc2f67f17', 'es', 'Abdominal en máquina'),
  ('97778ea6-fd70-46aa-95d9-ada174993433', 'en', 'Cable Crunch'),
  ('97778ea6-fd70-46aa-95d9-ada174993433', 'es', 'Abdominal en polea'),
  ('1953ad1b-671c-47f2-8cef-40055037cb32', 'en', 'Bicycle Crunch'),
  ('1953ad1b-671c-47f2-8cef-40055037cb32', 'es', 'Abdominal bicicleta (oblicuos)'),
  ('2e63f78d-f145-4015-a5d8-84c753e0670a', 'en', 'Upper Ab Crunch'),
  ('2e63f78d-f145-4015-a5d8-84c753e0670a', 'es', 'Abdominal superior'),
  ('4968787c-701a-45d5-b226-d1ee8834ebb8', 'en', 'Dumbbell Lunge'),
  ('4968787c-701a-45d5-b226-d1ee8834ebb8', 'es', 'Zancada con mancuernas'),
  ('61b99b77-5085-489a-8ee9-18452c4ed9f2', 'en', 'Bulgarian Split Squat'),
  ('61b99b77-5085-489a-8ee9-18452c4ed9f2', 'es', 'Sentadilla búlgara'),
  ('18bf7a23-2410-4905-b646-e152625c6136', 'en', 'Belt Squat'),
  ('18bf7a23-2410-4905-b646-e152625c6136', 'es', 'Sentadilla con cinturón (belt squat)'),
  ('ab098c28-ac32-4be2-8837-9fb05faf3888', 'en', 'Front Squat'),
  ('ab098c28-ac32-4be2-8837-9fb05faf3888', 'es', 'Sentadilla frontal'),
  ('1db2c316-4c25-4f71-b2f4-6c30ceb75259', 'en', 'Back Squat'),
  ('1db2c316-4c25-4f71-b2f4-6c30ceb75259', 'es', 'Sentadilla libre'),
  ('c5a978dc-cbf2-4b62-bfbf-b2aeb6cafece', 'en', 'Smith Machine Squat'),
  ('c5a978dc-cbf2-4b62-bfbf-b2aeb6cafece', 'es', 'Sentadilla en máquina Smith'),
  ('d2be1b21-dc02-4586-979d-e2fbb6b3010e', 'en', 'Dumbbell Sumo Squat'),
  ('d2be1b21-dc02-4586-979d-e2fbb6b3010e', 'es', 'Sentadilla sumo con mancuerna'),
  ('b8b73c8e-066c-4a4d-ae29-2b1ae21331c5', 'en', 'Arnold Press'),
  ('b8b73c8e-066c-4a4d-ae29-2b1ae21331c5', 'es', 'Press Arnold'),
  ('36bb6cc1-0315-462d-944d-fdadd20d2e09', 'en', 'Pull-Up'),
  ('36bb6cc1-0315-462d-944d-fdadd20d2e09', 'es', 'Dominadas'),
  ('3698a49e-4b51-4d00-8222-986f44afd191', 'en', 'Barbell Good Morning'),
  ('3698a49e-4b51-4d00-8222-986f44afd191', 'es', 'Buenos días con barra (good morning)'),
  ('e2f6ae67-b7b9-46ed-833a-5053f5a5d6ee', 'en', 'Hip Abductor Machine'),
  ('e2f6ae67-b7b9-46ed-833a-5053f5a5d6ee', 'es', 'Máquina abductora de cadera'),
  ('edeb574d-ecf7-48d0-8cf0-c69c771b3708', 'en', 'Hip Adductor Machine'),
  ('edeb574d-ecf7-48d0-8cf0-c69c771b3708', 'es', 'Máquina aductora de cadera'),
  ('4d125765-74b7-4171-bb0f-f0b8fbae5aee', 'en', 'Machine Hip Thrust'),
  ('4d125765-74b7-4171-bb0f-f0b8fbae5aee', 'es', 'Hip thrust en máquina'),
  ('2193c8f0-877b-408e-89f5-777d38a08b19', 'en', 'Leg Extension'),
  ('2193c8f0-877b-408e-89f5-777d38a08b19', 'es', 'Extensión de piernas'),
  ('8da6b2fc-4d68-40e7-96d1-65a525527463', 'en', 'Seated Leg Curl'),
  ('8da6b2fc-4d68-40e7-96d1-65a525527463', 'es', 'Curl femoral sentado'),
  ('0e3dbd0b-bfb1-4359-8e86-647847b12100', 'en', 'Single-Leg Seated Leg Curl'),
  ('0e3dbd0b-bfb1-4359-8e86-647847b12100', 'es', 'Curl femoral sentado unilateral'),
  ('54e723c0-df3d-4bb9-a950-a59f0e5481a2', 'en', 'Cable Kickback'),
  ('54e723c0-df3d-4bb9-a950-a59f0e5481a2', 'es', 'Patada de glúteo en polea'),
  ('38ec491c-5d77-47d6-b324-48dae887f06f', 'en', 'Cable Crossover'),
  ('38ec491c-5d77-47d6-b324-48dae887f06f', 'es', 'Cruce de poleas'),
  ('c7e6d68c-144a-4137-9bb0-0eebb3f00587', 'en', 'Incline Dumbbell Fly'),
  ('c7e6d68c-144a-4137-9bb0-0eebb3f00587', 'es', 'Aperturas inclinadas con mancuernas'),
  ('d5cf25c0-8d09-4ff8-8c98-bdfca89811ce', 'en', 'Reverse Fly'),
  ('d5cf25c0-8d09-4ff8-8c98-bdfca89811ce', 'es', 'Aperturas invertidas'),
  ('d6ebe533-c67b-4c0c-a222-29513cd011cf', 'en', 'Flat Dumbbell Fly'),
  ('d6ebe533-c67b-4c0c-a222-29513cd011cf', 'es', 'Aperturas planas con mancuernas'),
  ('2220953e-8fff-49e0-afdf-2b2d510336c2', 'en', 'Dumbbell Shoulder Press'),
  ('2220953e-8fff-49e0-afdf-2b2d510336c2', 'es', 'Press de hombro con mancuernas'),
  ('8647dbab-a45a-4b00-bf61-965d2096b6ec', 'en', 'Machine Shoulder Press'),
  ('8647dbab-a45a-4b00-bf61-965d2096b6ec', 'es', 'Press de hombro en máquina'),
  ('71c5a306-acad-4c55-8609-b8947d00ab28', 'en', 'Barbell Military Press'),
  ('71c5a306-acad-4c55-8609-b8947d00ab28', 'es', 'Press militar con barra'),
  ('256ee63f-4348-4a8f-99ee-a6faa2472750', 'en', 'Leg Raise'),
  ('256ee63f-4348-4a8f-99ee-a6faa2472750', 'es', 'Elevación de piernas'),
  ('a25b4dc2-563f-439b-897e-c3facf5c600e', 'en', 'Dumbbell Front Raise'),
  ('a25b4dc2-563f-439b-897e-c3facf5c600e', 'es', 'Elevación frontal con mancuernas'),
  ('ff8a4f89-15e6-4c97-85cc-90cd5c15d03f', 'en', 'Dumbbell Lateral Raise'),
  ('ff8a4f89-15e6-4c97-85cc-90cd5c15d03f', 'es', 'Elevación lateral con mancuernas'),
  ('f806164a-38a2-4e98-b8f9-b6487685f234', 'en', 'Machine Lateral Raise'),
  ('f806164a-38a2-4e98-b8f9-b6487685f234', 'es', 'Elevación lateral en máquina'),
  ('aeb20b7e-7928-4ea9-9ab3-0695e5d84183', 'en', 'Barbell Hip Thrust'),
  ('aeb20b7e-7928-4ea9-9ab3-0695e5d84183', 'es', 'Hip thrust con barra'),
  ('203ffb85-feef-4a36-8f4c-2dc3dbad88c9', 'en', 'Single-Leg Hip Thrust'),
  ('203ffb85-feef-4a36-8f4c-2dc3dbad88c9', 'es', 'Hip thrust unilateral'),
  ('6a0bf165-1172-4de4-8167-875290c3fb99', 'en', 'Dumbbell Shrug'),
  ('6a0bf165-1172-4de4-8167-875290c3fb99', 'es', 'Encogimiento con mancuernas'),
  ('960fe5e9-f480-48bd-bbe1-dbeaee22ca1c', 'en', 'Machine Shrug'),
  ('960fe5e9-f480-48bd-bbe1-dbeaee22ca1c', 'es', 'Encogimiento en máquina'),
  ('a57e020d-7afc-41c4-b372-6066386848c1', 'en', 'Cable Hip Extension'),
  ('a57e020d-7afc-41c4-b372-6066386848c1', 'es', 'Extensión de cadera en polea'),
  ('d902793c-9a6e-418c-a7b7-956771eaa0a0', 'en', 'Single-Arm Overhead Cable Triceps Extension'),
  ('d902793c-9a6e-418c-a7b7-956771eaa0a0', 'es', 'Extensión de tríceps unilateral en polea alta'),
  ('2f4874ac-e461-4916-89b2-07380a817ae1', 'en', 'Machine Back Extension'),
  ('2f4874ac-e461-4916-89b2-07380a817ae1', 'es', 'Extensión lumbar en máquina'),
  ('c80d5e23-d24b-464e-a4e0-4b1450b480b6', 'en', 'Cable Face Pull'),
  ('c80d5e23-d24b-464e-a4e0-4b1450b480b6', 'es', 'Face pull en polea'),
  ('2f09b9a4-46dc-4c6c-9333-14224c5ee431', 'en', 'Push-Up'),
  ('2f09b9a4-46dc-4c6c-9333-14224c5ee431', 'es', 'Flexiones de brazos'),
  ('79efba5d-33a4-470d-a526-41f7383c1c83', 'en', 'Single-Leg Cable Curl'),
  ('79efba5d-33a4-470d-a526-41f7383c1c83', 'es', 'Curl femoral unilateral en polea'),
  ('c7a31b7d-1f7d-4b1c-a2cb-b89fe1d19446', 'en', 'Hack Squat'),
  ('c7a31b7d-1f7d-4b1c-a2cb-b89fe1d19446', 'es', 'Sentadilla hack'),
  ('c59fc8a9-8fdf-494e-a418-e10f356d7656', 'en', '45° Leg Press'),
  ('c59fc8a9-8fdf-494e-a418-e10f356d7656', 'es', 'Prensa de piernas 45°'),
  ('3fdbf48a-5310-4373-9e95-8dfa1e912955', 'en', 'Horizontal Leg Press'),
  ('3fdbf48a-5310-4373-9e95-8dfa1e912955', 'es', 'Prensa de piernas horizontal'),
  ('54030c65-0b66-4995-af4e-5d968ac0cbb8', 'en', 'Single-Leg Press'),
  ('54030c65-0b66-4995-af4e-5d968ac0cbb8', 'es', 'Prensa de piernas unilateral'),
  ('4450b391-ffe0-4c1e-bec8-4176536c04bb', 'en', 'Deadlift'),
  ('4450b391-ffe0-4c1e-bec8-4176536c04bb', 'es', 'Peso muerto'),
  ('f98c766c-4631-4d12-9064-3145525336a3', 'en', 'Dumbbell Romanian Deadlift'),
  ('f98c766c-4631-4d12-9064-3145525336a3', 'es', 'Peso muerto rumano con mancuernas'),
  ('ac1b9b26-a4bd-407e-bf37-57517b0c3cb9', 'en', 'Bench Dip'),
  ('ac1b9b26-a4bd-407e-bf37-57517b0c3cb9', 'es', 'Fondos en banco'),
  ('5bafb2e4-1b95-4987-bb67-a4d413c82cf4', 'en', 'Lying Leg Curl'),
  ('5bafb2e4-1b95-4987-bb67-a4d413c82cf4', 'es', 'Curl femoral tumbado'),
  ('fd8bff1e-1306-4dec-8a62-dd1a6dc31058', 'en', 'Donkey Calf Raise'),
  ('fd8bff1e-1306-4dec-8a62-dd1a6dc31058', 'es', 'Elevación de talones burrito (donkey calf raise)'),
  ('e455709a-9ff8-47c1-8040-3cfff3860180', 'en', 'Standing Calf Raise'),
  ('e455709a-9ff8-47c1-8040-3cfff3860180', 'es', 'Elevación de talones de pie'),
  ('021e4c30-b247-424d-ac49-5c7939c3cad7', 'en', 'Calf Raise on Leg Press'),
  ('021e4c30-b247-424d-ac49-5c7939c3cad7', 'es', 'Elevación de talones en prensa'),
  ('ebc8498c-20c4-427e-b6d6-b778c0b545d0', 'en', 'Seated Calf Raise'),
  ('ebc8498c-20c4-427e-b6d6-b778c0b545d0', 'es', 'Elevación de talones sentado'),
  ('d4411272-aaa7-4a56-97e9-58cde19d65ad', 'en', 'Single-Leg Dumbbell Calf Raise'),
  ('d4411272-aaa7-4a56-97e9-58cde19d65ad', 'es', 'Elevación de talones unilateral con mancuerna'),
  ('e9d96eea-745d-4b4b-a00c-44227f1b2f60', 'en', 'Dips'),
  ('e9d96eea-745d-4b4b-a00c-44227f1b2f60', 'es', 'Fondos en paralelas'),
  ('6c6196c2-f34f-40a5-ba1c-44d53ea5c17c', 'en', 'Step-Up'),
  ('6c6196c2-f34f-40a5-ba1c-44d53ea5c17c', 'es', 'Step-up (subida al cajón)'),
  ('7dca79cf-beac-497d-94a0-a5c15b94f45c', 'en', 'Pec Deck'),
  ('7dca79cf-beac-497d-94a0-a5c15b94f45c', 'es', 'Peck deck (contractora)'),
  ('068a8275-2484-485e-911b-5ca21de4bb3c', 'en', 'Glute Bridge'),
  ('068a8275-2484-485e-911b-5ca21de4bb3c', 'es', 'Puente de glúteo'),
  ('c2cd8199-e5ea-4928-8703-659ff37ebedb', 'en', 'Plank'),
  ('c2cd8199-e5ea-4928-8703-659ff37ebedb', 'es', 'Plancha'),
  ('1fd198de-8af3-4bd5-845d-130a6a19f7aa', 'en', 'Side Plank'),
  ('1fd198de-8af3-4bd5-845d-130a6a19f7aa', 'es', 'Plancha lateral'),
  ('da5cbe01-2fee-410f-b3a2-823318537a04', 'en', 'Dumbbell Pullover'),
  ('da5cbe01-2fee-410f-b3a2-823318537a04', 'es', 'Pullover con mancuerna'),
  ('0f4d2b26-f2eb-4e16-b9e8-48d1d737590d', 'en', 'Lat Pulldown'),
  ('0f4d2b26-f2eb-4e16-b9e8-48d1d737590d', 'es', 'Jalón al pecho en polea'),
  ('7a4402da-f39a-4a75-ad03-f2ef9775ac7e', 'en', 'Wide-Grip Pulldown'),
  ('7a4402da-f39a-4a75-ad03-f2ef9775ac7e', 'es', 'Jalón con agarre abierto'),
  ('267c6648-e80e-4d90-ad8c-abfb7c5fabf0', 'en', 'Underhand-Grip Pulldown'),
  ('267c6648-e80e-4d90-ad8c-abfb7c5fabf0', 'es', 'Jalón con agarre supino'),
  ('964bf20c-48bf-49c7-8bec-070079768d00', 'en', 'Machine Lat Pulldown (Articulated)'),
  ('964bf20c-48bf-49c7-8bec-070079768d00', 'es', 'Jalón articulado en máquina'),
  ('d4e52f27-d643-406d-8850-56e6cd457f24', 'en', 'Barbell Upright Row'),
  ('d4e52f27-d643-406d-8850-56e6cd457f24', 'es', 'Remo al mentón con barra'),
  ('38f23b62-e6a9-4826-a7ff-293427607b45', 'en', 'Seated Cable Row'),
  ('38f23b62-e6a9-4826-a7ff-293427607b45', 'es', 'Remo bajo en polea'),
  ('83a0faee-9b3d-4920-8bc6-8621127fba60', 'en', 'T-Bar Row'),
  ('83a0faee-9b3d-4920-8bc6-8621127fba60', 'es', 'Remo en barra T'),
  ('00b173f0-17e1-4c57-8429-7d7cb876ded0', 'en', 'Bent-Over Barbell Row'),
  ('00b173f0-17e1-4c57-8429-7d7cb876ded0', 'es', 'Remo con barra inclinado'),
  ('8da3b406-5e31-47b7-993d-d3c478d45a23', 'en', 'Machine Row'),
  ('8da3b406-5e31-47b7-993d-d3c478d45a23', 'es', 'Remo en máquina'),
  ('7b3d2f7d-e646-40ae-9b0a-1b3fa2bce1bb', 'en', 'Chest-Supported Machine Row'),
  ('7b3d2f7d-e646-40ae-9b0a-1b3fa2bce1bb', 'es', 'Remo en máquina con apoyo pectoral'),
  ('518c8216-bfc7-4c68-a708-1f5c9e178326', 'en', 'Single-Arm Dumbbell Row'),
  ('518c8216-bfc7-4c68-a708-1f5c9e178326', 'es', 'Remo unilateral con mancuerna'),
  ('47ad084e-e614-4948-9fb2-91a3aa476af3', 'en', 'Alternating Dumbbell Curl'),
  ('47ad084e-e614-4948-9fb2-91a3aa476af3', 'es', 'Curl alternado con mancuernas'),
  ('255d734f-e5e4-4a2d-83c7-280fd1166c9d', 'en', 'Concentration Curl'),
  ('255d734f-e5e4-4a2d-83c7-280fd1166c9d', 'es', 'Curl concentrado'),
  ('39c48554-3192-4072-a877-f8259e737d29', 'en', 'Barbell Curl'),
  ('39c48554-3192-4072-a877-f8259e737d29', 'es', 'Curl con barra'),
  ('32b0855f-a34f-4134-9a86-3f89a045beb2', 'en', 'Reverse-Grip Barbell Curl'),
  ('32b0855f-a34f-4134-9a86-3f89a045beb2', 'es', 'Curl invertido con barra'),
  ('10594042-7f90-42f0-a8aa-22142b737944', 'en', 'Machine Curl'),
  ('10594042-7f90-42f0-a8aa-22142b737944', 'es', 'Curl en máquina'),
  ('ab6bcbd8-97b1-4a50-ad5a-6732ad54ee25', 'en', 'Hammer Curl'),
  ('ab6bcbd8-97b1-4a50-ad5a-6732ad54ee25', 'es', 'Curl martillo'),
  ('27939fac-14b9-4e90-809d-dd3ee62c0613', 'en', 'Cable Curl'),
  ('27939fac-14b9-4e90-809d-dd3ee62c0613', 'es', 'Curl en polea'),
  ('620bd50a-ad67-4029-8a00-34cf40200698', 'en', 'Preacher Curl'),
  ('620bd50a-ad67-4029-8a00-34cf40200698', 'es', 'Curl Scott (predicador)'),
  ('9a21b5de-0de3-4e3d-a36c-ef094e5f9d34', 'en', 'Spider Curl'),
  ('9a21b5de-0de3-4e3d-a36c-ef094e5f9d34', 'es', 'Curl araña (spider curl)'),
  ('b33347e8-056c-4f15-8a3a-bd00bf7852e6', 'en', 'Machine Torso Rotation'),
  ('b33347e8-056c-4f15-8a3a-bd00bf7852e6', 'es', 'Rotación de tronco en máquina'),
  ('a150a4c3-3baf-4856-975a-b7fe8e3397f5', 'en', 'Cable Torso Rotation'),
  ('a150a4c3-3baf-4856-975a-b7fe8e3397f5', 'es', 'Rotación de tronco en polea'),
  ('271cdb53-55e6-450e-ae1c-aa7ab99550d9', 'en', 'Barbell Stiff-Leg Deadlift'),
  ('271cdb53-55e6-450e-ae1c-aa7ab99550d9', 'es', 'Peso muerto rígido con barra'),
  ('65a08759-42c9-49ae-bbbe-dee88006bcad', 'en', 'Decline Barbell Bench Press'),
  ('65a08759-42c9-49ae-bbbe-dee88006bcad', 'es', 'Press de banca declinado con barra'),
  ('c914e17f-dfb2-4add-a946-842ca5d68edc', 'en', 'Decline Dumbbell Bench Press'),
  ('c914e17f-dfb2-4add-a946-842ca5d68edc', 'es', 'Press de banca declinado con mancuernas'),
  ('229427b2-09e8-456c-862f-b2d2fe76d76b', 'en', 'Decline Machine Bench Press'),
  ('229427b2-09e8-456c-862f-b2d2fe76d76b', 'es', 'Press de banca declinado en máquina'),
  ('d9e55da6-25ef-43a3-aa11-3eee9d1481cf', 'en', 'Close-Grip Bench Press'),
  ('d9e55da6-25ef-43a3-aa11-3eee9d1481cf', 'es', 'Press de banca con agarre cerrado'),
  ('f116e33e-4305-4c50-ac45-ee38c88d243f', 'en', 'Incline Barbell Bench Press'),
  ('f116e33e-4305-4c50-ac45-ee38c88d243f', 'es', 'Press de banca inclinado con barra'),
  ('f557f83e-22a8-46e6-bc4f-05de0ec71bbe', 'en', 'Incline Dumbbell Bench Press'),
  ('f557f83e-22a8-46e6-bc4f-05de0ec71bbe', 'es', 'Press de banca inclinado con mancuernas'),
  ('404f2294-cb02-4305-9789-303bda7e11bd', 'en', 'Incline Machine Bench Press'),
  ('404f2294-cb02-4305-9789-303bda7e11bd', 'es', 'Press de banca inclinado en máquina'),
  ('e839d170-8262-430d-b1d2-268309c7d418', 'en', 'Machine Bench Press'),
  ('e839d170-8262-430d-b1d2-268309c7d418', 'es', 'Press de banca en máquina'),
  ('339a305e-4c52-4744-86c5-6b830b707032', 'en', 'Barbell Bench Press'),
  ('339a305e-4c52-4744-86c5-6b830b707032', 'es', 'Press de banca con barra'),
  ('b0e8350d-0c06-4982-b3da-6f63569aab71', 'en', 'Dumbbell Bench Press'),
  ('b0e8350d-0c06-4982-b3da-6f63569aab71', 'es', 'Press de banca con mancuernas'),
  ('148801b9-dc8e-47d5-9198-4cd8aec022e7', 'en', 'Flat Machine Bench Press'),
  ('148801b9-dc8e-47d5-9198-4cd8aec022e7', 'es', 'Press de banca plano en máquina'),
  ('60f66f23-8938-4c64-8fc4-bb132788e263', 'en', 'Dumbbell Triceps Kickback'),
  ('60f66f23-8938-4c64-8fc4-bb132788e263', 'es', 'Patada de tríceps con mancuerna'),
  ('2ab88592-0522-4375-a5bd-49b3c66c32ca', 'en', 'Dumbbell French Press'),
  ('2ab88592-0522-4375-a5bd-49b3c66c32ca', 'es', 'Press francés con mancuerna'),
  ('5399465a-2a4c-47a3-aaf1-c6fd806dfbb8', 'en', 'Machine Triceps Extension'),
  ('5399465a-2a4c-47a3-aaf1-c6fd806dfbb8', 'es', 'Extensión de tríceps en máquina'),
  ('05d30e37-7b2c-45f4-9e71-34abf1703ef3', 'en', 'Triceps Rope Pushdown'),
  ('05d30e37-7b2c-45f4-9e71-34abf1703ef3', 'es', 'Extensión de tríceps en polea (cuerda)'),
  ('963a1f70-4cb6-4117-b1a6-c1e4215debe9', 'en', 'Barbell Skull Crusher'),
  ('963a1f70-4cb6-4117-b1a6-c1e4215debe9', 'es', 'Press francés con barra (skull crusher)');
