#!/usr/bin/env bash
# lastro · Helper para o agente qa-treino (.claude/agents/qa-treino.md).
#
# Resolve a mecânica chata (criar usuário de teste, autenticar, montar o
# cookie no formato exato que @supabase/ssr espera, chamar a API real) para
# que cada persona simulada gaste o esforço dela julgando o parecer, não
# reverse-engineering autenticação. Mesma técnica já usada e verificada nas
# tarefas 1.2/1.4/1.5 — só empacotada para reuso.
#
# Requer: SUPABASE_URL e SUPABASE_ANON_KEY no ambiente (ou os defaults
# abaixo, que são valores públicos — a chave é publishable, protegida por
# RLS, segura para viver neste script).
#
# Uso:
#   ./qa-treino-helper.sh criar-usuario <email> <senha>          -> imprime o UUID
#   ./qa-treino-helper.sh logar <email> <senha>                  -> imprime a linha "Cookie: ..." pronta para curl
#   ./qa-treino-helper.sh perguntar <cookie_header> <1-5>        -> chama /api/analise, imprime o JSON da resposta
#   ./qa-treino-helper.sh limpar-usuario <email>                 -> apaga o usuário e confirma cascade = 0

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://tbkzcqfvafznxallyfqk.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-sb_publishable_U4JaHg8vmc-FMFCb5EQYSw_epruvwS7}"
SUPABASE_PROJECT_REF="tbkzcqfvafznxallyfqk"
APP_URL="${APP_URL:-http://localhost:3000}"

comando="${1:-}"

case "$comando" in

criar-usuario)
  email="$2"
  senha="$3"
  sql=$(mktemp)
  cat > "$sql" <<EOF
with novo_usuario as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
    'authenticated', 'authenticated', '$email',
    crypt('$senha', gen_salt('bf')), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  )
  returning id, email
)
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from novo_usuario
returning user_id;
EOF
  resultado=$(npx supabase db query --linked -f "$sql")
  rm -f "$sql"
  echo "$resultado" | grep -o '"user_id": *"[^"]*"' | head -1 | sed 's/.*"\([0-9a-f-]*\)"$/\1/'
  ;;

logar)
  email="$2"
  senha="$3"
  resposta=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "Content-Type: application/json" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -d "{\"email\":\"$email\",\"password\":\"$senha\"}")

  access_token=$(echo "$resposta" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).access_token")
  refresh_token=$(echo "$resposta" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).refresh_token")
  expires_in=$(echo "$resposta" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).expires_in")
  expires_at=$(echo "$resposta" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).expires_at")
  token_type=$(echo "$resposta" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token_type")
  user_json=$(echo "$resposta" | node -pe "JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf8')).user)")

  if [ "$access_token" = "undefined" ] || [ -z "$access_token" ]; then
    echo "ERRO: login falhou. Resposta: $resposta" >&2
    exit 1
  fi

  # Formato exato que @supabase/ssr espera no cookie: o objeto Session
  # inteiro, JSON, base64, prefixado com "base64-".
  session_json=$(node -e "
    const u = $user_json;
    const sess = {
      access_token: '$access_token',
      token_type: '$token_type',
      expires_in: $expires_in,
      expires_at: $expires_at,
      refresh_token: '$refresh_token',
      user: u
    };
    console.log(JSON.stringify(sess));
  ")
  cookie_valor="base64-$(echo -n "$session_json" | base64 -w0)"
  echo "Cookie: sb-${SUPABASE_PROJECT_REF}-auth-token=${cookie_valor}"
  ;;

perguntar)
  cookie_header="$2"
  pergunta="$3"
  curl -s -X POST "$APP_URL/api/analise" \
    -H "Content-Type: application/json" \
    -H "$cookie_header" \
    -d "{\"pergunta\":$pergunta}"
  ;;

limpar-usuario)
  email="$2"
  sql=$(mktemp)
  cat > "$sql" <<EOF
delete from auth.users where email = '$email';
select 'removido' as resultado;
EOF
  npx supabase db query --linked -f "$sql"
  rm -f "$sql"

  sql2=$(mktemp)
  echo "select count(*) as sobrou from auth.users where email = '$email';" > "$sql2"
  npx supabase db query --linked -f "$sql2"
  rm -f "$sql2"
  ;;

*)
  echo "Uso: $0 {criar-usuario|logar|perguntar|limpar-usuario} ..." >&2
  exit 1
  ;;
esac
