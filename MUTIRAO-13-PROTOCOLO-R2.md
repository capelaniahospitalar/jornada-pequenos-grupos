# MUTIRÃO DE NATAL 2026 · PROTOCOLO R2 — validação contra o Firestore real

**Data:** 2026-09-08 · **Revisto em 2026-09-09** · **Versão candidata:** `1.3.0-rc1` + Mutirão (FASES 0–14)
**Status:** 🟡 **PARCIALMENTE EXECUTADO em 2026-09-09.** R2-A, R2-B e R2-C ✅ aprovados em produção
— a evidência está em `MUTIRAO-15-R2-EXECUCAO.md`, não aqui. Faltam o §5.1, o R2-D (dois aparelhos)
e o R2-E.

> ⚠️ **O §2 deste protocolo manda abrir o app SEM `?teste=1`. NÃO FAÇA ISSO** — carregar a página
> em modo normal dispara `syncFromFirebase → migrarSetoresParaMestre → saveGrupos`, que **grava em
> `jdpg/grupos`** sem nenhum clique. Use o método do `MUTIRAO-15` §0: `?teste=1` mais as chamadas
> explícitas pelo console.

> ⚠️ **REVISÃO DE 2026-09-09 — leia antes de executar.** O Mutirão deixou de usar um documento
> institucional único e passou a usar **um documento por PG e por edição**:
> `jdpg/mutirao/2026/{pgNum}` (FASE 14). Todo comando deste protocolo mudou de assinatura —
> as funções agora exigem o número do PG. Executar a versão anterior deste documento leria e
> gravaria num endereço que não existe mais.
>
> **A mudança mais importante para quem vai a campo:** na etapa **R2-D**, os dois aparelhos
> agora **PRECISAM estar no MESMO PG**. Antes, qualquer par de aparelhos da instituição
> disputava o mesmo documento; agora só quem está no mesmo PG disputa.

> **O que este protocolo prova, e os 227 testes não provam:** que a URL real está certa, que a
> regra publicada aceita a gravação, e que **o Firestore de verdade honra a pré-condição**.
> Até aqui, a trava foi provada contra um servidor falso escrito por mim.

---

# 0. A sequência acordada

```
Regra local aprovada ✅
   ↓
1. Publicar a regra no Console          ← você
   ↓
2. R2-A  gravação real controlada       ← 1 aparelho, 5 min
   ↓
3. R2-B  conferir no Console do Firestore
   ↓
4. R2-C  ⭐ pré-condição de concorrência ← 1 aparelho, prova a trava
   ↓
5. R2-D  ⭐ simultaneidade                ← 2 aparelhos
   ↓
6. R2-E  persistência e reentrada
   ↓
Fechar T9 → Homologar
```

**R2-C é a etapa mais valiosa e precisa de uma pessoa só.** Ela transforma a trava de promessa de código em propriedade comprovada — sem depender de agenda de duas pessoas.

---

# 1. Por que este R2 pode rodar em PRODUÇÃO

O R2 da reentrada de convite (`AUDIT-17`) exigiu um projeto Firebase separado, porque mexia em `jdpg/grupos`, onde vivem os dados reais de 70 PGs. **Aqui é diferente:**

| | |
|---|---|
| `jdpg/mutirao/2026/{pgNum}` | coleção **nova**, ainda não existe. Nada depende dela |
| `jdpg/grupos` | **nenhum caminho de código do Mutirão o toca** |
| Exclusão do documento | **negada pela regra** — não há como destruí-lo |
| Pior caso | entregas de teste ficam registradas na campanha — e §7 resolve |

E há uma razão positiva: **testar num projeto de teste não validaria a regra publicada em produção**, que é justamente o que precisamos provar.

## 1.1 ⚠️ A única armadilha: a mesclagem só CRESCE

O conjunto de entregas nunca encolhe — foi assim que garantimos que nada se perde. **O efeito colateral é que apagar não funciona como se espera:**

> Se você limpar as entregas de teste **só na nuvem**, o próximo sync de qualquer aparelho que ainda as tenha no armazenamento local **traz todas de volta**.

A forma correta de remover é **anular** (tombstone), que o merge propaga corretamente. Ver §7.

---

# 2. Preparação

**No Console do Firebase** — projeto `jornada-pequenos-grupos`, conta Google **"OQQÉ? Tutorial"** (não a "Wladimir"):

1. Firestore Database → aba **Regras** → colar o texto de `firestore.rules` → **Publicar**.
2. Anotar o horário da publicação.

**No aparelho** (versão candidata servida localmente ou publicada — **sem** `?teste=1`, porque o modo de teste barra a rede de propósito):

3. Abrir o app, F12 → Console.
4. Confirmar a URL real:

```
mutiraoDocUrl(loadFbConfig(), 999)
```

Esperado: `.../projects/jornada-pequenos-grupos/databases/(default)/documents/jdpg/mutirao/2026/999?key=…`

⚠️ **Conferir três vezes que o `projectId` é `jornada-pequenos-grupos`** e que o caminho é `jdpg/mutirao/2026/999` — quatro níveis, terminando no número do PG.

> O PG do R2-A/B/C é o **999**, que não existe. Com um documento por PG, isso significa que as
> entregas de teste vivem num **documento à parte**, que nenhum PG real lê. É um isolamento
> melhor do que o da versão anterior deste protocolo, em que elas caíam no mesmo documento de
> todo mundo.

---

# 3. R2-A — Gravação real controlada

**Objetivo:** provar que a regra publicada aceita a gravação e que o documento nasce.

As entregas de teste usam **`pgNum: 999`**, que não corresponde a nenhum PG real — assim elas ficam **invisíveis em todas as telas** (todas filtram por `pgNum`) e são triviais de identificar depois.

```
const cfg = loadFbConfig();

const PG_TESTE = 999;   // PG que não existe: documento próprio, invisível para todo mundo

// 1. Estado atual (o documento provavelmente ainda não existe)
const antes = await mutiraoFbRead(cfg, PG_TESTE);
console.log('ANTES:', antes);

// 2. Uma entrega de teste, marcada
const teste = (kg) => ({
  entregaId: crypto.randomUUID(), mutiraoNatal: '2026', pgNum: PG_TESTE, pgId: null,
  tipoOrigem: 'PARTICIPANTE_PG', quantidadeKg: kg, data: '2026-09-08', ts: Date.now(),
  registradoPor: { memberId: 'R2-TESTE', nome: 'R2 TESTE', papel: 'colaborador' },
  participante:  { memberId: 'R2-TESTE', nome: 'R2 TESTE' },
  externo: null, removed: false
});

// 3. Grava
const w = await mutiraoFbWrite(cfg, PG_TESTE, (antes.entregas || []).concat([teste(1)]), antes.updateTime);
console.log('GRAVACAO:', w);
```

| Esperado | |
|---|---|
| `w.ok === true` | ✅ a regra aceitou |
| `w.updateTime` | um carimbo novo |

| Se falhar | O que significa |
|---|---|
| `http: 403` · `sem_permissao` | **a regra não está publicada** (ou tem erro de sintaxe) |
| `preconditionFailed: true` | outro aparelho gravou no meio — repita |
| `http: 400` | a forma do documento não bate com a regra |
| `motivo: 'pg_misturado'` | há entrega de outro PG (ou de outra edição) no conjunto — a guarda de isolamento barrou antes de sair da máquina. Confira o `PG_TESTE` |
| `motivo: 'pg_invalido'` | você esqueceu o número do PG no comando |

---

# 4. R2-B — Conferir no Firestore real

```
const depois = await mutiraoFbRead(cfg, PG_TESTE);
console.log('DEPOIS:', depois.entregas.length, depois.updateTime);
```

**E no Console do Firebase:** Firestore Database → **Dados** → `jdpg` → `mutirao` → `2026` → `999`.

| Conferir | Esperado |
|---|---|
| O documento `999` existe dentro de `jdpg/mutirao/2026` | ✅ |
| Campo `entregas` | texto JSON contendo `R2-TESTE` |
| Campo `ts` | número |
| Campo `schemaVersion` | `1` |
| **`jdpg/grupos`** | **`updateTime` NÃO mudou** ← prova o isolamento |

📸 **Evidência:** captura da tela do Console mostrando o documento.

> ⚠️ Anote o `updateTime` de `jdpg/grupos` **antes** de começar tudo, para poder comparar.

---

# 5. R2-C — ⭐ A pré-condição de concorrência (um aparelho)

**Esta é a etapa que prova a trava contra o Firestore de verdade.**

Simula dois aparelhos: lê **uma vez**, grava **duas vezes** usando o **mesmo carimbo antigo**. A segunda tem de ser recusada.

```
const cfg = loadFbConfig();

// 1. Lê UMA vez e guarda o carimbo
const base = await mutiraoFbRead(cfg, PG_TESTE);
console.log('carimbo lido:', base.updateTime);

// 2. Primeira gravação — deve PASSAR
const w1 = await mutiraoFbWrite(cfg, PG_TESTE, base.entregas.concat([teste(2)]), base.updateTime);
console.log('1a gravacao:', w1);

// 3. Segunda gravação com o MESMO carimbo antigo — deve ser RECUSADA
const w2 = await mutiraoFbWrite(cfg, PG_TESTE, base.entregas.concat([teste(3)]), base.updateTime);
console.log('2a gravacao:', w2);
```

| Resultado | Veredito |
|---|---|
| `w1.ok === true` **e** `w2.preconditionFailed === true` | ✅ **A TRAVA FUNCIONA NO FIRESTORE REAL** |
| `w2.ok === true` | ❌ **FALHA GRAVE** — a pré-condição não está sendo honrada. **PARAR e reportar** |

## 5.1 E o laço se recupera?

```
mutiraoSaveEntregas(mutiraoLoadEntregas().concat([teste(4)]));
mutiraoConflitos = 0;
const s = await sincronizarMutirao(PG_TESTE);
console.log('sync:', s, '| conflitos:', mutiraoConflitos);
```

**Esperado:** `s.ok === true` — o laço releu, remesclou e gravou. Nada se perdeu.

---

# 6. R2-D — ⭐ Simultaneidade com dois aparelhos

> ⚠️ **MUDOU EM 09/09 — a condição do teste se inverteu.** Agora cada PG tem o seu documento.
> Portanto os dois aparelhos **PRECISAM estar no MESMO PG**, senão eles gravam em documentos
> diferentes, não há disputa nenhuma e o teste **passaria sem provar nada**.
>
> Isso é mais difícil de montar do que antes — e é justamente a propriedade que queríamos:
> na campanha real, uma pessoa do PG 12 nunca disputa gravação com uma do PG 40.
>
> **Como saber que o teste é válido:** ao final, `mutiraoConflitos ≥ 1` nos dois aparelhos
> somados. Se der 0, os dois não estavam no mesmo PG — refaça.

## 6.1 Preparação

> ## 🟠 DESVIO CONTROLADO, APROVADO PELO USUÁRIO — 2026-09-10
>
> **O aparelho B deixa de ser um segundo celular e passa a ser o navegador do PC.**
>
> **Este é um desvio declarado, não o cenário original.** O R2-D foi especificado para dois
> celulares; o que será executado é **um celular e um navegador de PC**.
>
> **Motivo:** o sinal de validade deste teste — `mutiraoConflitos` (§6.3) — vive apenas na memória
> do JavaScript e só é legível pelo **console do navegador**. Um iPhone não oferece console
> acessível, e o valor não aparece em nenhuma tela do app. Sem o PC, o teste rodaria **sem
> possibilidade de saber se valeu** — e um R2-D que "passa" sem disputa é o pior resultado
> possível, porque parece sucesso.
>
> **O que se preserva:** dois clientes reais, do mesmo PG, executando a mesma candidata, gravando
> concorrentemente no mesmo documento — que é exatamente o que o teste exige.
>
> **O que se perde, e fica registrado como limitação:** o cenário "dois celulares em rede móvel".
> A degradação de rede **continua testável no aparelho A** pela variante §6.4.
>
> Ver `MUTIRAO-16-CONSISTENCIA-PRE-SESSAO.md` §4 (C-04).

| | |
|---|---|
| Aparelho **A** | **celular** do segundo participante, em rede móvel, versão candidata, inscrito **no mesmo PG do aparelho B** |
| Aparelho **B** | **navegador do PC**, autenticado como Tutor, versão candidata, inscrito **no mesmo PG do aparelho A** |
| Quantia | **0,1 kg** nos dois — marcador mínimo, fácil de identificar e anular depois |

## 6.2 O teste

| Passo | |
|---|---|
| 1 | Nos **dois** aparelhos: abrir 🎁 Mutirão de Natal e **esperar a tela carregar** (isso sincroniza — os dois passam a conhecer o mesmo estado) |
| 2 | Nos **dois**: digitar `0,1` e **parar antes** de tocar em REGISTRAR |
| 3 | Tocar em **REGISTRAR** no A e, **em menos de 2 segundos**, no B |
| 4 | Aguardar as duas telas responderem |
| 5 | Conferir no Console do Firebase o campo `entregas` |

| Esperado | |
|---|---|
| **As DUAS entregas de 0,1 kg estão no documento** | ⭐ o resultado que importa |
| Nenhuma entrega anterior sumiu | |
| Os dois aparelhos, ao reabrir a tela, mostram o **mesmo total** | |

**Evidência obrigatória:** contagem de entregas **antes** e **depois**, e a captura do documento no Console. *"Funcionou" não é evidência.*

## 6.3 A trava disparou?

**No aparelho B (o navegador do PC)**, no Console:

```
mutiraoConflitos
```

*(Revisão MUTIRÃO-16 / C-04: a instrução anterior dizia "em qualquer um dos aparelhos" — no
celular isso é inexecutável. É por causa desta leitura que o aparelho B passou a ser o PC.)*

| Valor | Leitura |
|---|---|
| `≥ 1` | ✅ **a trava atuou** — houve disputa real e o laço resolveu |
| `0` | as gravações não se cruzaram. **Repita o passo 3 mais rápido** até conseguir pelo menos uma disputa |

Também aparece no console a linha — **texto real conferido no código em 10/09** *(C-05; a citação
anterior era anterior à migração por PG de 09/09 e não incluía o número do PG)*:

```
Mutirão: trava de concorrência disparou no PG <N>, tentativa <N> — outro aparelho
gravou primeiro. Relendo e remesclando.
```

## 6.4 Variante sob rede ruim (opcional, mas é o cenário do hospital)

Repetir com **um** aparelho em rede fraca ou modo avião por 2 s no meio da gravação.
**Esperado:** o aparelho degradado demora mais; **em nenhuma hipótese a entrega do outro desaparece.**

---

# 7. R2-E — Persistência, reentrada e limpeza

## 7.1 Persistência (fechar o PWA de verdade)

| Passo | |
|---|---|
| 1 | Registrar 0,1 kg |
| 2 | **Fechar o app pelo alternador de aplicativos** (não só voltar à tela inicial) |
| 3 | Abrir de novo pelo atalho |
| 4 | Abrir 🎁 Mutirão de Natal |

**Esperado:** a entrega continua no histórico e o total do PG está correto.

> É o achado de campo mais recorrente deste projeto. **Confirmar a versão antes de cada rodada** —
> ao retomar do segundo plano o código não é recarregado (achado F-74).
>
> *(Revisão MUTIRÃO-16 / C-02: o app **não exibe a versão na tela**. O procedimento é tocar no
> botão **🔄** da Home e conferir a linha correspondente em `registro-da-sessao.txt`, gravada pelo
> servidor do kit. **Ausência da linha = o aparelho não recarregou = a rodada não vale.**)*

## 7.2 Reentrada

Aceitar um convite novo (ou limpar os dados do site e reentrar) e conferir que **o histórico de entregas da pessoa continua visível** — casa por nome quando o `memberId` muda.

## 7.3 Limpeza — ⚠️ a ordem importa

**Anular é o caminho certo.** Não tente esvaziar a nuvem.

```
// Em CADA aparelho que participou:
const alvos = mutiraoLoadEntregas().filter(e =>
  e.pgNum === 999 || (e.quantidadeKg === 0.1 && !e.removed));
alvos.forEach(e => anularEntregaNatal(e.entregaId));

// Um sync POR PG afetado — a sincronização passou a ser por PG.
for (const pg of [...new Set(alvos.map(e => e.pgNum))]) await sincronizarMutirao(pg);
console.log('anuladas:', alvos.length);
```

| | |
|---|---|
| As entregas **permanecem** no documento, marcadas `removed: true` | é a trilha de auditoria, por desenho |
| Elas **não contam** em nenhum total | ✅ |
| O tombstone **se propaga** para os outros aparelhos | ✅ e isso também testa a mesclagem |

❌ **NÃO faça:** gravar `entregas: []` na nuvem. Qualquer aparelho que ainda tenha as entregas localmente as devolve no próximo sync.

---

# 8. Ficha de evidência

Uma por etapa.

```
ETAPA            :  R2-A / B / C / D / E
DISPOSITIVO      :  (modelo, sistema, navegador)
VERSÃO           :  (linha do registro-da-sessao.txt após o 🔄 — hora e IP;
                     o app NÃO exibe versão na tela — ver MUTIRÃO-16 / C-02)
REGRA PUBLICADA  :  (data e hora)
HORÁRIO          :
updateTime ANTES :
updateTime DEPOIS:
Nº ENTREGAS ANTES:
Nº ENTREGAS DEPOIS:
mutiraoConflitos :
RESULTADO        :
PASS / FAIL      :
EVIDÊNCIA        :  (captura do Console do Firebase)
jdpg/grupos MUDOU?: (tem de ser NÃO)
```

---

# 9. Critério de aprovação do R2

```
[ ] R2-A  a regra publicada aceitou a gravação (sem 403)
[ ] R2-B  o documento jdpg/mutirao/2026/999 existe e tem o conteúdo esperado
[ ] R2-B  jdpg/grupos NÃO foi alterado
[ ] R2-C  ⭐ a 2ª gravação com carimbo velho foi RECUSADA pelo Firestore real
[ ] R2-C  o laço releu, remesclou e gravou sem perder nada
[ ] R2-D  os dois aparelhos estavam MESMO no mesmo PG (senão o teste não vale)
[ ] R2-D  ⭐ as duas entregas simultâneas sobreviveram
[ ] R2-D  mutiraoConflitos ≥ 1 (houve disputa real)
[ ] R2-D  o documento de OUTRO PG não foi alterado durante o teste
[ ] R2-E  a entrega sobreviveu a fechar e reabrir o PWA
[ ] R2-E  o histórico sobreviveu à reentrada
[ ] a limpeza por tombstone se propagou entre os aparelhos
[ ] nenhum comportamento inexplicável
```

**Só com todos marcados:** R2 aprovado → T9 fechado → homologação do Mutirão encerrada.

## 9.1 Se algo falhar

Mesma disciplina do `AUDIT-17`: **não corrigir de imediato.** Registrar a ficha completa, **não repetir por cima**, exportar o documento do Firestore naquele instante, e só então investigar. E distinguir falha do código de falha do protocolo — nas fases anteriores desta auditoria, **cinco "defeitos" acabaram sendo erro da bancada**.

---

# 10. ✅ ACHADO RESOLVIDO EM 09/09 — capacidade do documento

> **Este achado foi o que motivou a FASE 14.** O usuário informou em 09/09 que a campanha fica
> aberta de setembro ao início de dezembro e que **cada pessoa registra várias vezes**. Com
> ~296 participantes ativos, isso estoura o documento único durante a campanha. A saída
> escolhida foi a **nº 3 da lista abaixo** — separar por PG — e ela está implementada.
>
> **A conta nova:** o teto continua existindo, mas agora é **por PG**, não da instituição.
> Com ~1 012 entregas cabendo em cada documento e ~6 pessoas por PG, são ~168 registros por
> pessoa. O limite deixou de ser um gargalo único e passou a ser distribuído. Ver `MUTIRAO-14`.
>
> O texto original está preservado abaixo, porque é o registro de como o problema foi medido.

## 10.1 A medição original (08/09) — mantida como registro

Medi o tamanho real de uma entrega, com UUIDs de verdade e nome completo:

| | |
|---|---|
| Entrega de participante | **455 bytes** |
| Entrega externa | **393 bytes** |
| Entrega anulada (com tombstone) | **578 bytes** |
| Média | **424 bytes** |

| | |
|---|---|
| Teto da regra (`entregas.size() < 500000`) | ~**1 179** entregas |
| Guarda do app (aborta em 480 000) | ~**1 132** entregas |
| Distribuído por 70 PGs | ~**16 entregas por PG** |

**Isto não bloqueia o R2** — mas é um limite real da campanha. Se a expectativa for mais de ~1 100 entregas no total da instituição, o documento estoura e **a gravação passa a ser recusada** (o app avisa, não perde dado — mas ninguém mais consegue registrar).

**Não mexi em nada disso**, porque não foi pedido e porque mudar o formato agora invalidaria os testes. As saídas possíveis, quando você quiser decidir:

1. **Encurtar os campos** (`registradoPor` guarda nome e memberId que se repetem no `participante`) — ganho fácil de ~30%.
2. **Um documento por edição/mês** — `jdpg/mutirao-2026`.
3. **Quebrar por faixa de PG** — mais complexo, provavelmente desnecessário.

**Pergunta para você:** quantas entregas você espera na campanha inteira? Se for algo como 300–500, não há problema nenhum. Se for perto de mil, vale resolver **antes** de publicar.

---

# 11. O que este protocolo NÃO cobre

| | |
|---|---|
| Volume real | o documento de teste terá poucas entregas; o peso de mil não será reproduzido |
| Latência do hospital | modo avião não reproduz rede lenta e instável |
| Convivência de versões | o app publicado não conhece `jdpg/mutirao/2026/{pgNum}` — não há o que testar aqui, e isso é a vantagem da Opção 2 |
| Isolamento entre PGs | provado só contra o servidor falso (N-16 a N-25). Em campo, o R2-D com dois aparelhos no mesmo PG é o que exercita o caminho real |
| **R2 do `AUDIT-17`** | **continua pendente e é independente deste.** A reentrada de convite da `1.3.0-rc1` ainda não foi validada em campo |
