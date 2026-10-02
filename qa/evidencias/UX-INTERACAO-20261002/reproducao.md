# Reprodução isolada dos handlers — 2026-10-02

Base: 9dee403. Sem React montado, rede, Supabase ou dados reais. O script extrai as funções reais por AST; as dependências são simuladas. A saída está em handlers.txt. Não é prova visual/E2E e não promove nenhum item para PASSOU.

Para reproduzir, salve o bloco como reproduzir.cjs e execute node reproduzir.cjs <raiz-do-repositorio> <caminho-do-modulo-typescript>.

```javascript
// Auditoria de handlers reais extraídos por AST. Não monta React, não acessa rede/banco.
// Uso: node reproduzir.cjs <raiz-do-repositorio> <caminho-do-typescript>
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2];
const ts = require(process.argv[3]);
function handler(file, name, context) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, 'src/components', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found;
  function visit(n) {
    if (ts.isFunctionDeclaration(n) && n.name?.text === name) found = n;
    ts.forEachChild(n, visit);
  }
  visit(source);
  assert.ok(found, `${file}: ${name}`);
  const code = ts.transpileModule(found.getText(source), {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  return vm.runInNewContext(`${code}\n${name}`, context);
}
const reject = async () => { throw new Error('rede interrompida simulada'); };
const noop = () => {};
const router = {replace:noop, refresh:noop};
const t = text => text;
function deferred() { let resolve; const promise = new Promise(r => {resolve=r;}); return {promise,resolve}; }
async function main() {
  for (const [file,name,action,setter,args,extra] of [
    ['onboarding.tsx','terminar','concluirOnboarding','setSaindo',[],{saindo:false,router,casa:'/'}],
    ['aceite-termos.tsx','aceitar','aceitarTermos','setEnviando',[],{enviando:false,router,destino:'/'}],
    ['idioma-form.tsx','salvar','definirIdioma','setSalvando',['en'],{setIdioma:noop,setSalvo:noop}],
    ['editar-perfil.tsx','aoEscolherArquivo','atualizarAvatarManual','setEnviando',[{target:{files:[{}],value:'arquivo'}}],{validarArquivoAvatar:()=>({ok:true}),setAvatarUrl:noop,idioma:'pt-BR'}],
  ]) {
    let busy=false, error=null;
    const fn=handler(file,name,{...extra,[action]:reject,[setter]:v=>busy=v,setErro:v=>error=v});
    await assert.rejects(fn(...args));
    assert.equal(busy,true);
    assert.equal(error,null);
    console.log(`REPRODUZIDO: ${file} mantém ocupado=true e erro=null após rejeição de transporte`);
  }
  {
    const network=deferred(); let open=false;
    const fn=handler('treino-detalhe.tsx','abrirComPlano',{historicoDoExercicio:()=>network.promise,setPreenchimento:noop,setFormularioAberto:v=>open=v});
    const pending=fn({exercicioId:'fixture',reps:null,peso:null});
    await Promise.resolve(); assert.equal(open,false);
    network.resolve([]); await pending; assert.equal(open,true);
    console.log('REPRODUZIDO: + do modelo só abre formulário depois de resolver busca do histórico');
  }
  {
    const network=deferred(); let queued=false, closed=false;
    const fn=handler('treino-detalhe.tsx','editarSerie',{setSeries:noop,enfileirar:async()=>{queued=true;},usuarioId:'fixture',drenar:()=>network.promise,pedirSincronizacaoEmSegundoPlano:noop,setEditandoId:()=>{closed=true;}});
    const pending=fn('serie-fixture',{reps:10});
    await Promise.resolve(); assert.equal(queued,true); assert.equal(closed,false);
    network.resolve({falhou:false}); await pending; assert.equal(closed,true);
    console.log('REPRODUZIDO: edição já enfileirada continua aberta até drenar resolver');
  }
  {
    let busy=false, progress=null;
    const fn=handler('analise-interativa.tsx','perguntar',{setEnviando:v=>busy=v,setErro:noop,fetch:async()=>({status:202,ok:true}),setEmAndamento:v=>progress=v,PERGUNTAS:{1:'Estou progredindo?'},t,idioma:'pt-BR'});
    await fn(1); assert.equal(busy,false); assert.equal(progress.perguntaTexto,'Estou progredindo?');
    console.log('REPRODUZIDO: resposta 202 deixa emAndamento preenchido; código usa esse estado para bloquear perguntas');
  }
  {
    let notes={sono:2}, open=true, writes=0;
    const ctx={setNotas:fn=>notes=fn(notes),setAberta:v=>open=v,setErro:noop,window:{localStorage:{setItem:()=>writes++}},chaveFolhaDispensada:()=> 'fixture',usuarioId:'fixture',hoje:'2026-10-02'};
    handler('cartao-checkin.tsx','escolher',ctx)('sono',5);
    handler('cartao-checkin.tsx','fechar',ctx)();
    assert.equal(open,false); assert.equal(notes.sono,5); assert.equal(writes,1);
    console.log('REPRODUZIDO: alterar nota e fechar mantém nota alterada no estado do resumo sem chamar salvar');
  }
  console.log('8 cenários reproduzidos. Evidência de lógica isolada; não é prova visual ou E2E.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});

```
