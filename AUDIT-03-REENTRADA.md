# AUDIT-03-REENTRADA — Auditoria específica de reentrada

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 3 — Reentrada: os sete cenários e a matriz de estados
**Data de execução:** 2026-08-31
**Baseline de código:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Baseline de dados:** instantâneo de produção de 31/08/2026 09:51:54Z
**Método:** análise estática + verificação **somente leitura** sobre 279 registros de participante
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

---

## Sumário executivo

A entrada de alguém novo funciona. **A reentrada é onde o aplicativo se perde** — e a causa raiz é
única e mensurável:

> ### 🔴 F-38 — O aplicativo tem **oito** respostas diferentes para "qual destes registros sou eu?"
>
> São oito funções, escritas em momentos diferentes, com regras diferentes, que discordam entre si.
> Seis delas **enxergam registros removidos**; uma os ignora; uma **apaga** registros. Nenhuma
> delas é a autoridade sobre as outras.
>
> Quase todo sintoma de reentrada catalogado nesta fase é a consequência de duas dessas oito
> réguas discordarem sobre a mesma pessoa, na mesma tela, no mesmo instante.

Dos sete cenários pedidos, **três funcionam**, **três falham** e **um falha em silêncio total** —
o mais grave de toda a auditoria até agora, porque a pessoa não recebe nenhum sinal e continua
usando o app normalmente enquanto nada do que ela faz chega ao grupo.

| Cenário | Situação | Veredito |
|---|---|---|
| **A** | Participante novo | ✅ Funciona |
| **B** | Já cadastrado no PG | ⚠️ Funciona, com efeito colateral |
| **C** | Saiu/removido e recebeu convite de novo | ❌ **Falha** — entra e continua invisível |
| **D** | Tem registro local, não tem no Firebase | ❌ **Falha em silêncio** — pior caso |
| **E** | Tem Firebase, perdeu o localStorage | ⚠️ Recupera, mas pode destruir progresso |
| **F** | Recebeu exatamente o mesmo convite | ❌ **Falha** — acusado de ser outra pessoa |
| **G** | Identidade diferente da registrada | ⚠️ Depende de nome + WhatsApp exatos |

---

# 1. As oito réguas de identidade

Antes dos cenários, é preciso ver o problema estrutural. Todas estas funções respondem à pergunta
"qual participante deste PG sou eu?" — e respondem **diferente**:

| # | Função | Linha | Critério | Vê removidos? |
|---|---|---|---|---|
| 1 | `getMeuGrupoAtivo` | `11992` | `memberId` **ou** nome (minúsculas) | ❌ **Não** |
| 2 | `aceitarConvite` | `10195` | `memberId` apenas | ✅ Sim |
| 3 | `buscarCadastroExistente` | `12012` | nome **estrito** **e** WhatsApp tolerante | ✅ Sim |
| 4 | `cpFindParticipant` | `7680` | `memberId` → `ts` → nome exato → nome normalizado | ✅ Sim |
| 5 | `findMeuParticipante` | `5934` | `memberId` **ou** nome (minúsculas) | ✅ Sim |
| 6 | `getMinhaFuncaoNoGrupo` | `9962` | `memberId` **ou** nome (minúsculas) | ✅ Sim |
| 7 | `removerDoGrupoAtual` | `11971` | **`ts` apenas** | ✅ Sim |
| 8 | `applyGruposData` | `11159` | **nome apenas — e elimina os repetidos** | (poda por idade) |

Observações que decidem cenários inteiros:

- **Só a régua 1 filtra `removed`.** As réguas 2 a 6 encontram alegremente um registro com
  tombstone e trabalham em cima dele. É a origem do Cenário C.
- **A régua 7 é a única que usa `ts`** — e é justamente a que remove alguém.
- **A régua 8 não procura: ela apaga.** Elimina participantes de nome repetido, mantendo o
  primeiro.
- **Nenhuma régua é canônica.** Não há uma função `souEu(p)` que as outras chamem.

---

# 2. Cenário A — Participante novo

**Definição:** pessoa sem registro em nenhum PG, sem `memberId` conhecido, recebendo o primeiro
convite.

### Caminho no código

```
initApp (?conv=)  →  renderTelaConvite  →  confirmarEntradaConvite
   →  getMeuGrupoAtivo(nome)  =  {existe:false}      (não bloqueia)
   →  aceitarConvite
        régua 2: memberId não achado
        régua 3: buscarCadastroExistente → null      (não há cadastro anterior)
        →  CRIA participante novo, push em g.participantes
   →  atualizarStatusPg(g)  →  status = ATIVO
   →  PATCH com pré-condição  →  aplicarLocal
   →  ST.welcomeDone = true  →  home
```

### Veredito: ✅ **funciona como esperado**

O único caminho realmente sólido do sistema. A pessoa entra, o registro nasce completo
(`nome`, `wa`, `tipo`, `papel`, `departamento`, `dataInscricao`, `ts`, `memberId`) e o convite é
consumido.

### Ressalva

Se o WhatsApp digitado não passar por `normalizarWaBR`, o campo `wa` nasce **vazio** e a recusa é
silenciosa (**F-04**). O cadastro fica incompleto desde o primeiro dia, e **essa pessoa nunca mais
poderá ser recuperada num aparelho novo**. Em produção: **9 dos 258 participantes ativos estão
nessa condição.**

---

# 3. Cenário B — Participante já cadastrado no PG

**Definição:** a pessoa já é membro, mesmo aparelho, `memberId` bate — e abre um convite novo
para o mesmo PG.

### Caminho no código

`aceitarConvite` (`index.html:10195`) acha o registro pela régua 2 e cai no ramo "já existe"
(`index.html:10209-10213`):

```js
if (nome) p.nome = nome;
p.tipo  = funcaoParaTipo(inv.funcao);
p.papel = (inv.funcao === 'tutor' || inv.funcao === 'coordenador') ? inv.funcao : p.papel;
```

### Veredito: ⚠️ **funciona, mas cobra um preço**

Não duplica — o comportamento essencial está certo. Três efeitos colaterais:

1. **O convite é consumido à toa.** Se a pessoa abriu o link só para "voltar para dentro do app",
   gastou um convite de uso único e não ganhou nada. Some com o Cenário F: da próxima vez que ela
   abrir esse mesmo link, será acusada de que outra pessoa o usou.
2. **`wa` não é atualizado.** Nenhum dos três ramos de `aceitarConvite` escreve `p.wa` depois da
   criação. Quem trocou de número continua com o antigo gravado, e a recuperação futura falha.
3. **O `papel` pode ser rebaixado.** Um convite de colaborador preserva `p.papel`, mas
   `p.tipo` é **sobrescrito** com `'colaborador'`. Uma coordenadora que aceite um convite de
   colaborador fica com `papel='coordenador'` e `tipo='colaborador'` — e as oito réguas leem
   `papel || tipo` em ordens diferentes.

---

# 4. Cenário C — Saiu/removido e recebeu convite novamente

**Definição:** a pessoa tem registro com `removed: true` (tombstone) no PG e recebe convite novo
para o **mesmo** PG.

### Caminho no código — e onde ele quebra

```
confirmarEntradaConvite
   → getMeuGrupoAtivo (régua 1, FILTRA removed) → {existe:false}
        ✅ correto: não abre o modal de troca de grupo (correção 1aafe63)
   → aceitarConvite
        → régua 2: find(x => x.memberId === memberId)   ← NÃO FILTRA removed
        → ACHA o registro com tombstone
        → ramo "já existe": atualiza nome, tipo, papel
        → ❌ NÃO TOCA EM p.removed
```

> ### 🔴 F-37 (confirmado e aprofundado) — o aceite não ressuscita o registro
>
> A régua 1 diz "esta pessoa não está em nenhum PG". A régua 2 diz "achei o registro dela".
> **As duas estão certas segundo os próprios critérios, e o resultado é incoerente.**
>
> A gravação é bem-sucedida. O convite vira `utilizado`. `ST.welcomeDone` vira `true`. A pessoa vê
> a tela inicial e acredita que entrou.
>
> Mas `p.removed` continua `true`. E aí:
> - `participantesAtivos()` (`index.html:9659`) **não a conta** — ela não aparece na lista do PG;
> - `applyGruposData` mantém o registro só até a poda (30 dias) e o filtra da exibição;
> - o Coordenador não a vê;
> - o Companheiro de Jornada **a vê** (régua 4 não filtra), gerando telas contraditórias;
> - `syncProgressoParaFirebase` (régua 5, não filtra) **grava o progresso dela dentro de um
>   registro removido**, que será apagado.
>
> Sintoma de campo correspondente: *"eu entrei, mas ninguém me vê no grupo"*.

### O relógio de 30 dias

`podarParticipantesRemovidos` (`index.html:9655`) elimina definitivamente qualquer registro com
`removed` cujo `updatedAt` tenha mais de 30 dias. A poda roda dentro de `applyGruposData` e o
resultado é gravado na nuvem na próxima operação de qualquer aparelho — **a exclusão é real e
permanente**.

**Estado em produção: 21 registros com tombstone.**

| Verificação | Resultado |
|---|---|
| Identidade voltou a estar ativa em algum PG | **1** |
| Identidade **não aparece ativa em lugar nenhum** | **20** |
| **XP preso nesses 20 registros órfãos** | **3 805** |

Prazos até a exclusão permanente (contados do `updatedAt`, referência 31/08):

| Remoção | PG | XP em risco | Apagado em |
|---|---|---|---|
| 14/08 | 1 | **665** | ~13/09 |
| 14/08 | 1 | 0 | ~13/09 |
| 15/08 | 12 | 160 | ~14/09 |
| 17/08 | 8 | 320 | ~16/09 |
| 18/08 | 6 | 120 | ~17/09 |
| 20/08 | 24 | 190 | ~19/09 |
| 20/08 | 4 | 270 | ~19/09 |
| 28/08 | 41 | **950** | ~27/09 |
| 28/08 | 41 | 490 | ~27/09 |
| 28/08 | 32 | 270 | ~27/09 |
| 28/08 | 10 | 210 | ~27/09 |
| 28/08 | 49 | 50 | ~27/09 |
| (demais 9) | vários | 0 | 20/09 a 27/09 |

**Depois da data, o registro deixa de existir.** Se a pessoa voltar, `buscarCadastroExistente` não
acha nada, ela é cadastrada como nova e o XP se perde em definitivo. **O primeiro prazo vence em
13 dias.**

### Veredito: ❌ **falha**

O cenário mais explicitamente pedido nesta fase é o que menos funciona. E tem prazo de validade.

---

# 5. Cenário D — Tem registro local, mas não tem no Firebase

**Definição:** o aparelho tem vínculo, `ST` e progresso; a nuvem não tem o registro do
participante naquele PG (perda anterior, gravação que nunca subiu, poda de tombstone, restauração
parcial).

### Caminho no código

Não há um caminho — **há uma ausência de caminho**. Três funções, uma atrás da outra:

```
syncFromFirebase (index.html:11279)
   sem pendência local → dadosAplicados = result.dados     ← a nuvem vence
   applyGruposData(dadosAplicados)
   → o registro da pessoa some do estado local

loadMeuGrupo() → o VÍNCULO continua no localStorage
   → o app segue achando que ela pertence ao PG

syncProgressoParaFirebase (index.html:5947)
   const eu = findMeuParticipante(g);
   if (!eu) return;                      ← ❌ DESISTE EM SILÊNCIO
```

> ### 🔴 F-39 — O progresso é descartado sem aviso, indefinidamente
>
> `syncProgressoParaFirebase` sai calado quando não encontra o registro. **Não recria, não avisa,
> não marca pendência, não registra nada.** A pessoa continua estudando; XP, streak e estudos
> concluídos são gravados normalmente em `ST` (armazenamento local) e **nunca chegam ao grupo**.
>
> Ela vê seu progresso na própria tela. O Coordenador vê zero. Os contadores do PG não somam.
> O IMD e o Ranking do PG ficam errados. E **isso pode durar meses** — nada no aplicativo sinaliza
> a desconexão, porque do ponto de vista dela tudo funciona.
>
> Não existe nenhuma rota de auto-recuperação: `confirmarInscricao()` está morto (FUNC-02d) e o
> acesso é 100% por convite. **O único conserto é aceitar um convite novo** — que é o Cenário E,
> com o risco descrito lá.

### Onde a pessoa recebe algum sinal

Em **uma única tela**: o Companheiro de Jornada (`renderCompanionSelector`,
`index.html:7550-7580`), que exibe *"Não encontramos o seu cadastro no grupo"* e sugere
*"sincronização ainda em andamento… avise o Coordenador"*. O diagnóstico está correto, mas:

- só aparece se a pessoa entrar naquela tela específica;
- o texto sugere problema **temporário**, quando é permanente;
- a home, o Painel e o Progresso não dizem nada.

### O gatilho mais comum é uma instrução aparentemente inofensiva

O risco R-02 (Fase 0) e este cenário são o mesmo evento visto de dois lados. Quando o slot está
vazio na nuvem e cheio no aparelho, mandar alguém "abrir o app para ressincronizar" **executa
exatamente o caminho acima** e apaga o registro local.

### Veredito: ❌ **falha em silêncio — o pior caso da auditoria**

Não é possível medir quantas pessoas estão neste estado: por definição, elas não constam na nuvem.
O instantâneo não pode contá-las. **É o único cenário que a auditoria consegue descrever e não
consegue dimensionar.**

---

# 6. Cenário E — Tem Firebase, perdeu/alterou o localStorage

**Definição:** o registro existe na nuvem; o aparelho perdeu a identidade — celular novo,
navegador diferente, dados limpos, aba anônima, atalho de tela inicial que não compartilha
armazenamento.

### Caminho no código

```
boot: ST vazio → welcomeDone false → showInstitutionalLanding()
   ⚠️ porta terminal: sem convite, não há como entrar

com convite:
confirmarEntradaConvite
   → getMyMemberId() gera um memberId NOVO           (régua 2 nunca vai achar)
   → aceitarConvite
        régua 2: não acha
        régua 3: buscarCadastroExistente(g, nome, wa)
            nome  → igualdade ESTRITA
            wa    → tolerante (===, endsWith nos dois sentidos)
        ACHOU → recuperado = true
              p.memberId = memberId novo
              restaura ST.xp, ST.streak, ST.done
        NÃO ACHOU → cria DUPLICATA
```

### Veredito: ⚠️ **é o caminho de recuperação projetado — e funciona, com dois perigos**

**Perigo 1 — a recuperação sobrescreve sem comparar (F-23).**
`index.html:10245-10249`:
```js
ST.xp     = progressoRecuperado.xp || 0;
ST.streak = progressoRecuperado.streak || 0;
ST.done   = Array.from({length: progressoRecuperado.estudosConcluidos || 0}, (_, i) => i);
```
- É atribuição, não comparação: **se o aparelho tinha mais que a nuvem, o excedente morre**.
- `|| 0` transforma ausência em zero.
- `ST.done` é reconstruído como os **N primeiros** estudos. Quem concluiu os estudos 3, 7 e 9
  passa a constar com 0, 1 e 2. A quantidade sobrevive; **quais**, não.

Isto torna a orientação padrão — *"peça um novo link de convite"*, dada pela própria tela do
Cenário D — **perigosa exatamente para quem mais estudou offline**.

**Perigo 2 — a régua 3 é estrita onde deveria ser tolerante.**
O nome exige igualdade exata. "Maria Silva" não casa com "Maria Aparecida Silva"; "Jose" não casa
com "José". **`nomesCorrespondem()` — a função tolerante que o app já tem e usa em outros lugares
— não é chamada aqui.** Falhou a comparação, o resultado é uma duplicata com XP zerado.

E se `wa` estiver vazio, `buscarCadastroExistente` retorna `null` na primeira linha: **a
recuperação nem é tentada**. São as 9 pessoas do Cenário A — **9 duplicações futuras já
contratadas**, esperando a próxima troca de aparelho.

---

# 7. Cenário F — Recebeu exatamente o mesmo convite

**Definição:** o mesmo `inviteId`, aberto de novo pela mesma pessoa.

Analisado em profundidade na [Fase 2](AUDIT-02-CONVITES.md). Resumo do que importa aqui:

| Primeira abertura | Reabertura |
|---|---|
| Falhou antes de gravar | ✅ Funciona — o convite nunca saiu de `pendente` |
| **Deu certo** | ❌ *"Convite já utilizado por **outra pessoa**"* |

> **F-31** — `usadoPor` guarda o `memberId` de quem usou e **nunca é lido** (duas ocorrências no
> arquivo, ambas de escrita). Bastava comparar com `getMyMemberId()` para responder *"Você já faz
> parte deste Pequeno Grupo"*. O dado necessário está gravado desde sempre.

**Medição:** dos 207 convites já utilizados, **26 (12,6%)** foram usados por alguém que hoje não
consta ativo no PG — 14 com tombstone, 12 desaparecidos. Todas essas pessoas, ao reabrir o próprio
link, recebem a mensagem acusatória e não entram.

### Veredito: ❌ **falha, e a mensagem é factualmente falsa**

---

# 8. Cenário G — Identidade diferente da registrada

**Definição:** a pessoa volta com `memberId` diferente **e** algum dado divergente (nome grafado
de outro jeito, WhatsApp trocado, apelido).

É o Cenário E levado ao limite. O resultado depende inteiramente da régua 3:

| Situação | Nome | WhatsApp | Resultado |
|---|---|---|---|
| Digitou igualzinho | idêntico | bate | ✅ Recupera |
| Nome abreviado ou sem acento | difere | bate | ❌ **Duplica** |
| Trocou de número | idêntico | não bate | ❌ **Duplica** |
| Cadastro sem `wa` (9 pessoas) | qualquer | — | ❌ **Duplica sempre** |
| Nome com espaço/caixa diferente | difere só na forma | bate | ❌ **Duplica** |

Note a incoerência entre réguas: `cpFindParticipant` (régua 4) tem um passo de reserva por nome
normalizado — *"Cardoso silva × Cardoso Silva"* — precisamente para tolerar caixa e espaço.
**A régua 3, que decide se a pessoa duplica ou não, não tem esse passo.** A tolerância existe na
tela que só exibe e falta na função que grava.

### Estado atual em produção — e uma boa notícia

| Verificação | Resultado |
|---|---|
| Mesma identidade ativa em mais de um PG | **0** |
| Nome repetido dentro do mesmo PG | **0** |
| Nomes repetidos entre PGs diferentes | **0** |

**Não há nenhuma duplicidade ativa hoje.** A regra DB-01 está segurando, e a deduplicação manual
feita em 21/08 nos PGs 4, 17, 24 e 37 continua de pé.

### Veredito: ⚠️ **depende de a pessoa digitar exatamente o que está gravado**

O mecanismo funciona quando os dados batem. Não há rede de segurança quando não batem — e o app
não avisa que duplicou. **A ausência de duplicatas hoje é resultado de limpeza manual recente,
não de uma proteção do sistema.**

---

# 9. MATRIZ DE ESTADOS

Comparação entre o resultado **esperado** e o resultado **real**, verificado no código.

## 9.1 — Matriz principal

| Estado | Convite | Identidade | PG | Resultado esperado | **Resultado REAL** | |
|---|---|---|---|---|---|---|
| Novo | válido | nova | livre | entrar | entra; `wa` pode nascer vazio (F-04) | ⚠️ |
| Existente | válido | conhecida | mesmo PG | reentrar | reentra; consome convite; `wa` não atualiza | ⚠️ |
| **Removido** | válido | conhecida | mesmo PG | reentrar conforme regra | **entra mas continua invisível** (F-37) | ❌ |
| Outro PG | válido | conhecida | diferente | bloquear/solicitar ação | modal de troca; remoção pode não gravar (F-15/F-21) | ⚠️ |
| **Convite usado** | válido | conhecida | mesmo PG | **idempotente** | **"usado por OUTRA pessoa"** (F-31) | ❌ |
| Convite inválido | inválido | qualquer | qualquer | bloquear | bloqueia | ✅ |

## 9.2 — Matriz estendida (os sete cenários)

| # | Estado local | Estado na nuvem | Convite | Esperado | **Real** | |
|---|---|---|---|---|---|---|
| A | vazio | inexistente | válido | criar e entrar | cria e entra | ✅ |
| B | vínculo ok | ativo | válido | reconhecer | reconhece; rebaixa `tipo` | ⚠️ |
| C | qualquer | **tombstone** | válido | reativar | **aceita e não reativa** | ❌ |
| C+30d | qualquer | **podado** | válido | recuperar | cria duplicata; **XP perdido** | ❌ |
| D | vínculo + XP | **ausente** | — | avisar e recuperar | **silêncio; progresso descartado** | ❌ |
| E | **vazio** | ativo com `wa` | válido | recuperar | recupera; **pode zerar progresso local** | ⚠️ |
| E- | vazio | ativo **sem `wa`** | válido | recuperar | **duplica sempre** | ❌ |
| F | qualquer | ativo | **já usado** | idempotente | acusa "outra pessoa" | ❌ |
| G | vazio | ativo, nome difere | válido | recuperar | **duplica** | ❌ |

## 9.3 — Qual régua decide cada célula

| Momento | Régua | Filtra removidos? | Consequência |
|---|---|---|---|
| Bloqueio DB-01 | 1 `getMeuGrupoAtivo` | ✅ Sim | Removido não é barrado — **correto** |
| Aceite do convite | 2 `aceitarConvite` | ❌ Não | Removido é reaproveitado — **origem do C** |
| Recuperação | 3 `buscarCadastroExistente` | ❌ Não | Nome estrito — **origem do E-/G** |
| Companheiro | 4 `cpFindParticipant` | ❌ Não | Removido se vê na tela |
| Sync de progresso | 5 `findMeuParticipante` | ❌ Não | Grava em registro morto |
| Autoridade | 6 `getMinhaFuncaoNoGrupo` | ❌ Não | Removido pode manter poderes |
| Saída do PG | 7 `removerDoGrupoAtual` | usa `ts` | Pode não marcar nada (F-15) |
| Aplicação da nuvem | 8 `applyGruposData` | poda por idade | **Apaga homônimos** (F-26) |

**A régua 1 é a única correta, e é a única que não é usada em nenhuma gravação.**

---

# 10. Achados novos da Fase 3

| # | Achado | Sev. |
|---|---|---|
| **F-38** | Oito réguas de identidade discordantes; nenhuma é canônica; 6 de 8 enxergam removidos | **A** |
| **F-39** | `syncProgressoParaFirebase` descarta o progresso em silêncio quando não acha o registro; sem aviso, sem pendência, sem auto-recuperação | **A** |
| **F-40** | O tombstone tem prazo de 30 dias e leva o XP junto; **3 805 XP** em 20 registros órfãos, primeiro vencimento em **~13/09** | **A** |
| **F-41** | O aceite sobrescreve `p.tipo` mesmo em convite de colaborador, podendo rebaixar quem tem `papel` superior | B |
| **F-42** | O único aviso de "cadastro não encontrado" vive numa tela lateral e descreve como temporário um problema permanente | B |
| **F-43** | `cpFindParticipant` tolera caixa/espaço no nome; `buscarCadastroExistente` — que decide se duplica — não tolera | B |

---

# 11. Correções às fases anteriores

Duas hipóteses testadas contra os dados reais. **Ambas se revelaram sem vítimas.**

### ❌ F-26 (deduplicação por nome) — **zero combustível**

A Fase 1 apontou que `applyGruposData` elimina participantes de nome repetido e classificou o
achado como severidade A. Verificação em produção:

- nomes repetidos **dentro do mesmo PG**: **0**
- nomes repetidos **entre PGs**: **0**
- os 258 participantes ativos têm nomes **todos distintos**

O defeito existe no código e é real, mas **não há hoje um único caso em que ele possa disparar**.
**Rebaixado de A para C.**

### ❌ F-15 (tombstone marcado na pessoa errada) — **ramo perigoso sem combustível**

`removerDoGrupoAtual` casa por `p.ts === meuGrupo.ts`; com `ts` indefinido, poderia marcar o
tombstone no primeiro participante que também não tenha `ts`. Verificação: **0 dos 258
participantes ativos estão sem `ts`.**

O ramo destrutivo **não pode disparar hoje**. O ramo benigno — não marcar tombstone nenhum e
deixar a pessoa em dois PGs — continua possível. **Rebaixado de A para B.**

### Balanço das correções

Com F-06 (Fase 2), são **três** achados de severidade A rebaixados por confronto com os dados
reais. Vale registrar o padrão: **a análise estática superestima consistentemente a gravidade.**
Todo achado desta auditoria deve ser confrontado com produção antes de virar prioridade — e é o
que as Fases 2 e 3 passaram a fazer.

---

# 12. Prioridades resultantes

Ordenadas por **dano × urgência**, não por elegância da correção.

| # | Ação | Por quê | Prazo |
|---|---|---|---|
| 1 | **Decidir o destino dos 20 tombstones órfãos** | 3 805 XP são apagados permanentemente a partir de ~13/09. Não depende de código: é decisão de quem volta e quem não volta | **13 dias** |
| 2 | Reconhecer o próprio uso do convite (F-31) | Mensagem falsa e acusatória atinge 12,6% de quem entrou; alimenta a multiplicação de convites | — |
| 3 | Limpar `removed` no aceite (F-37) | "Entrei e ninguém me vê" | — |
| 4 | Avisar quando o progresso não sobe (F-39) | Único cenário que a auditoria não consegue dimensionar | — |
| 5 | Distinguir falha de leitura de convite inexistente (F-01) | Sete causas com a mesma mensagem enganosa | — |
| 6 | Unificar as réguas de identidade (F-38) | Causa raiz comum de C, E, F e G | Estrutural |

Os itens 2 a 5 são correções pequenas e localizadas. O item 6 é de arquitetura e deve vir depois —
com a ressalva de que **F-35 e R-05 têm de ser tratados juntos**: corrigir isoladamente a limpeza
do `papel` na troca de coordenador mataria de uma vez todos os convites pendentes emitidos pelo
coordenador anterior.

---

# 13. Limites desta fase

- **Nada foi executado.** Nenhuma função rodou; nenhum convite foi aberto; nenhuma escrita
  ocorreu. Todas as travessias são leitura de código.
- **O Cenário D é indimensionável por construção.** Quem está nele não consta na nuvem — o
  instantâneo não pode contá-lo. Só um levantamento em campo (perguntar aos coordenadores quem
  "sumiu da lista") daria a ordem de grandeza.
- **Os prazos de poda dependem do `updatedAt` gravado** e do momento em que qualquer aparelho
  fizer a próxima gravação. São estimativas de calendário, não garantias ao dia.
- **A ausência de duplicatas hoje não é prova de que o mecanismo funciona.** É resultado da
  deduplicação manual de 21/08. As causas (F-11, F-43, cadastros sem `wa`) continuam ativas.
- **Os 9 cadastros sem `wa` foram contados, não investigados.** Não se sabe se é digitação
  recusada em silêncio (F-04), importação antiga ou registro criado por outra rota.
