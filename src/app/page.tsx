// lastro · tarefa 3.x — tela de abertura de verdade, no mesmo padrão das
// outras (DESIGN.md, entrada-marca de /login).
//
// Só é alcançada por quem digita o domínio no navegador ou abre um link
// direto: o ícone instalado (PWA) abre em `/treino` — ver
// `public/manifest.webmanifest`, `start_url`. Isso é intencional: quem já
// instalou o app quer registrar treino, não ver a marca de novo.
import Link from "next/link";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

export default async function PaginaInicial() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="tela tela--entrada">
      <div className="entrada">
        <header className="entrada__marca">
          <h1>lastro</h1>
          <p>Registro de treino e leitura semanal.</p>
        </header>

        <Link href={user ? "/treino" : "/login"} className="botao-primario">
          {user ? "Ir para meus treinos" : "Entrar"}
        </Link>
      </div>
    </main>
  );
}
