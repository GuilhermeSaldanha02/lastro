// lastro · tarefa 2.1 — "/" não é uma tela própria: manda direto pro
// treino (o middleware decide se isso vira /login, se não houver sessão).
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/treino");
}
