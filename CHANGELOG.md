# CHANGELOG — Jornada Discipular em Pequenos Grupos

## [2026-08-27] — Companheiro de Jornada: aparelho que perdeu a identidade volta a se reconhecer

**Achado de campo.** O Coordenador do PG 27 "Esperança VivA" (Henry Henderson Cardoso silva) abriu
o Companheiro de Jornada e recebeu *"Não foi possível carregar seus dados agora"* seguido de uma
linha técnica crua: `mg=NULO g=NULO eu=NULO · meuMemberId=a4620f07…`.

**Diagnóstico — não era a tela, e não era o dado.** O cadastro dele está íntegro no PG 27
(coordenador, `memberId` `a8cfd292…`). O `memberId` que o aparelho dele mostrou, `a4620f07…`,
**não existe em nenhum dos 70 PGs**: é outra instalação, ou o armazenamento local daquele navegador
foi limpo (no iPhone isso acontece sozinho após um período sem uso). Sem vínculo, `loadMeuGrupo()`
devolve vazio e a tela não tem como saber quem é a pessoa nem em que grupo procurar.

**Seis correções, todas locais — nenhum campo novo, nada de novo gravado na nuvem:**

1. **`loadMeuGrupo()` ganhou uma última rede de recuperação.** Se vínculos e formato antigo estão
   vazios mas `ST.grupoNum` e `ST.userName` existem, o grupo é reconstruído a partir daí — e essa
   prova é sólida, porque `startJourney()` **exige** grupo para concluir as boas-vindas. Sem isso o
   app fica anônimo para si mesmo: somem o Companheiro, o Painel e a área de convite, com o cadastro
   intacto na nuvem. Não inventa identidade: sem nome guardado, devolve vazio como antes.
2. **A tela deixou de despejar diagnóstico técnico no rosto do usuário.** Aquela linha estava marcada
   como TEMPORÁRIA em 2026-07-20 e ficou em produção. Agora cada causa tem seu recado — aparelho não
   identificado, PG fora desta versão (build antiga, `?v=2`), cadastro não encontrado — e o detalhe
   técnico fica recolhido em "Detalhes técnicos", disponível para suporte.
3. **Ninguém mais aparece na própria lista de candidatos a companheiro.** O filtro comparava `ts` e
   nome por valor; com o nome guardado em outra caixa ("Cardoso silva" × "Cardoso Silva") a pessoa
   se via na lista e podia convidar a si mesma. Passa a comparar a identidade do registro.
   `cpFindParticipant` também ganhou reserva por nome normalizado.
4. **Os botões do Companheiro eram MUDOS quando o aparelho não reconhecia a pessoa.**
   `inviteCompanion` e `acceptCompanion` começavam com `if (!mg || !g) return;` — `return` seco, sem
   aviso nenhum: a pessoa tocava em "Convidar como Companheiro de Jornada" e **nada acontecia**.
   É exatamente o "não consigo efetivar um companheiro" relatado. Agora avisam e devolvem à tela,
   que explica a causa e o caminho.
5. **Fim do sucesso falso.** `declineCompanion` anunciava "Convite recusado" e `removeCompanion`
   anunciava "Parceria encerrada" **mesmo quando não encerravam nada** (registro não encontrado).
6. **O convite passa a ser carimbado com o registro da nuvem**, não com a cópia local: `de` e `deTs`
   saem de `eu` (participante encontrado no PG) e não de `mg`. A cópia local pode ter o nome com
   outra grafia — e vir sem `ts` num aparelho recuperado —, e aí quem recebe não casa o remetente.
   O mesmo critério passou a valer no "convite enviado ⏳" da tela do remetente.

**Testes de aceitação (todos aprovados).** Servidor local + `?teste=1`; `listarEscritasBloqueadas() == []`.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Bateria interna de regressão | **38 testes, zero falhas** |
| 2 | Caso exato do PG 27 (sem vínculo, `ST` intacto) | reconhece, acha o cadastro e abre o seletor |
| 3 | Mesmo nome com outra caixa | reconhece — e **não** se lista como candidato |
| 4 | Aparelho realmente anônimo | "Este aparelho ainda não reconhece você" + como resolver |
| 5 | PG fora desta versão | "Não encontramos o seu Pequeno Grupo" + `?v=2` |
| 6 | Cadastro não encontrado no PG | "Não encontramos o seu cadastro no grupo" |
| 7 | Aparelho normal, com vínculo | **inalterado** (`recuperadoDeST` não dispara) |
| 8 | `ST` com grupo mas sem nome | não inventa identidade — devolve vazio |
| 9 | Tela de erro em 375px | sem estouro horizontal |
| 10 | Convidar/aceitar/encerrar sem identidade | os três avisam — antes o botão era mudo |
| 11 | **Ida e volta completa**: aparelho recuperado convida → a outra pessoa vê, aceita | **companheiro efetivado**, convites pendentes zerados |
| 12 | Remetente com o nome em outra caixa | convite carimbado com o nome da nuvem; tela mostra "convite enviado ⏳" |


**Fato apurado na nuvem (27/08, 21h28):** em todo o PG 27, **nenhum** dos três participantes tem
qualquer campo de companheiro — nem `compConvites`, nem `compParceiro`. Nenhum convite chegou a ser
registrado. No app inteiro são 15 pessoas com companheiro efetivado e 7 convites pendentes; um
deles (PG 6) é uma pessoa convidando **a si mesma**, com o nome grafado de dois jeitos — o defeito
do item 3, capturado em produção.

**Remediação para quem já está nesse estado:** entrar por um **link de convite novo** —
`aceitarConvite` recupera o cadastro existente por nome + WhatsApp (IDENT-01) e recarimba o
`memberId`, sem duplicar pessoa.


## [2026-08-27] — Acesso livre aos 13 temas para os componentes do PG 47 "Diretoria"

**Mudança de exibição, isolada.** Não altera gravação, permissão, papéis, Firebase, convites nem
regra de negócio. Nenhum campo novo no grupo, nada gravado na nuvem, nada mudado na regra do
Firestore. Uma função nova (`temAcessoLivreAosTemas`), uma condição em `renderEncList` e uma classe
de CSS (`.badge-open`).

**A necessidade.** Os componentes do PG 47 "Diretoria" percorrem vários Pequenos Grupos, e cada PG
visitado está parado num tema diferente. O cadeado da tela de Encontros liberava só até o tema
seguinte ao progresso pessoal de cada um — o Coordenador do PG 47 tem 2 estudos concluídos, então
enxergava 3 dos 13 temas. Ao visitar um PG que está no tema 8, o material estava fechado para ele.

**A regra.** Quem tem inscrição no PG 47 abre os 13 Encontros em qualquer ordem. O app reconhece
pelo vínculo guardado no próprio aparelho e, como rede de segurança (vínculo limpo ou aparelho
novo), também por constar entre os participantes ativos do PG 47. Serão 4 inscritos: Cristian,
Leonardo, Wladimir e Ranieri — quem entrar depois passa a valer sozinho, sem nova alteração.

**O que NÃO muda.** Abrir um Encontro é só leitura: `openEncDetail` não conclui estudo, não dá XP e
não toca em `estudosConcluidos` — logo **não afeta IMD nem Ranking** de PG nenhum. A jornada pessoal
do próprio diretor continua em sequência: `openStudy` segue recusando índice adiante, porque a
contagem de "próximo estudo" assume que `ST.done` é contínuo. Os outros 42 grupos ficam idênticos.

**Testes de aceitação (todos aprovados).** Servidor local + `?teste=1` (modo isolado);
`listarEscritasBloqueadas() == []` ao final.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Bateria interna de regressão | **38 testes, zero falhas** (11 Fase 4 + 27 E1) |
| 2 | Participante comum, 2 estudos | 10 cadeados, 3 cartões clicáveis — **inalterado** |
| 3 | Inscrito no PG 47, 2 estudos | 0 cadeados, **13 clicáveis**, 10 badges "📖 Ler" |
| 4 | Inscrito no 47 + outro PG aberto, 0 estudos | 13 clicáveis — vale pela pessoa, não pelo PG à vista |
| 5 | Só na nuvem (vínculo local ausente) | rede de segurança casa por nome/memberId — 13 clicáveis |
| 6 | Removida do PG 47 | volta a **11 cadeados** — o acesso cai junto com a inscrição |
| 7 | Abrir o tema 8 estando no 3 | abre "Crescimento em Cristo" com os 6 blocos; `done` e XP intactos |
| 8 | Tela de celular (375px) | sem estouro horizontal |

**Limite conhecido:** a liberação mora no código, então só vale nos aparelhos que carregarem esta
versão. Quem estiver com build antiga em cache precisa recarregar (ou abrir com `?v=2`).


## [2026-08-27] — "📋 Copiar link" nos convites pendentes: saída para quando o WhatsApp não abre

**Mudança de exibição, isolada.** Não altera gravação, permissão, papéis, Firebase, geração de
convite nem regra de negócio. Uma função tocada (`renderMeusConvitesEnviados`), +14/−3 linhas.

**Achado de campo.** A Coordenadora do PG 50 (Nutrição, ADRIANE DOS SANTOS DA SILVA, tutor Uálace
Costa) não conseguia convidar colaboradores: ao tocar no botão, o celular abria a **página de
download do WhatsApp**. Entre 08h42 e 08h46 de 27/08 ela gerou **6 convites**, nenhum aceito.

**Diagnóstico — não era o app, e não era dado.** O PG 50 estava impecável (`papel`/`tipo` de
coordenador, `memberId` e WhatsApp válidos) e os convites **estavam sendo criados**. Duas outras
coordenadoras usaram o mesmo caminho na mesma versão na mesma manhã e **tiveram convites aceitos**
(Fabiana/PG 19: 4 gerados, 1 aceito · Sérgio/PG 22: 9 gerados, 2 aceitos). Ela ainda tentou 2 vezes
com o número preenchido — número válido, mesmo resultado. O que falhou foi o **celular dela entregar
o link ao aplicativo WhatsApp**; sem aplicativo para onde ir, o `wa.me` cai na própria página de
download.

**O buraco que isso revelou — este sim é nosso.** A lista "Convites pendentes que você enviou" só
oferecia **Revogar**. O convite existia, era válido, e **não havia nenhum caminho na tela até o
link**. A rede de segurança criada em 26/08 (`ofertarEnvioConvite`, que mostra o link) só aparece
quando `window.open` devolve `null` — e no caso dela a aba **abriu**, apenas foi parar no lugar
errado. Quarta causa distinta do sintoma "não consigo convidar".

**A correção.** Cada linha da lista ganhou um botão **📋 Copiar link**, ao lado do "Revogar". Mais
uma linha de orientação sob o título: *"Se o WhatsApp não abrir sozinho, copie o link aqui e envie
como preferir."* Reaproveita a função `copyLink()`, que já existia no código e **nunca era chamada**
— não foi criada função nova. Um único ponto conserta os dois caminhos (tela "Convidar" da Home e
Painel do Coordenador), porque ambos renderizam no mesmo `#meus-convites`.

**Testes de aceitação (todos aprovados).** Servidor local + `?teste=1` (modo isolado, sem leitura
nem escrita no Firebase — confirmado `listarEscritasBloqueadas() == []` ao final).

| # | Cenário | Resultado |
|---|---|---|
| 1 | Bateria interna de regressão | **38 testes, zero falhas** (11 Fase 4 + 27 E1/E2) |
| 2 | Lista com 3 convites pendentes | os 3 renderizam com os 2 botões |
| 3 | Amarração botão↔convite | cada botão leva o `inviteId` da **própria** linha; "Revogar" inalterado |
| 4 | Área de transferência **negada** pelo navegador | cai no plano B e mostra o link exato — nunca falha calado |
| 5 | Área de transferência disponível | copia o link certo + aviso "✅ Link copiado!" |
| 6 | Tela de celular (375px) | sem estouro horizontal; os botões **descem para a 2ª linha** em vez de espremer o texto |
| 7 | Separação dos botões | 9px de folga entre "Copiar link" e "Revogar" — sem risco de toque errado |

**Observação registrada (não corrigida):** os dois botões têm 25px de altura — abaixo dos 44px
recomendados para toque. O botão novo **copia a medida do "Revogar" que já existia**, de propósito,
para não introduzir inconsistência; aumentar os dois é decisão à parte.

## [2026-08-18] — Correção A: a sincronização deixa de apagar alterações que ainda não subiram

**Correção A, isolada.** Não altera telas, textos, ranking, IMD nem regra de negócio. Corrige uma
perda silenciosa de dados no caminho de **leitura** da nuvem — irmã do defeito de escrita corrigido
no commit `130d268`, no mesmo dia.

**Achado de campo.** O Coordenador do PG 4 (Multibênçãos) relatou que não conseguia registrar os
encontros do mês: o registro **aparecia na lista e depois sumia**. O `reunioesMes` do PG 4 estava
vazio na nuvem — nenhum encontro jamais chegou lá.

**A falha.** `registrarEncontroPg()` grava no aparelho, mostra o encontro na tela e dispara a
gravação na nuvem **sem esperar confirmação**. Se essa gravação falhasse — rede oscilando é o caso
comum no hospital — a alteração ficava só no aparelho, marcada como pendente **apenas em memória**.
A sincronização seguinte (poll de 30s, voltar do bloqueio de tela, reabrir o app) chamava
`applyGruposData(result.dados)` e regravava o `localStorage` com os dados **crus da nuvem**,
destruindo a alteração pendente. Sem erro, sem aviso, sem registro visível.

Ironia do caso: o app **já tinha** a função que junta os dois lados sem perder nada
(`mergeGruposData`, união por `id` em reuniões/gratidões/participantes) — ela era usada no caminho
de gravação e simplesmente não era usada no de leitura.

**A correção.** Princípio: *uma alteração local ainda não confirmada na nuvem nunca pode ser
apagada por uma leitura.*
- `fbPendingSync` passou a ser **persistido no aparelho** (`PENDING_SYNC_KEY`, com prefixo de teste),
  via `setFbPendingSync()` — antes era variável de memória, perdida ao fechar o app.
- `syncFromFirebase()` mescla com `mergeGruposData()` **quando há pendência**; sem pendência, o
  comportamento é o de sempre (a nuvem é a verdade, e renomeações feitas em outro aparelho chegam).
- O `localStorage` passa a receber o resultado **aplicado**, não `result.dados` cru — senão a
  alteração seria apagada uma linha depois de ter sido preservada.
- Na inicialização, havendo pendência guardada, o app **reenvia** — sem isso a alteração ficaria
  presa no aparelho para sempre (`fbRetryOnReconnect` só dispara ao reconectar ou ao voltar visível).

**Testes de aceitação (todos aprovados).** Executados sobre o código editado, com os **dados reais
de produção** carregados no aparelho de teste e a escrita para a nuvem bloqueada — verificado ao
final que o documento de produção continua sem nenhum vestígio dos testes.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Registrar encontro com a gravação na nuvem falhando, depois sincronizar | encontro **sobrevive** na tela e no aparelho (antes: sumia) |
| 2 | Três sincronizações seguidas com pendência aberta | 1 encontro — não duplica, não perde |
| 3 | Conteúdo que a gravação enviaria | leva o encontro e os 50 PGs |
| 4 | Nuvem finalmente aceita a gravação | pendência limpa, marca removida do aparelho |
| 5 | Sem pendência, PG renomeado em outro aparelho | nome novo chega normalmente (sem regressão) |


## [2026-08-18] — Correção B: o envio para a nuvem deixa de ser invisível

**Correção B, isolada**, aprovada na sequência da Correção A e publicada junto. Única mudança
visual: um aviso novo no cartão "Frequência do Pequeno Grupo", dentro do Relatório Mensal.

**O que faltava.** A Correção A garante que a alteração **não se perde** — fica guardada e o app
reenvia sozinho. Mas o app continuava anunciando "salvo" antes de a nuvem confirmar, e o usuário
não tinha como distinguir um registro já seguro de um que ainda depende de reenvio.

**A correção.**
- `saveGruposToFirebase()` passou a **devolver** se a nuvem confirmou (`true`) ou não (`false`).
  Antes não devolvia nada — era por isso que a tela não tinha como saber. Aditivo: nenhum chamador
  anterior lê o retorno.
- **Todo caminho sem confirmação marca pendência**, não só a queda de rede (`sizeExceeded`,
  resposta inesperada e as 3 tentativas esgotadas por conflito passaram a marcar). Sem a marca, a
  alteração ficaria desprotegida contra a sincronização e o aviso mentiria ao prometer reenvio.
- `registrarEncontroPg()` e `removerEncontroPg()` viraram assíncronas: redesenham a lista na hora
  (o dado já está no aparelho, o botão nunca trava) e depois exibem o estado real do envio —
  *⏳ Enviando para a nuvem…* → *✓ Enviado e guardado na nuvem* ou *⚠️ Alteração salva neste
  aparelho, mas ainda não enviada… ele reenvia sozinho*. Texto neutro de propósito: serve aos dois.
- Reabrir o Relatório Mensal com pendência aberta **já mostra o aviso**, e `fbRetryOnReconnect()`
  troca para "enviado" no instante em que a nuvem aceita, sem recarregar a tela.

**Testes de aceitação (todos aprovados),** mesma bancada da Correção A — dados reais do PG 4,
escrita para a nuvem bloqueada, produção verificada intacta ao final.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Registrar com a nuvem falhando | "⏳ Enviando" → aviso âmbar "ainda não enviada"; encontro na lista; pendência marcada |
| 2 | Registrar com a nuvem aceitando | "✓ Enviado e guardado na nuvem"; pendência limpa |
| 3 | Reabrir o Relatório Mensal com pendência aberta | aviso âmbar já visível |
| 4 | Reenvio automático consegue subir | aviso na tela vira "✓ enviado" sozinho |
| 5 | Apagar um encontro com a nuvem falhando | mesmo aviso (redação neutra) |
| 6 | Data futura / fora do mês | segue recusando com a mensagem de erro de sempre (sem regressão) |
| 7 | Regressão da Correção A: sincronizar com pendência | 2 encontros → 2 (nada apagado) |

**Não entrou.** O aviso cobre o Relatório Mensal, que é onde o defeito foi relatado. As demais
gravações do app (mural, inscrição, missões) seguem sem confirmação visível — mesma dívida, outro
escopo.



## [2026-08-18] — Correção de segurança de persistência: fim da escrita destrutiva por desconhecimento

**Mudança A, isolada.** Não altera capacidade (segue com 50 slots), não altera ranking, IMD, telas
ou regra de negócio. Corrige uma vulnerabilidade de gravação encontrada ao dimensionar a futura
expansão de slots.

**A falha.** A gravação envia a lista local inteira por cima do campo `dados` da nuvem. Um aparelho
rodando versão antiga (que conhece só os PGs 1–50) lia um documento com PGs 1–70, descartava os
51–70 em `applyGruposData` (`idx < 0 → return`) e, na gravação seguinte, regravava só os 50 que
conhecia — **apagando 20 PGs reais da nuvem**, sem erro e sem aviso. Comprovado em teste sobre o
código em produção: payload de 50 PGs, 20 perdidos.

**A correção.** Princípio: *um registro que existe na nuvem nunca pode ser substituído por ausência
de conhecimento local.*
- `registrarGruposDesconhecidos()` guarda **intactos** (sem interpretar, sem mesclar, sem exibir) os
  PGs lidos da nuvem que não têm correspondente local; `fbGruposPreservados` só cresce.
- `trySaveGrupos()` devolve esses registros no payload, ordenado por `num`.
- **Validação pré-gravação:** se algum PG já visto na nuvem sumiria do payload, a gravação é
  **cancelada** (`perdaDetectada`), a alteração fica pendente e o caso vai para o log local de
  conflitos. Perder uma gravação é recuperável; perder um PG da nuvem não é.

Guardar sem absorver é deliberado: incorporar os PGs desconhecidos à lista ativa mudaria ranking,
relatórios e a fila de criação de PG numa versão que não foi feita para eles.

**Testes de aceitação (todos aprovados).**

| # | Cenário | Resultado |
|---|---|---|
| T1 | Versão corrigida conhece 1–50 · nuvem tem 1–70 · grava | payload com 70, nenhum perdido, dado do PG 51 preservado byte a byte |
| T2 | Versão conhece 1–70 · nuvem tem 1–70 · grava | payload com 70, sem perdas nem duplicatas |
| T3 | Versão conhece 1–70 · nuvem tem só 1–50 · grava | payload com 70, sem duplicatas |
| T4 | Situação de hoje: 50 slots · nuvem 50 | payload com 50, nada preservado, nada duplicado — sem efeito colateral |

**Dívida registrada:** DIV-001 em `ARQ-004` — a causa raiz é o modelo "minha lista inteira substitui
a da nuvem"; a direção-alvo é escrita por delta. Fora do escopo desta correção.

## [2026-08-17] — Embaixadores da Esperança (Agosto): revisão editorial da experiência, nos dois apps

Revisão **editorial e narrativa** da experiência digital de Agosto, conforme especificação
fechada pelo Capelão em 17/08. **Não é reconstrução técnica:** nenhuma função de persistência
foi tocada — `confirmarEmbaixadores()`, o campo `p.embaixadores[AAAA-MM]`, o Relatório Mensal,
o IMD e o ranking continuam exatamente como estavam.

**Princípio da revisão:** não tornar a experiência mais explicativa; torná-la mais inevitável.

**Inversão das etapas 3 e 4.** A ordem passa a ser mundo → rótulos → **espelho → entrega** →
forças → missão → participação/envio → retorno. A razão é pedagógica: o espelho produz o
diagnóstico ANTES da pergunta espiritual, e a entrega passa a se referir à dificuldade que a
pessoa acabou de nomear, em vez de vir antes dela, no vazio.

**Tela a tela:**

- **Tela 2 (rótulos):** os 9 rótulos permanecem — o alvo é o mecanismo da rotulação, não a
  característica. Botão final passa de "E AGORA?" para **"E SE VOCÊ TAMBÉM FIZER ISSO?"**.
- **Tela 3 (O espelho):** entram "Foi fácil perceber os rótulos que colocamos nos outros." /
  "Mas e quando o rótulo está nas nossas próprias atitudes?" / "Agora é a sua vez de olhar
  para o espelho.". Saem "Não pense primeiro naquilo que o outro precisa mudar. / Pense em
  você.". As 8 alternativas e a trava do CONTINUAR seguem iguais.
- **Tela 4 (A entrega):** etiqueta passa de "A pergunta" para **"A ENTREGA"**. Entram "Você
  acabou de reconhecer uma dificuldade que existe em você." / "Reconhecer é um começo. Mas
  transformação exige entrega.". Saem "E se o problema não estiver apenas no mundo lá fora?" e
  "O que existe em mim que precisa ser transformado?". A pergunta destacada a Deus permanece —
  é o coração espiritual da experiência. Botão passa a ser **"DESCOBRIR UMA FORÇA"**.
- **Tela 7 (participação e envio), sem tela nova:** bloco PARTICIPAÇÃO com "Sua participação
  termina aqui." + o registro; depois o bloco **O ENVIO** — "Mas a jornada não termina aqui." /
  "A missão que você recebeu começa quando você sair desta tela." / "Você não precisa mudar o
  mundo inteiro. / Pode começar por uma pessoa." / **"A esperança começa quando eu encontro o
  outro."**, fechando o arco que abre no acolhimento com "A esperança começa em mim." (mesmo
  tratamento visual: serifada dourada sobre navy).
- **Mantido:** "Confirmar não depende de você já ter realizado a missão." — é regra de negócio
  e precisa ficar junto do ato de confirmar.
- **Removida** da experiência a frase sobre relatório/Coordenador/supervisão/gerência,
  inclusive do estado "já registrado" (é institucional, não narrativa). Consequência aceita: a
  experiência deixa de explicar para onde vai a participação.

**Regra do bloco de envio por estado da tela 7:** aparece para *confirmou agora*, *já
registrado*, *vínculo perdido* e *sem PG*; **não** aparece para quem ainda pode confirmar e
toca "Concluir" (saída voluntária). Ninguém termina a experiência numa mensagem de erro, e o
envio nunca fica condicionado ao registro institucional — por isso existe inclusive para quem
não tem onde registrar.

**Aplicada nos DOIS arquivos publicáveis** — `index.html` (app dos PGs) e
`embaixadores-agosto.html` (app dos Embaixadores externos, criado em `9a17841`). Os dois têm
cópias independentes das mesmas telas: não há código compartilhado, e alterar um não altera o
outro. Toda revisão futura da experiência precisa ser feita duas vezes.

**Decisões tomadas na implementação (aprovadas pelo usuário), não previstas na especificação:**
- o bloco do envio entra DEPOIS do resumo "Suas escolhas de hoje", para que a última linha
  lida seja o fecho do arco;
- saíram por redundância "Você concluiu a experiência de agosto." (PGs) e "Você chegou ao fim
  da jornada deste mês." (externo) — ambas repetiam "Sua participação termina aqui.";
- **mantidas** as menções ao Coordenador nos estados "vínculo perdido" e "sem PG": são
  instruções de como conseguir participar, não a explicação de para onde vai a participação.

**Testado** (cópias dos dois apps com o modo de teste forçado, **zero chamadas ao Firestore**
confirmadas na aba de rede; no app externo o registro saiu como "gravação simulada"):
- sequência percorrida do acolhimento à entrega nos dois apps: 0 acolhimento → 1 O MUNDO →
  2 O PROBLEMA (3 momentos) → **3 O ESPELHO → 4 A ENTREGA**;
- rótulos dos botões nas duas versões: "E SE VOCÊ TAMBÉM FIZER ISSO?" e "DESCOBRIR UMA FORÇA";
- CONTINUAR do espelho: bloqueado sem escolha, liberado depois dela;
- bloco do envio nos quatro estados da tela 7 — aparece em três, ausente em "pode registrar";
- frase de relatório/supervisão/gerência ausente em todos os estados;
- "Confirmar não depende de você já ter realizado a missão." presente junto do botão.

## [2026-08-17] — Correção: Relatório Mensal não registrava encontros (relatado no PG Multibênçãos)

**Defeito relatado:** o coordenador do PG Multibênçãos abria o Relatório Mensal, escolhia a
data, informava o número de participantes, tocava em "+ Registrar encontro" — e a tela não
reagia de forma nenhuma. Nenhum aviso, nenhum registro.

**Causa (duas peças que se combinavam):**

1. `abrirRelatoriosMensais` oferecia **6 meses fixos** para escolher (em agosto/2026: Agosto,
   Julho, Junho, Maio, Abril e Março), mas `filtrarReunioesMes` **descarta** todo mês anterior
   a `REUNIOES_MES_INICIO` (`'2026-07'`) a cada leitura dos dados — inclusive na releitura que
   acontece logo depois de registrar. Um encontro lançado em junho ou antes era criado e
   apagado no mesmo instante.
2. `registrarEncontroPg` desistia **em silêncio** em todos os casos de recusa (data ausente,
   fora do mês, no futuro, participantes em branco) — três `return` sem mensagem nenhuma.
   Sem eles, não havia como o coordenador descobrir o motivo.

**Correções:**

- A lista de meses passa a oferecer só os meses que o app realmente guarda (`mk >=
  REUNIOES_MES_INICIO`). Nenhuma regra de dados foi alterada — a trava de julho/2026, que
  existe porque os meses anteriores eram de teste, continua valendo.
- `mostrarErroEncontro(monthKey, texto)` (nova) + campo `#freq-erro-<mês>` abaixo do botão:
  faixa discreta que explica a recusa ("Escolha a data do encontro.", "A data precisa estar
  entre … e …", "Informe quantos participantes vieram ao encontro."). Some sozinha no
  registro seguinte que der certo. Guarda de fundo para `monthKey` anterior a julho/2026,
  caso uma tela aberta antes da correção chegue até a função.

**Segunda correção, achada durante o teste — data pelo relógio de Londres:**
`limitesEncontroMes` usava `new Date().toISOString().slice(0,10)`, que devolve a data **UTC**.
No Brasil (UTC-3), a partir das 21h o "hoje" do app já era o dia seguinte: o campo "Data do
encontro" abria preenchido com **amanhã** e aceitava esse dia como válido — encontro gravado
na data errada. Nova função `dataLocalISO(d)` lê dia/mês/ano do relógio local, sem conversão;
`limitesEncontroMes` passa a usá-la nas duas pontas (último dia do mês e hoje).
Não foi alterado o mesmo padrão em `isObstacleActionDoneToday`/`doObstacleAction` (missão
diária dos obstáculos) — são consistentes entre si e ficam para uma decisão à parte.

**Testado** (cópia do app com o modo de teste forçado, **zero chamadas ao Firestore**
confirmadas na aba de rede):
- lista de meses: antes `2026-08 … 2026-03`; agora só `2026-08` e `2026-07`;
- encontro gravado em junho, após `filtrarReunioesMes`: lista vazia — reprodução exata do
  defeito relatado;
- as quatro mensagens de recusa aparecem com o texto certo e somem após um registro válido;
- registro válido (14/08, 4 de 6 presentes) aparece na lista e **sobrevive ao
  recarregamento dos dados** — que era onde o registro sumia;
- às 21h51 do dia 17: método antigo dizia `2026-08-18`, `dataLocalISO()` diz `2026-08-17`;
  o campo abre em 17/08 e recusa 18/08.

**Junção com o trabalho vindo do outro computador:** esta correção foi aplicada sobre os
commits `60b3b51` (selo do mês + título maior no cartão dos Embaixadores) e `9a17841`
(`embaixadores-agosto.html`, app dos Embaixadores externos). O conflito no cartão foi
resolvido mantendo o bloco navy "COMEÇAR A JORNADA" (que já traz o selo do mês desenhado
para fundo escuro) e preservando a alteração do outro PC no estado "já registrado".
Verificado depois da junção: um único botão "COMEÇAR A JORNADA", selo "AGOSTO" presente,
nenhum resto do antigo "Confirmar participação" no cartão.

## [2026-07-27] — RC4.8.3B (2ª redefinição): Painel único de Indicadores por Setor + correção de meta do Embaixadores

Funde os dois blocos irmãos (Cobertura Setorial + Embaixadores da Esperança) num único
painel "📈 Indicadores por Setor" — para cada setor acompanhado, o coordenador vê os dois
indicadores juntos (um setor por vez, em vez de um módulo por vez), cada um com barra de
progresso visual.

**`renderPainelIndicadoresPorSetor`** substitui `renderSetoresSection` +
`renderEmbaixadoresPgSection` (removida, absorvida na nova função) — mesmos dois motores de
cálculo (`calcularCoberturaSetorial`, `calcularEmbaixadoresPorSetor`), nenhuma fórmula
alterada, só a apresentação. Mantém intactos os controles de gestão do setor (↑↓✎🗑️,
"➕ Adicionar setor") e o link para editar participantes externos.

**Correção de meta encontrada durante a implementação:** o Embaixadores usava os mesmos
limiares da Cobertura Setorial (🟢≥40%/🟡30–39%), mas a meta institucional confirmada na
RC4.8.5A é 20% — sob os limiares antigos, 25% seria 🔴, contradizendo o próprio exemplo dado
para este painel (25% → 🟢). Corrigido com `EMBAIXADORES_META_PCT = 20` (nova constante
nomeada, junto de `PG_COBERTURA_META_PCT = 40`), faixa 🟡 proporcional (75% da meta, ≥15%).
**A faixa 🟡 do Embaixadores é uma suposição desta RC** — só a meta de 20% foi confirmada
explicitamente; sinalizado para revisão se incorreta.

**Testado:** painel renderizando corretamente com dois setores (RH 50%🟢/15%🟡, Jurídico
0%🔴/0%🔴); barras de progresso com cor correspondente ao status; editar externos a partir
do novo painel continua funcionando e retornando à tela do próprio PG; exemplo do usuário
(25% → 🟢 no Embaixadores) reproduzido exatamente após a correção de meta.

**Registrado, não implementado:** abstração futura `IndicadorSetorial` unificando os dois
cálculos — deliberadamente adiada até existir um segundo consumidor real (Painel ADV-E,
RC4.8.4), mesmo raciocínio já aplicado à RC4.9.

## [2026-07-27] — RC4.8.3B (redefinição): Embaixadores migra para dentro do PG; painel institucional vira consulta

Correção de arquitetura, achada em revisão antes da interface de Cobertura Setorial: a tela
institucional do Embaixadores (RC4.8.5A) obrigava o coordenador a sair do seu PG e navegar
por uma lista de **todos** os setores da instituição — a maioria irrelevante para ele — só
para lançar um número do seu próprio contexto.

**Princípio adotado:** toda informação nasce no PG; toda consolidação nasce no Painel ADV-E.

**Nível operacional (novo):** `renderEmbaixadoresPgSection`, dentro de
`renderTutorGrupoDetalhe` — bloco irmão da Cobertura Setorial, mesmos setores acompanhados
pelo PG (`g.setores`). Mostra Cobertura PG e Embaixadores lado a lado por setor; tocar no
percentual do Embaixadores abre o detalhamento (`iniciarEditarEmbaixadoresPg`) com
participantes de PG, campo de externos e percentual — sem sair da tela do PG.

**Nível institucional (simplificado):** `renderEmbaixadoresInstitucional` perdeu todo campo
editável — vira consolidação só leitura por setor (colaboradores, participantes de PG,
externos, total, cobertura). O detalhamento por PG dentro de cada setor fica para a RC4.8.4
(Painel ADV-E).

**Refatoração:** `confirmarParticipantesExternos` virou `salvarParticipantesExternos`
(validação + persistência pura, sem decidir o que renderizar) + `confirmarParticipantesExternosPg`
(wrapper usado pelo novo nível operacional). `EMBAIXADORES_EXTERNOS` continua sendo dado
institucional por `{setorId, monthKey}` — se dois PGs acompanham o mesmo setor, ambos
leem/gravam o mesmo registro, mesmo editando de dentro de PGs diferentes.

**Testado:** bloco operacional exibido corretamente dentro do PG "Manancial" (Cobertura PG e
Embaixadores por setor); editar externos a partir do PG retorna para a tela do próprio PG
(nunca para a institucional); tela institucional confirmada sem nenhum input ou botão de
salvar; valor gravado num PG aparece corretamente consolidado na tela institucional.

**Documentação:** `ARCHITECTURE.md` atualizado — nota de redefinição no ADR-002, seção de
componente reescrita com os dois níveis de uso, Roadmap RC4.8.3B renomeado para "Painel
Operacional do Coordenador do PG".

## [2026-07-27] — RC4.8.5A: Participação Institucional no Embaixadores da Esperança (homologada)

Introduz o indicador institucional do Embaixadores da Esperança por setor (participantes do
PG + externos informados manualmente ÷ efetivo do setor, meta 20%) e corrige um invariante do
sistema que a primeira versão desta RC violava.

**Painel institucional (cross-PG):** nova tela `renderEmbaixadoresInstitucional`, mesmo
portão de acesso do Ranking dos PGs (qualquer Tutor/Coordenador). Para cada setor, por mês:
colaboradores do setor, participantes do PG (automático), participantes externos (campo
editável), total e cobertura com status 🟢/🟡/🔴.

**`EMBAIXADORES_EXTERNOS`** — estrutura isolada e deliberadamente simples: só
`{setorId, monthKey, participantesExternos}`, nunca nome, nunca histórico individual, sem
nenhuma referência a `PEQUENOS_GRUPOS` — uma futura evolução (Cadastro Institucional de
Colaboradores) pode substituir esta quantidade manual sem migração desta estrutura (ver
ADR-002 no `ARCHITECTURE.md`). Sincronizada como campo de topo próprio
(`embaixadoresExternos`).

**Validação:** quantidade de externos nunca negativa, sempre inteira (achado e corrigido
durante o teste: um valor decimal como "2.7" estava sendo truncado silenciosamente em vez de
rejeitado), e nunca deixa o total ultrapassar o efetivo do setor — mensagem explica o máximo
permitido e o porquê.

**Correção de arquitetura (achada em revisão, antes da homologação final):** a primeira
versão do cálculo (`calcularEmbaixadoresPorSetor`) cruzava participantes de **todos** os PGs
com cada setor, sem checar se aquele setor está entre os setores que o **próprio PG do
participante** declara acompanhar (`g.setores`) — um participante de um setor não
acompanhado pelo seu PG inflaria indevidamente o indicador de outro setor. Corrigido extraindo
um invariante único, `participanteContaParaSetor(g, p, setorId)`, agora usado tanto por
`calcularEmbaixadoresPorSetor` quanto por `calcularCoberturaSetorial` — nenhuma função nova,
presente ou futura, deve reimplementar esse cruzamento.

**Duas proteções de consistência adicionadas:**
- Atribuir a um participante um setor fora dos acompanhados pelo PG exige confirmação
  explícita, que já propõe incluir o setor na lista de acompanhados.
- Remover um setor acompanhado é bloqueado enquanto existir participante do PG vinculado a
  ele — mensagem informa quantos participantes e pede para realocá-los antes.

**Esclarecimento de nomenclatura (sem mudança de código):** `g.setores` não representa "os
setores que o PG tem" — representa **setores acompanhados pelo PG**, uma decisão ministerial
do coordenador, válida mesmo com 0 participantes (é assim que o ADV-E consegue ver um setor-alvo
ainda sem nenhum matriculado, em vez de ele simplesmente não aparecer).

**Testado:** cenário completo com PG "Manancial" acompanhando RH/DP/Jurídico/NCP — João/Maria
(RH) e Carlos (Jurídico) contam corretamente; Ana (Enfermagem, setor não acompanhado por
Manancial) corretamente excluída de todos os indicadores, mesmo participando do evento.
Fluxo de sugestão testado nos dois caminhos (aceitar adiciona o setor às acompanhados;
cancelar não altera nada). Proteção de exclusão testada (bloqueia com 2 participantes
vinculados; permite com 0).

**Documentação:** `ARCHITECTURE.md` atualizado — "Setores Acompanhados pelo PG" e
"Participantes do PG" registrados como responsabilidades distintas do Cadastro Mestre e do
Efetivo Institucional (agora quatro componentes, não três); novo componente "Participação
Institucional no Embaixadores da Esperança"; ADR-002 completo (problema, alternativas,
decisão, consequências, limitações).

**Pendente para produção:** adicionar `embaixadoresExternos` (além de `setoresMestre` e
`setoresEfetivo`, já pendentes da RC4.8.2A) na allowlist da regra do Firestore
(`hasOnly([...])`).

## [2026-07-27] — RC4.8.2A: Cadastro Mestre de Setores + Efetivo Institucional (homologada)

Reestrutura a base de dados da Cobertura Setorial (RC4.8.2) em três responsabilidades
separadas, evitando que o mesmo defeito de identificação por nome já corrigido na RC-REST-02
(tutor/coordenador) se repetisse para setores institucionais.

**Cadastro Mestre de Setores** (`SETORES_MESTRE`) — só identidade: `setorId` (estável, nunca
reaproveitado), `nome` (só exibição, nunca usado como referência) e `ativo`. Campo
`departamentoPaiId` reservado para agrupamento futuro por grande área (Assistência,
Administrativo, Apoio etc.) — sem nenhuma tela ou regra usando-o ainda.

**Efetivo Institucional dos Setores** (`SETORES_EFETIVO`) — componente compartilhado (não
exclusivo de PG ou do ADV-E): `totalColaboradores`/`atualizadoEm` como "ponteiro atual", mais
um `historico[]` **append-only** — editar o total nunca sobrescreve uma entrada anterior,
sempre empilha um registro novo (`registroId, setorId, totalColaboradores, atualizadoEm,
origem, usuario, observacao`).

**Cobertura Setorial** (`calcularCoberturaSetorial`) — continua 100% calculada ao vivo, nunca
persistida, mesmo padrão do `getPgIMD`. Passou a ler o total de colaboradores do Efetivo em
vez do antigo objeto local ao PG.

**Migração:** `migrarSetoresParaMestre()` — idempotente, converte o formato antigo da
RC4.8.2 (setor como objeto local ao PG) para o novo modelo, remapeando o `setorId` de cada
participante já atribuído, sem perder nenhuma atribuição.

**Testado:** limites exatos de classificação (29%🔴/30%🟡/39%🟡/40%🟢), total zero sem
divisão por zero, referência órfã descartada sem quebrar a tela, deduplicação por nome,
exclusão de participante removido, reaproveitamento do mesmo setor por dois PGs diferentes
(mesmo total institucional, matriculados contados independentemente), edição do total
preservando o histórico anterior, migração rodada duas vezes sem duplicar.

**Documentação:** `ARCHITECTURE.md` atualizado com a descrição dos três componentes, o
ADR-001 (problema, alternativas consideradas, decisão, consequências, limitações) e a
decisão de postergar a RC4.9 (Motor Institucional de Relatórios) até existirem pelo menos
dois relatórios concretos implementados.

**Pendente para produção:** adicionar `setoresMestre` e `setoresEfetivo` na allowlist da
regra do Firestore (`hasOnly([...])`) — sem isso, a sincronização entre aparelhos desses
dois campos falha silenciosamente (mesmo padrão de bug já visto com `convites`).

## [2026-07-24] — RC-REST-02: Correção de identificação de Tutor/Coordenador por nome abreviado

Corrige a identificação de tutor/coordenador quando existem grafias abreviadas e completas do
mesmo nome, restaurando a visualização correta dos grupos sem alterar persistência, Firestore,
IMD, Ranking ou gamificação.

**Causa raiz (achada por auditoria, RC-AUD-01 a RC-AUD-04):** `getGruposDoResponsavel(nome)`
comparava o nome do login com `g.tutor`/`g.coordenador` por igualdade exata de string. Dois
grupos reais tinham o tutor gravado como `"Renan"` (nome curto) enquanto a credencial de login
usa o nome completo `"Renan Fernando Castro Silva"` — a comparação falhava e os grupos 5 e 9
ficavam invisíveis no Painel do Tutor, mesmo intactos no Firestore (confirmado por leitura direta
da nuvem). O mesmo padrão afetava Felipe Rodrigues da Silva, coordenador do grupo 9 gravado como
só `"Felipe"` — ele não via **nenhum** grupo antes desta correção.

**Correção:** nova função `nomesCorrespondem(a, b)` — aceita igualdade exata (comportamento de
sempre) ou prefixo de palavra inteira em qualquer direção (`"renan"` casa com `"renan fernando
castro silva"`; `"ana"` **não** casa com `"mariana"`, evita colisão por substring solta). Usada
só dentro de `getGruposDoResponsavel`.

**Validado com dado real de produção (RC-REST-02/03, só leitura):** comparação par a par de
todos os 5 nomes de tutor e 22 nomes de coordenador distintos hoje na base — zero falso positivo
entre pessoas diferentes; as únicas duas correspondências encontradas são a mesma pessoa em duas
grafias. Nenhum dos 4 tutores da allowlist passou a ver grupo que não fosse seu (checado
individualmente). Felipe passa a ver `[9, 23]` (antes: nenhum); Renan passa a ver `[5, 9]` a mais
(grupo 9 com 4 participantes reais confirmados intactos); Uálace e Wladimir inalterados.

**Limitação conhecida (não bloqueia esta RC, registrada para acompanhamento):** a estratégia de
comparação por prefixo depende da premissa "não existem duas pessoas distintas com o mesmo
primeiro nome" — testado com o cenário sintético `"João"` vs `"João Pedro"` vs `"João Paulo"`:
`nomesCorrespondem` casaria `"João"` com os dois, mesmo sendo pessoas diferentes. Não ocorre hoje
(verificado contra os 27 nomes reais distintos da base), mas pode voltar a acontecer conforme o
número de tutores/coordenadores crescer. A migração para identificadores estáveis
(`memberId`/WhatsApp/UID), com nome virando só campo de exibição, permanece registrada como
melhoria arquitetural futura — ver `ESTADO-E-ROADMAP.md`, "RC4 — Identidade Canônica dos
Responsáveis".

**Não alterado:** Firestore, `saveGrupos`/`saveGruposToFirebase`/`trySaveGrupos` (persistência),
`getPgIMD`/`getPgIMDv2`/`classificarPgs`/`classificarPgsV2` (IMD/Ranking), XP, gamificação —
confirmado por diff (mudança confinada a 1 função nova + 2 linhas dentro de
`getGruposDoResponsavel`).

## [2026-07-23] — RC3.5.5: Entrada em produção do IMD v2, remoção da comparação visual

Só interface — nenhuma fórmula, peso, limiar ou estrutura de dado do IMD foi alterada.

**Removido da tela:** cards "IMD atual x IMD novo (v2)" e "Diferença" (função
`renderPgRankingCardsV2Diagnostico` apagada do código); aviso "🔧 Modo diagnóstico: comparando
o modelo atual com o novo modelo". Onde existia "IMD novo (v2)"/"IMD atual"/"modelo atual" na
tela, agora existe só **"IMD"**.

**Preservado (painel de diagnóstico do Tutor/Coordenador):** aviso de Fase de Implantação, Taxa
de Conversão, PGs com Evidência de Engajamento, Média de Indicadores, tabela de distribuição dos
7 indicadores, categorias do IMD (Não Engajado/Baixo/Moderado/Engajado/Altamente Engajado).

**Novo motor de classificação exclusivo do v2:** `classificarPgsV2()` +
`compararPgsParaRankingV2()` — o rank/percentual/desempate mostrados agora vêm só do v2 (antes,
mesmo no modo diagnóstico, vinham do motor antigo por baixo). `FB_FLAGS.imdV2Diagnostico`
renomeada para `FB_FLAGS.imdV2` — `false` faz rollback de contingência completo pro motor antigo
(`getPgIMD`/`classificarPgs`, preservados intocados no código, sem tela chamando-os por padrão);
remoção definitiva prevista para o encerramento da RC3.6.

**Bug encontrado e corrigido antes do commit:** `contarPgsComEvidenciaV2` ainda lia o nome de
campo do extinto modo diagnóstico (`v2Capilaridade`) — o novo motor usa `capilaridadeScore`,
então o indicador "PGs com Evidência de Engajamento" mostrava 0 pra qualquer dado. Corrigido;
retestado com produção, bate com a linha de base já registrada (4 de 37).

**Testado:** preview local + dado real de produção (só leitura) — 37 PGs renderizando sem erro de
console; confirmado por busca no código que nenhuma referência a v2/atual/antigo/diagnóstico
sobrevive na tela; rollback verificado funcionalmente (motor antigo chamado isoladamente, mesmos
resultados de sempre).

## [2026-07-23] — RC3.5.3/RC3.5.4: Novo IMD v2 com Capilaridade, diagnóstico comparativo e Fase de Implantação

Precedido de auditoria (RC3.5.1) e proposta arquitetural (RC3.5.2/RC3.5.2A) — ver `ARCHITECTURE.md`
para o histórico completo de decisões. Só design/documentação até a RC3.5.2A; esta entrada cobre o
código da RC3.5.3 (implementação) e RC3.5.4 (indicadores de homologação operacional).

**Motivação:** auditoria encontrou que o IMD atual mede majoritariamente volume/médias por
participante e metas fixas do grupo (não normalizadas pelo nº de participantes) — permitindo a
poucos participantes muito ativos elevarem artificialmente o IMD, e penalizando o PG por crescer.

**Implementado (RC3.5.3):**
- Motor `getPgIMDv2`/`classificarPgsV2Diagnostico` — novo modelo por **Capilaridade Discipular**
  (% de participantes elegíveis com evidência de engajamento; nenhuma outra dimensão compensa
  capilaridade baixa), Engajamento Coletivo, Profundidade Discipular, Missão Coletiva e
  Regularidade. Convive com o motor antigo 100% intocado (`getPgIMD`/`classificarPgs`), sob
  `FB_FLAGS.imdV2Diagnostico` — modo de dupla avaliação para homologação segura.
- "Participante Ativo" → **"Participante com Evidência de Engajamento"** (renomeado durante a
  implementação, achado real: nem "semana atual" nem "sem limite" se sustentavam com o dado
  existente) = elegível (não removido, ≥7 dias de registro via `p.ts`) e com ≥3 dos 7 indicadores
  (estudo/oração/bondade/gratidão/missão semanal/streak/Embaixadores).
- Classificação por gate fixo (Altamente Engajado/Engajado/Moderado/Baixo/Não Engajado) — a
  categoria nunca ultrapassa o que Capilaridade+Regularidade permitem, mesmo com IMD numérico alto.
- Painel de diagnóstico no ranking do Tutor: cards lado a lado (IMD atual x novo + diferença +
  categoria) e tabela de distribuição dos 7 indicadores por PG.
- Aviso de **Fase 1 — Implantação** (`faseImplantacaoIMDv2`, referência Marco Zero 2026-07-05,
  muda sozinho para Fase 2 a partir do dia 60) — evita que a distribuição baixa inicial pareça
  defeito, quando reflete só um app muito recente.

**Implementado (RC3.5.4 — indicadores de homologação operacional, sem mudança de algoritmo):**
`calcularTaxaConversaoV2` (Taxa de Conversão para Evidência de Engajamento — KPI principal da Fase
1), `contarPgsComEvidenciaV2` (nº de PGs com pelo menos 1 participante engajado) e
`calcularMediaIndicadoresV2` (profundidade média de indicadores por participante elegível) —
exibidos no topo do painel diagnóstico. Linha de base registrada em 23/07/2026: 38 elegíveis, 6
com evidência (16% de conversão), 4 de 37 PGs com evidência, média 1,3/7 indicadores.

**Homologação parcial (decisão do usuário):** arquitetura/algoritmo/Capilaridade/regra dos 3
indicadores homologados tecnicamente; limiares numéricos de classificação ficam como linha de
base até o fim da Fase 1 (critérios objetivos de encerramento registrados no `ARCHITECTURE.md`).

**Testado:** no preview (servidor estático local + dado real de produção via leitura, sem nenhuma
escrita) — 37 PGs renderizando sem erro de console; cards de diagnóstico, tabela de distribuição e
os 5 indicadores conferidos visualmente (screenshot). Não testado ao vivo dentro do Painel do Tutor
real (exigiria autenticação de Tutor/Coordenador).

**Reservado para o futuro (RC3.6, não implementado):** `lastActivityAt` por participante —
permitirá trocar "Evidência de Engajamento" por uma janela móvel real (últimos 30 dias) e medir
trajetória (quem evoluiu, quais PGs cresceram/estagnaram), não só a fotografia do momento atual.

## [2026-07-23] — Correção: IA bíblica falando em nome da denominação + referência ao app errado

**Relato do usuário:** a IA do chat bíblico (`sendAI`/`systemPrompt`, `index.html` ~linha 2681)
respondia enquadrando o ensino como posição oficial da Igreja Adventista do Sétimo Dia (IASD), o
que pode soar excludente para participantes do PG que não são adventistas — a doutrina é bíblica,
então a IA deve apresentá-la como "o que a Bíblia ensina", não "a posição da denominação".

**Achado adicional durante a investigação:** o `systemPrompt` também se identificava como
assistente oficial do aplicativo **"Aos Pés do Mestre Jesus"** — nome do OUTRO produto da
Capelania (app de discipulado individual, repo `jornada-discipular`), com a lista de estudos
copiada de lá também. Confirmado com o usuário que é vestígio de cópia entre os dois apps
(histórico Git compartilhado) e corrigido para a identidade real deste app.

**Correção:**
- Identificação do assistente corrigida para "Jornada Discipular em Pequenos Grupos" (não mais
  "Aos Pés do Mestre Jesus"); lista de estudos corrigida para os 13 estudos reais deste app.
- Nova regra explícita no topo do prompt ("REGRA DE OURO"): toda resposta doutrinária deve ser
  apresentada como ensino bíblico ("o que a Bíblia ensina"), nunca como "a posição adventista" ou
  "segundo a IASD" — com uma exceção clara: perguntas que são especificamente SOBRE a denominação
  (história, organização, "isso é seita?", administração de dízimos) continuam respondidas
  nomeando a IASD, porque aí a pergunta é sobre a instituição, não sobre doutrina bíblica.
- A seção "FUNDAMENTO — TEMAS-CHAVE COMO ENSINO BÍBLICO" (que já pedia isso só para uma lista
  específica de temas) não foi removida — a nova regra geral a reforça, sem contradizê-la.

**Testado:** no preview (servidor estático local), app carrega sem erros de console. A correção é
só no texto de instrução da IA (`systemPrompt`); não foi possível testar a resposta real da IA
neste ambiente (sem chamar o serviço de IA em produção).

## [2026-07-23] — C3: Tombstone transitório na remoção de participantes

Item do roadmap técnico (`ESTADO-E-ROADMAP.md`), precedido de Mapa de Impacto + ADR aprovados
pelo usuário antes do código.

**Problema resolvido:** `removerDoGrupoAtual()` apagava o participante da lista na hora
(`filter`). No merge (`mergeGruposData`), um aparelho com cache local desatualizado (ainda com o
participante removido por outro aparelho) o ressuscitava, porque o código não sabia diferenciar
"participante novo, ainda não sincronizado" de "participante removido, ainda não sincronizado".

**Mudança:** participante removido agora vira `removed:true` + `updatedAt` (carimbo no topo do
registro, separado de `progresso.updatedAt`) em vez de ser apagado. No merge, quando o mesmo
participante existe nos dois lados, vence quem tem o toque mais recente — seja uma remoção ou uma
edição de progresso — usando `Math.max(updatedAt, progresso.updatedAt)` de cada lado. Nova função
`podarParticipantesRemovidos()` (espelha `podarGratidoesExpiradas`) apaga o registro de vez do
documento 30 dias depois da remoção; `participantesAtivos(g)` filtra os removidos em todos os
pontos de exibição/contagem (painel do tutor, ranking IMD/Índice de Maturidade Discipular, tela de
inscrição, card de progresso do PG — ~10 pontos ao todo).

**Compatibilidade:** registros antigos sem `removed`/`updatedAt` continuam válidos (tratados como
não removidos / carimbo zero) — sem script de migração. Comportamento inteiro controlado por
`FB_FLAGS.useTombstone` (já existia como flag reservada, `true` por padrão) — desligar essa flag
volta ao comportamento antigo (apaga na hora, sem tombstone) em 1 linha, mesmo padrão de rollback
do Commit 1.

**Testado:** no preview (servidor estático local, sem tocar Firebase de produção) — página carrega
sem erros de console; testes de lógica isolados no console do navegador confirmam: participante
removido some da lista ativa mas dado antigo sem os campos novos continua aparecendo; tombstone de
31 dias é podado enquanto um de 1 dia é mantido; remoção mais recente vence sobre progresso
desatualizado local e vice-versa (edição mais recente vence sobre remoção antiga).

## [2026-07-19] — Correção: tela do Companheiro de Jornada abrindo em branco

**Relato do usuário:** ao acessar o app, a tela "Companheiro de Jornada" abria (título aparecia)
mas o conteúdo ficava completamente em branco, sem nenhuma mensagem — reproduzido com uma captura
de tela do próprio usuário (console sem erros).

**Causa:** em `renderCompanionSelector()` (`index.html`, função declarada perto da linha 5835),
havia uma checagem de segurança (`if (!mg || !g || !eu)`) para o caso do app não conseguir achar o
registro do participante dentro dos dados do grupo (ex.: tela aberta enquanto a sincronização com o
Firebase ainda está em andamento). O comentário do próprio código já dizia que esse caso era "raro,
sem mensagem visível" — na prática, é esse caminho que gera a tela em branco relatada.

**Correção:** no lugar de `el.innerHTML = ''`, agora mostra a mensagem "Não foi possível carregar
seus dados agora" com um botão "🔄 Tentar novamente" que chama `renderCompanionScreen()` de novo.
Nenhuma outra tela, regra de negócio ou dado foi alterado.

**Testado:** reproduzido o cenário de participante não encontrado em ambiente local (servidor
estático); confirmado que antes da correção a tela ficava em branco e depois da correção mostra a
mensagem e o botão, sem erros no console.

## [2026-07-16/17] — Ranqueamento Saudável entre PGs, Registro de Encontros, Lembrete ao PG, Trio no Companheiro de Jornada

Feito diretamente pelo usuário (18 commits, fora do processo usual de Mapa de Impacto →
aprovação → implementação); registrado retroativamente neste `CHANGELOG.md` e no
`ESTADO-E-ROADMAP.md` em 2026-07-18, por leitura completa dos 18 diffs (o bloco de Ranqueamento
já tinha documentação própria, homologada, em `ARCHITECTURE.md`).

- **Novo — Ranqueamento Saudável entre PGs (Painel do Tutor/Coordenador, somente leitura):**
  bloco maior do lote (5 commits, 16/07 entre 16h11 e 17h18). Introduz um Índice de Maturidade
  Discipular (`pgIMD`) por grupo — 5 dimensões (Comunhão, Relacionamento, Missão, Crescimento,
  Fidelidade) calculadas só a partir de dado real já existente no app — e um motor de
  classificação (`classificarPgs()`) que ordena os PGs por esse índice, com critério de desempate
  fixo (nunca sorteio) e ranking no padrão esportivo (`1, 2, 2, 4`). Exclusivo para Tutor/
  Coordenador; participante não vê. Documentação arquitetural completa (motivação, camadas,
  decisões, invariantes, roadmap dos próximos épicos) em `ARCHITECTURE.md` (novo arquivo,
  versão `v3.4a.1-homologado`) — ver esse documento para detalhe técnico; aqui só o resumo.
- **Mudança de regra — Registro de encontros do PG substitui a pergunta Sim/Não:** a versão
  original desta rodada trocou "o PG se reuniu esse mês?" por um contador (0/1/2/3/4+), mas
  ainda no mesmo dia foi substituída de novo por um registro por encontro individual (data +
  quantos participantes vieram), com lista dos encontros do mês e opção de remover um registro
  errado. O relatório mensal passou a mostrar um medidor visual (barra "meta vs. realizado", meta
  sempre 100%) em vez de só o número, tanto para presença quanto para participação nos
  Embaixadores da Esperança. A tabela linha-a-linha de quem participou dos Embaixadores foi
  removida do relatório (ficou só a contagem) — link entre esse ajuste e o de cima: os dois
  mexem na tela de Relatórios Mensais no mesmo lote. `filtrarReunioesMes()` descarta qualquer
  registro anterior a julho/2026 (dado de teste), aplicado tanto ao carregar quanto ao mesclar
  dados vindos da nuvem.
- **Novo — Lembrete de reunião por WhatsApp (Painel do Tutor/Coordenador):** a tela de detalhe de
  cada PG passou a mostrar o dia/horário cadastrado da reunião, com destaque amarelo na véspera
  ("📅 Amanhã tem encontro do PG!"). A versão final envia um lembrete individual por participante
  (usa o WhatsApp que a pessoa já informou ao entrar no PG, marca "✓ Enviado" ao tocar) — descartou
  a primeira versão, que abria um único link genérico do WhatsApp sem contato fixo.
- **Novo — LGPD e participação voluntária:** aviso fixo no Painel do Discípulo (abaixo de
  "Crescimento cristão") explicando que os dados (nome, progresso espiritual, WhatsApp) só são
  usados para o funcionamento do PG/Capelania, em conformidade com a LGPD, e que a participação é
  voluntária — participar do PG implica aceitar essas condições.
- **Novo — Trio no Companheiro de Jornada:** quando o PG tem número ÍMPAR de participantes, a
  pessoa que sobraria sozinha agora pode se juntar a uma dupla já formada, virando um trio (nunca
  mais que isso, e nunca quando o grupo tem número par). `compParceiro` passou de objeto único
  para lista (até 2), com normalização para dados antigos gravados no formato de objeto único;
  orar/contato semanal passaram a ser rastreados por companheiro (`CP.perCompanion`), não mais um
  estado único por pessoa.
- **Novo — Painel do Tutor/Coordenador, gestão da liderança do PG:** editar dia/horário de
  reunião direto do painel (antes só existia no cadastro inicial); Coordenador pode sair da
  função (libera a vaga para o Tutor convidar substituto); Tutor pode transferir a tutoria para
  outro nome já autorizado na allowlist (sem digitação livre).
- **Ajustes de texto e visual:** enunciado da missão de visita entre PGs revisado de novo (mesma
  linha do lote de 07-13/14, agora incluindo agosto/setembro); botão "🔄 Atualizar" da Home maior;
  botão "Painel do Tutor/Coordenador" com gradiente teal em vez de navy; botões "estudos
  anteriores" e "instalar app" recoloridos e reposicionados na tela de convite; corrigido bug em
  `toggleSection()` que dependia da posição exata do elemento seguinte no HTML.
- **Não verificado nesta revisão retroativa:** nenhum destes pontos foi testado ao vivo nem no
  preview por este assistente (revisão só por leitura de diff, sem execução) — diferente das
  entradas anteriores deste changelog, que tiveram passo de teste em preview. Se surgir algum
  comportamento inesperado num desses fluxos, comparar primeiro com o diff real antes de assumir
  bug de outra causa.

---

## [2026-07-13/14] — Correções de campo + nova página "Desafios do Discipulado"

Feito diretamente pelo usuário (9 commits, a maioria via sessões do assistente com mensagens de
commit detalhadas); revisado por leitura completa dos diffs em 2026-07-14, sem achado que
contradiga as mensagens dos commits. Registrado retroativamente neste `CHANGELOG.md` e no
`ESTADO-E-ROADMAP.md`.

- **Correção de bug (concorrência ao criar PG):** `confirmarCriarPg()` agora espera (`await`) a
  gravação do novo grupo chegar na nuvem antes de gerar o convite do Coordenador — antes, uma
  leitura da nuvem logo em seguida podia reverter o nome do grupo localmente e o convite saía com
  dados de outro Pequeno Grupo (achado de campo). `saveGrupos()` passou a retornar a Promise da
  gravação.
- **Correção de bug (senha do Tutor sensível a maiúsculas):** a senha do Painel do Tutor/
  Coordenador era indexada pelo nome exatamente como digitado; uma variação de capitalização (ex.:
  teclado do celular) fazia o app pedir senha nova, repetidamente. Nome agora é normalizado
  (trim + minúsculas) antes de guardar/consultar a senha.
- **Correção de bug (dados desatualizados ao reabrir pelo atalho):** reabrir o app pelo atalho do
  celular só atualizava a nuvem se a tela "Grupos" estivesse aberta — Mural e Companheiro de
  Jornada ficavam com dados velhos até um toque manual em "Atualizar". Agora atualiza sempre que o
  app volta a ficar visível.
- **Novo — login do Tutor persistente:** o Painel do Tutor/Coordenador não pede nome/WhatsApp/senha
  de novo a cada visita no mesmo aparelho; "🚪 Sair" continua disponível para encerrar a sessão.
- **Novo — editar nome do grupo:** botão "✎ Editar nome do grupo" no Painel do Tutor/Coordenador
  (achado de campo: nome digitado errado na criação, sem forma de corrigir).
- **Novo — expiração do Mural:** gratidões e pedidos de oração são apagados 7 dias após a
  publicação, evitando acúmulo permanente no documento compartilhado da nuvem.
- **Reorganização — nova página "🏆 Desafios do Discipulado":** reúne Jornada de Conquistas,
  Missões (Pequeno Grupo + Embaixadores da Esperança) e Obstáculos Espirituais, que antes ficavam
  espalhados entre Home, Painel do Discípulo e Companheiro de Jornada. As 2 missões semanais dos
  Embaixadores viraram botões de 15 XP (antes eram só texto no Companheiro). Card duplicado "Minha
  missão desta semana" removido do Companheiro de Jornada.
- **Ajuste de texto:** missão de visitar outro Pequeno Grupo reformulada para deixar claro que é
  uma delegação representando o PG, não a visita de todo o grupo.

---

## [2026-07-10] — BUG-TUTORES-CONVITES: gravações comuns apagavam a allowlist de Tutores e os convites

Achado durante a homologação real (Grupo CAPELANIA já em uso pelos 4 capelães): pedidos de oração
e gratidões pararam de aparecer no aparelho do Tutor, e o Companheiro de Jornada passou a dizer que
ele não pertencia ao grupo. Investigação levou a um bug bem mais sério, sem relação direta com o
sintoma relatado.

- **Causa raiz:** `fbWriteGrupos()` grava no Firestore via `PATCH` sem `updateMask` — sem essa
  máscara, o Firestore **substitui o documento inteiro pelos campos enviados**, apagando qualquer
  campo omitido. `trySaveGrupos()` (usada por toda ação comum: gratidão, oração, missão,
  Embaixadores, progresso etc.) nunca reenviava a lista de convites, e só reenviava a allowlist de
  `tutores` se ela já estivesse carregada na memória do aparelho no momento da gravação — o que nem
  sempre acontece. Resultado: **qualquer ação comum de qualquer participante apagava o campo
  `convites` da nuvem**, e a allowlist de `tutores` podia ser apagada da mesma forma, sem chance de
  se autorrecuperar (nada mais no app repovoa `tutores` a não ser uma leitura bem-sucedida da
  própria nuvem).
- **Confirmado por leitura direta da produção (2026-07-10):** o campo `tutores` estava
  **completamente ausente** do documento `jdpg/grupos` — qualquer tentativa de acesso `?tutor` por
  um dos 4 capelães num aparelho novo teria sido recusada por falta de allowlist. `dados` (grupos e
  participantes) estava intacto — o mural sumido era um problema separado, só no aparelho do Tutor
  (vínculo local perdido, provavelmente por `?resetar`/limpeza de cache depois de já ter entrado
  como participante — resolvido pelo próprio Tutor reentrando com nome+WhatsApp iguais, sem
  necessidade de mudança de código).
- **Correção:** `fbWriteGrupos()` agora monta `updateMask.fieldPaths` só com os campos realmente
  incluídos na gravação (`dados`+`ts` sempre; `tutores`/`convites` só quando fornecidos). Uma
  gravação que não inclui `tutores`/`convites` agora **deixa esses campos como estão na nuvem**, em
  vez de apagá-los — corrige a causa raiz de uma vez, sem depender de nenhuma função individual
  "lembrar" de reenviar esses campos.
- **Testado (preview, `fetch` interceptado para inspecionar a URL/corpo da gravação sem tocar
  produção):** gravação sem `tutores`/`convites` → máscara só com `dados`+`ts` · gravação com os
  dois → máscara com os 4 campos · nenhuma mudança de assinatura de função, todos os chamadores
  existentes (`trySaveGrupos`, `commitConviteChange`, laço de retentativa de concorrência,
  `salvarFbConfig`) continuam compatíveis.
- **Restauração de dados (produção, com autorização explícita do usuário):** backup do estado
  anterior salvo em `PRE-RESTAURACAO-TUTORES-2026-07-10.json`
  (`C:\Users\wladimir.souza\Documents\backups-firebase-jdpg\`); gravação de **um único campo**
  (`updateMask.fieldPaths=tutores`) com pré-condição de concorrência (`currentDocument.updateTime`
  fresco), confirmada por releitura: os 4 capelães (Felipe Rodrigues, Ualace Bruno, Renan Castro,
  Wladimir Gonçalves) restaurados; `dados` e `convites` confirmados intocados pela gravação.

---

## [2026-07-10] — Corrige "Cancelar minha inscrição" para limpar o vínculo local (achado de campo)

Bug já documentado no roadmap ("Achado de campo — deadlock", ainda não resolvido) — corrigido nesta
sessão a pedido do usuário, separado do `BUG-TUTORES-CONVITES` acima.

- **Causa raiz:** `removerDoGrupoAtual()` só limpava a chave antiga (`MEU_GRUPO_KEY`), nunca o
  registro em `Meus Vínculos` (sistema de identidade atual, `FB_FLAGS.identidadeUuid`). Depois de
  "Cancelar minha inscrição", o aparelho continuava achando que pertencia ao grupo — quebrando
  Comunidade, Companheiro e Progresso — e um sync de outro aparelho com cópia desatualizada podia
  "ressuscitar" a pessoa na lista de participantes, bloqueando uma nova inscrição com "já inscrita".
- **Correção:** nova função `removeVinculo(grupoNum)` remove o vínculo daquele grupo da lista
  `Meus Vínculos`; `removerDoGrupoAtual()` passou a chamá-la.
- **Testado (preview, rede neutralizada, dados fictícios):** antes de cancelar, vínculo e "meu
  grupo" apontavam certos; depois de cancelar, vínculo removido, `loadMeuGrupo()` retorna vazio,
  participante removido do grupo, tela avança corretamente para "Convite necessário" (em vez de
  ficar presa num estado inconsistente). Console limpo, nenhuma escrita real ao Firebase.

---

## [2026-07-09] — Painel do Discípulo, Relatórios Mensais e Embaixadores da Esperança recorrente

Feito diretamente pelo usuário (10 commits em 09/07, fora do processo usual de Mapa de Impacto →
aprovação → implementação); revisado, confirmado com o usuário e testado no preview em 2026-07-10
(rede neutralizada, nenhuma escrita real ao Firebase). Registrado retroativamente neste
`CHANGELOG.md` e no `ESTADO-E-ROADMAP.md`.

- **Relatórios Mensais (novo, Painel do Tutor):** tela de seleção de mês + Pequeno Grupo
  (`abrirRelatoriosMensais`) que gera um relatório (`gerarRelatorioMensal`) com a frequência do PG
  no mês e a participação de cada integrante nos Embaixadores da Esperança, com botão para enviar
  o texto pronto por WhatsApp (`enviarRelatorioWhatsApp`/`montarTextoRelatorioMensal`).
- **Frequência do PG (novo):** campo `g.reunioesMes` (`{'2026-07': {aconteceu, marcadoPor, data}}`),
  sincronizado com o Firebase pelo mesmo caminho de sempre (`saveGrupos`/`trySaveGrupos`) — com
  merge por chave de mês (`mergeGruposData`), igual ao padrão já usado para `gratidoes`.
- **Embaixadores da Esperança — redesenhado (mudança de regra de negócio):** antes eram 3
  "campanhas" fixas (julho/agosto/setembro) dentro do sistema de Campanhas, com progresso só local
  no aparelho (nunca chegava ao Tutor). Agora é um evento recorrente mensal, registrado no próprio
  participante (`p.embaixadores[monthKey]`, via `confirmarEmbaixadores()`), sincronizado de
  verdade e visível no Relatório Mensal. As 3 entradas antigas (`embaixadores_jul/ago/set`) foram
  removidas de `PG_CAMPANHAS` — confirmado que não deixou nenhuma referência quebrada em
  `renderCampanhasTutor`.
- **Correção de bug pré-existente:** a missão "Escolher seu Tutor de Jornada" checava
  `ST.tutor !== undefined`, mas `ST.tutor` nunca era definido em lugar nenhum do código — a missão
  nunca podia ser concluída. Agora checa se a pessoa já entrou num Pequeno Grupo (`loadMeuGrupo()`).
- **Reorganização da Home → "Painel do Discípulo":** o card fixo de sequência (streak) no topo da
  Home foi removido. Atributos espirituais (renomeados "Crescimento cristão"), Obstáculos Vencidos,
  Diário Espiritual e Companheiro de Jornada saíram da Home e passaram a viver dentro do "Painel do
  Discípulo" (antigo "Meu progresso", renomeado). **O Mapa de Discipulado (gráfico radar em SVG) foi
  removido, não apenas movido** — confirmado com o usuário que foi intencional.
  `openJournal()`/`openCompanion()` agora recebem a origem (`'home'`/`'panel'`) para que o botão
  "Voltar" retorne ao lugar certo (`journalBack()`/`companionBack()`) — testado nos dois sentidos.
- **Botão "🔄 Atualizar" (novo):** círculo no canto superior direito da Home
  (`forcarAtualizacaoApp()`) força recarregar com parâmetro anticache — útil para quem instalou o
  app na tela inicial do iPhone, onde o gesto de "puxar para atualizar" é instável.
- **Botão de instalar o app também na tela de convite** (`renderTelaConvite`) — antes só existia
  dentro da Home.
- **Ajuste de permissão do botão "Convidar":** agora distingue "tem vínculo real de participante
  como tutor/coordenador" (`souGerenteDoGrupo`) de "está autenticado no Painel via allowlist"
  (`souTutorAutenticado`) — o botão Convidar (que depende de `loadMeuGrupo()`) só aparece para quem
  tem vínculo de fato, evitando oferecer uma ação que falharia para um Tutor sem participante.
- **Anti-duplicação de identidade do Tutor/Coordenador (`DEDUP-01`):** se o WhatsApp digitado ao
  criar a senha já pertence a um Tutor/Coordenador cadastrado em qualquer grupo, o sistema
  converge para o nome já existente em vez de criar um nome novo por variação de digitação.
- **Testado no preview (2026-07-10, rede neutralizada — `fbReadDoc`/`syncFromFirebase`/
  `saveGruposToFirebase`/`fbWriteGrupos`/`trySaveGrupos` mockados, dados fictícios, sem reload):**
  Home sem o card de streak antigo · Painel do Discípulo mostra Crescimento cristão/Obstáculos/
  estudos realizados, sem o Radar · Diário e Companheiro abertos a partir do Painel voltam para o
  Painel (não para a Home) · Relatórios Mensais gera corretamente, marca frequência do PG e monta o
  texto de WhatsApp · Confirmar participação nos Embaixadores soma XP e atualiza o relatório do
  Tutor · Painel da Comunidade abre sem erro · console limpo em todas as telas · nenhuma escrita
  real disparada ao Firebase.
- **Não testado neste preview (risco baixo, mecanismo simples):** clique real no botão "🔄
  Atualizar" (recarregaria a página e reconectaria à nuvem de produção — evitado de propósito) e o
  fluxo completo de criação de senha do Tutor com `DEDUP-01` (lógica revisada por leitura de
  código, não exercitada ao vivo).

---

## [2026-07-03] — UX-02: oculta becos sem saída da Home para Colaborador

Item 7 da RC2 (permissões e interface por papel). Diagnóstico ao vivo confirmou que Tutor
administrativo puro e Coordenador já estavam corretos; o achado real foi na Home.

- `renderShareArea()` mostrava "Convidar amigo" (`openShare()`) e "Painel do Tutor/Coordenador"
  (`openTutorPanel()`) igual para Coordenador e Colaborador — para Colaborador os dois eram becos
  sem saída ("apenas o Coordenador pode convidar" / "acesso restrito").
- Os 2 botões agora só renderizam quando `getMinhaFuncaoNoGrupo() === 'tutor' || 'coordenador'`
  (inclui o tutor legado-participante, mantido por compatibilidade nesta fase de fechamento da
  RC2 — decisão explícita, não é bug). Para Colaborador/sem grupo, só "Meu progresso" aparece.
- "Convidar amigo" renomeado para "Convidar Participante".
- Nenhuma mudança de autorização ou de modelo de dados — só visibilidade condicional na Home.
- Testado: Colaborador vê só "Meu progresso" · Coordenador vê os 2 botões normalmente · Tutor
  legado-participante preservado · console limpo · nenhuma escrita real ao Firebase.

---

## [2026-07-03] — FUNC-02d: remove o formulário de autocadastro em renderInscricaoBody (FUNC-02 concluído)

Quarta e última sub-etapa do `FUNC-02` (remoção física do legado de autocadastro). Com esta etapa,
o `FUNC-02` está inteiramente concluído.

- Removido o ramo `!jaInscrito` de `renderInscricaoBody()` (o formulário completo de
  autocadastro) + `confirmarInscricao()`/`mostrarErroInsc()`/`atualizarPreviewFlamula()`/
  `renderGrupoPreviewWelcome()`/`renderRecuperarIdentidadeModal()`/`recuperarIdentidade()` +
  variável órfã `status`.
- **Achado adicional durante a limpeza:** `selecionarTipo()` — zero chamadores em todo o arquivo,
  referenciava IDs inexistentes no HTML atual. Removida junto (mesmo cluster morto).
- **Bug introduzido e corrigido no mesmo turno:** ao remover o ramo morto, faltou uma chave de
  fechamento (fechava só o `if`, não a função) — pego pelo teste imediato no preview antes de
  qualquer regressão, corrigido na hora.
- Mantidas intocadas (compartilhadas com o aceite de convite real): `getMeuGrupoAtivo`,
  `renderTrocaDeGrupoModal`, `buscarCadastroExistente`, `renderIdentidadeRecuperadaModal`,
  `startJourney`, `getGrupoStatus`, `getProximoGrupoVazio`, `isGrupoAcessivel`.
- Testado: cadeia completa por convite, tela do próprio grupo, bloqueio de grupo alheio/vazio,
  **recuperação de identidade em aparelho novo** (ponta a ponta, incluindo o modal), console
  limpo, nenhuma escrita real ao Firebase.

---

## [2026-07-03] — FUNC-02c: remove screen-grupos (grade legada) e funções órfãs

Terceira sub-etapa do `FUNC-02` (remoção física do legado de autocadastro).

- Removida a `screen-grupos` inteira (grade dos 50 Pequenos Grupos) + `renderGrupoList()`/
  `filterGrupos()`.
- **Achado real durante a limpeza:** `salvarFbConfig()` (tela de configuração inicial do Firebase)
  chamava `renderGrupoList()` diretamente — ficaria quebrada com uma referência inexistente.
  Chamada removida. Um segundo resíduo equivalente dentro do poller `startFbPoll` também foi
  limpo, embora já fosse inalcançável.
- `renderGrupoSyncBadge()`/`isGrupoAcessivel()`/`getGrupoStatus()`/`getProximoGrupoVazio()` não
  foram tocadas — usadas por fluxos legítimos (`ATIVACAO-01`) ou já protegidas contra elemento
  ausente.
- Testado: cadeia completa por convite, bloqueio de grupo vazio/alheio via `openInscricao`, tela
  do próprio grupo intacta, console limpo.

---

## [2026-07-03] — FUNC-02b: remove screen-welcome e funções órfãs

Segunda sub-etapa do `FUNC-02` (remoção física do legado de autocadastro).

- Removida a `screen-welcome` inteira (123 linhas) + `selectProfile()`/`prefillWelcomeForm()`/
  `renderWelcomeLevelBadge()` — zero chamador restante desde o `FUNC-02a`.
- Achado durante a limpeza: `renderGrupoBarWelcome()` e o ramo em `initGrupos()` que a chamava
  também só existiam para essa tela — removidos junto (mesma origem, risco zero).
- `instalarApp()`/`mostrarInstrucoesInstalacao()` não foram tocadas (já vivem na Home desde o
  `FUNC-02a`).
- CSS órfão (`#screen-welcome .profile-opt` etc.) deixado de propósito — cosmético, sem risco.
- Testado: visitante novo sem convite cai em "Convite necessário" sem erro · cadeia completa por
  convite (Tutor→Coordenador→Colaborador) · botão de instalar na Home · tela do próprio grupo
  intacta · `getProximoGrupoVazio()` intacta (`ATIVACAO-01`) · console limpo.

---

## [2026-07-03] — FUNC-02a: move "Instalar na Tela Inicial" para a Home

Primeira sub-etapa do `FUNC-02` (remoção física do legado de autocadastro). Diagnóstico completo
identificou que `instalarApp()`/`mostrarInstrucoesInstalacao()` (prompt de instalação PWA) é
funcionalidade real, mas seu único botão vivia dentro do `screen-welcome`, já morto — apagar a
tela sem mover o botão perderia essa função.

- Novo `<div id="h-install-area">` na Home + `renderInstallArea()` (chamada em `renderHome()`),
  botão discreto e em área própria, não misturado com as ações de Tutor/Coordenador/Participante.
- `instalarApp()`/`mostrarInstrucoesInstalacao()` não foram alteradas.
- Botão removido de `screen-welcome` (o resto da tela continua intacto, aguardando `FUNC-02b`).
- Testado: botão aparece na Home, clique mostra instruções corretamente, console limpo.

---

## [2026-07-03] — RC2: item 5 concluído + UX-LEGACY-01 (remove acesso à tela antiga de escolha de papel)

Diagnóstico do item 5 da RC2 (fluxo do Participante/Colaborador): a arquitetura de convites já
entregava tudo o que era esperado, sem código novo. Único achado: a tela legada `screen-welcome`
(Passo 2 com "Serei o Tutor"/"Serei o Coordenador"/"Colaborador") continuava alcançável por 2
botões — "← Voltar" no cabeçalho da Home e "Trocar" na tela do próprio grupo.

- **Não era um `BLOCKER`** — confirmado ao vivo que escolher "Serei o Tutor" só seta
  `ST.userProfile`, que não é lido por nenhum caminho ativo (o único consumidor,
  `confirmarInscricao`, já foi bloqueado pelo `BLOCKER-01`). Mas contradizia a arquitetura da RC2 e
  confundia o usuário oferecendo uma escolha que não fazia nada.
- **Correção (`UX-LEGACY-01`):** removidos os 2 botões que levavam a `showScreen('welcome')` — o
  da Home e o da tela do grupo. Nenhuma função/tela removida fisicamente (fica para o `FUNC-02`).
- Testado: Colaborador e Coordenador sem caminho para a tela antiga · Tutor mantém acesso ao painel
  dedicado (`?tutor`) · cadeia completa por convite continua funcionando · console limpo.

---

## [2026-07-03] — BLOCKER-01: fecha caminhos legados de escalonamento de autoridade sem convite

Achado durante a auditoria de campo do item 4B da RC2: a tela legada do autocadastro antigo
(`screen-inscricao`/`openInscricao`) continuava alcançável pela Home normal, com dois vetores que
contornavam por completo a arquitetura de convites da RC2.

- **Vetor 1 (escalonamento de autoridade):** os botões "Trocar" de Tutor/Coordenador chamavam
  `iniciarTrocaPapel()`/`confirmarTrocaPapel()`, que gravavam `g.tutor`/`g.coordenador` a partir de
  texto livre — sem allowlist, sem convite, sem checar autoridade. Reproduzido ao vivo: um
  Colaborador conseguia se autonomear Tutor do próprio PG.
- **Vetor 2 (reabertura do autocadastro):** um botão "Trocar" reabria a grade completa dos 50 PGs
  (`showScreen('grupos'); renderGrupoList()`), sem passar pelo `openGrupos()` já neutralizado pelo
  `BLOCKER-001`. De lá, dava para entrar num grupo vazio ou de terceiros e cair no formulário
  completo do autocadastro antigo (`confirmarInscricao`).
- **Correção:** `openInscricao(num)` agora exige `loadMeuGrupo()?.grupoNum === num` antes de
  qualquer coisa — caso contrário mostra "Convite necessário" (mesma tela do `openGrupos()`). Os 2
  botões de troca de papel foram removidos; `iniciarTrocaPapel`/`confirmarTrocaPapel` foram
  removidas do código (sem outro caller). O botão que reabria a grade foi removido dos 2 lugares
  onde existia. `cancelarTrocaPapel()` foi mantida — é reaproveitada pelo cancelar da troca de
  reunião, que não mexe em autoridade.
- **Fora do escopo, intacto:** troca de dia/horário de reunião, visualização informativa do grupo,
  sair do próprio grupo (`cancelarInscricao`) — nenhum desses altera autoridade de terceiros.
- Testado com as 4 funções de rede neutralizadas (incluindo `fbWriteGrupos`): Colaborador e
  Coordenador não veem mais os botões de troca de papel · acesso a grupo vazio ou de terceiros cai
  em "Convite necessário" · cadeia completa Tutor→Coordenador→Colaborador por convite continua
  funcionando de ponta a ponta · troca de reunião funcionando · console limpo.

---

## [2026-07-03] — RC2: botão permanente para (re)convidar o Coordenador (item 4A)

Primeira parte do item 4 da RC2 ("Adequar o fluxo do Coordenador"). Fecha um buraco operacional
registrado na Etapa 3 (`ARCH-03`): se o Tutor saísse da tela de sucesso/falha do convite
automático sem completar o envio, não havia mais nenhum lugar no app para gerar esse convite
depois.

- `renderTutorGrupoDetalhe(grupoNum, nome)`: nova variável `souTutorDesteGrupo` (nome autenticado
  no painel bate com `g.tutor` deste grupo específico). Quando `!g.coordenador &&
  souTutorDesteGrupo`, mostra o botão "🤝 Convidar Coordenador".
- Botão reaproveita `gerarConvidarCoordenadorAutoEExibir()` sem nenhum código novo de convite —
  mesma reaproveitação de convite pendente e mesmas telas de sucesso/falha já testadas na Etapa 3.
- **Gate de UI é só cosmético:** a autoridade real já é checada no backend
  (`gerarConvite`/`souTutorAdminDoGrupo`); o botão só evita oferecer uma ação que sempre falharia
  para quem é Coordenador (não Tutor) do mesmo grupo.
- Testado: botão aparece só para o Tutor do grupo sem Coordenador · some quando o Coordenador já
  está definido · some quando a pessoa logada é a Coordenadora (não a Tutora) do grupo · clique
  gera o convite e mostra a tela de sucesso normalmente · console limpo.

---

## [2026-07-02] — RC2: convite automático do Coordenador ao criar o PG (ARCH-03)

Etapa 3 da RC2. Resolve a identidade dupla de "quem é o Tutor" que impedia um Tutor puro-admin
(sem registro de participante, criado na Etapa 2) de gerar o convite do Coordenador.

- `gerarConvite()` (branch `coordenador`): aceita autoridade por 2 vias — participante papel
  `'tutor'` (legado, intocado) ou nova `souTutorAdminDoGrupo()` (`ST.tutorPanelAuth` bate com
  `g.tutor`). `deNome` do convite usa o nome canônico do Tutor quando só a via admin autoriza.
- `validarConviteParaAceite()`: contrapartida obrigatória no lado do aceite, mesma lógica de 2
  vias — sem ela, o convite seria gerado mas nunca poderia ser aceito. Fluxo de `colaborador`
  (emitido por Coordenador) não foi tocado.
- `getMinhaFuncaoNoGrupo()` **não foi alterada** — evita qualquer risco no fluxo comum
  (`openShare()`, usado por Colaborador/Coordenador via Home).
- Nenhum Tutor artificial criado em `participantes[]`.
- Convite do Coordenador agora é gerado **automaticamente** logo após criar o PG
  (`confirmarCriarPg` → `gerarConvidarCoordenadorAutoEExibir`) — verifica convite pendente
  existente antes (não duplica), mostra link pronto + WhatsApp em caso de sucesso, e uma tela
  própria com botão de tentar novamente em caso de falha (nunca silenciosa).
- **Limitação documentada:** autoridade administrativa usa nome canônico, não ID estável —
  melhoria futura é migrar para um identificador da allowlist.
- Testado: geração via admin, aceite completo pelo Coordenador, reaproveitamento de convite
  pendente, falha simulada + retry, fluxo legado (participante) sem regressão.

---

## [2026-07-02] — RC2: criação de Pequenos Grupos pelo Tutor (ATIVACAO-01)

Etapa 2 da RC2. Um Tutor autenticado pela allowlist (Etapa 1, `ARCH-02`) já pode criar Pequenos
Grupos de verdade, sem reativar nenhum autocadastro.

- `renderCriarPgForm()` + `confirmarCriarPg()` — nome do grupo (obrigatório), dia/horário
  (opcionais); usa `getProximoGrupoVazio()` (já existente, reaproveitada) para achar o próximo dos
  50 slots fixos ainda livre; grava com `saveGrupos()`, herdando de graça a trava de concorrência
  já testada (precondição + retry) — nenhum código novo de concorrência.
- Estado sem grupos → "➕ Criar Primeiro Pequeno Grupo"; estado com 1+ grupos → lista normal +
  "➕ Criar outro Pequeno Grupo", **só visível para quem é Tutor de pelo menos um deles** — um
  Coordenador autenticado no mesmo painel nunca cria grupo.
- Uma única função de criação para os dois estados — sem duplicar fluxo.
- Placeholder da Etapa 1 (`abrirCriarPrimeiroPg`/`alert`) removido.
- **Fora do escopo, registrado como pendência (`ARCH-03`):** convite automático do Coordenador ao
  criar o grupo — depende de resolver antes uma inconsistência entre duas checagens de "quem é
  Tutor" (`g.tutor` string vs. lista de `participantes`), usadas por partes diferentes do app.
- Testado: criação com zero grupos, criação de um segundo grupo, bloqueio correto para
  Coordenador, console limpo.

---

## [2026-07-02] — RC2: acesso administrativo do Tutor independente de grupo/dispositivo (ARCH-02)

Início do desenvolvimento da RC2 (RC1 encerrada — ver `ESTADO-E-ROADMAP.md`). Primeira etapa:
elimina a dependência circular que impedia um Tutor autorizado, mas sem nenhum Pequeno Grupo
ainda, de acessar o Painel do Tutor pela primeira vez num aparelho novo.

- Novo ponto de entrada `?tutor`, checado em `initApp()` antes do roteamento normal — funciona
  independente de `welcomeDone` ou de já ter um grupo.
- `estaNaAllowlistTutores()` agora retorna o registro encontrado (nome canônico) em vez de só
  `true`/`false` — a allowlist `tutores` passa a ser a fonte de verdade para autenticar um Tutor,
  não mais a existência prévia de um grupo. Mudança retrocompatível, não afeta o caller existente
  (`gerarConvite`).
- `tutorIdentificar()` não bloqueia mais quem ainda não tem grupo.
- `tutorConfirmarCriarPass()` aceita a allowlist como prova de identidade alternativa quando não
  há registro de participante para conferir o WhatsApp.
- `renderTutorGruposList()`: quem está autorizado mas sem grupo vê "➕ Criar Primeiro Pequeno
  Grupo" (placeholder — implementação completa é a próxima etapa, `ATIVACAO-01`) em vez de uma
  mensagem de erro.
- Sem duplicar a lógica de login: uma única variável (`tutorPanelOrigem`) decide só a exibição do
  botão "voltar", reaproveitando as mesmas funções de identificação/senha/dashboard para as duas
  origens (Home e `?tutor`).
- Testado: fluxo existente (Home) sem regressão; `?tutor` com Tutor já-com-grupo; `?tutor` com
  Tutor novo (zero grupos); `?tutor` com dado que não bate na allowlist ("Acesso restrito").

---

## [2026-07-02] — Limpeza de código morto (FUNC-01, STR-01 a STR-05)

Commit de manutenção, sem alteração de comportamento observável pelo usuário.

- **FUNC-01:** removidas as 4 funções duplicadas (`sendMyPrayer`, `clearMyPrayer`,
  `openComunidade`, `enviarGratidao`) — em cada par, só a segunda declaração era
  executada; a primeira nunca rodava (JS sobrescreve funções de mesmo nome).
- Removida, junto, toda a cadeia de funções que só era chamada pela 1ª versão de
  `openComunidade`/`enviarGratidao` e por isso também nunca executava:
  `renderComunidadeScreen`, `renderGratCard`, `timeAgoGrat`, `setMuralFiltro`,
  `setPostTipo`, `getMinhasReacoes`, `reagirGratidao` e as variáveis `muralFiltro`,
  `postTipoSelecionado`, `GRAT_REACOES_KEY`.
- **STR-05:** removido o `if (window._conviteGrupoNum)` em `startJourney()` — a
  variável nunca era definida em lugar nenhum do código (resíduo do fluxo `?pg=N`
  removido na Etapa 2), condição sempre falsa.
- **STR-01/STR-03:** excluído `revisao.html` (arquivo órfão, não referenciado por
  nada, continha o link duplicado do STR-03).
- **STR-02:** removido `.claude/launch.json` (apontava para um caminho de sessão
  antigo que não existe mais).
- **STR-04:** removida a constante `TUTOR_PANEL_URL`, declarada e nunca usada.
- Verificado: nenhuma função duplicada remanescente (busca global); app carrega sem
  erros no console e sem requisições falhas.

---

## [2026-06-29] — Corrige perda do mural em conflito Firebase (FB-C3, regressão)

### ALTO corrigido — `gratidoes` (mural) apagado/perdido no merge

A reescrita via GitHub reverteu a correção FB-C3. Dois problemas no caminho de
conflito de `saveGruposToFirebase`:

1. **Write descartava o mural.** `dadosMerged` não incluía `gratidoes`, então toda
   gravação pós-conflito **apagava os posts do mural na nuvem**. Corrigido: `dadosMerged`
   agora inclui `gratidoes` (igual ao caminho normal `dadosSalvar`).
2. **Merge não unia o mural.** `mergeGruposData` só preservava as `gratidoes` do remoto
   (via `...rg`), perdendo posts locais ainda não sincronizados. Corrigido: agora **une**
   remoto + local com dedup por `id` (mesma lógica já usada para participantes).

Conflito = dois aparelhos gravando entre syncs (tutor + participantes ao mesmo tempo) —
cenário comum. Verificado em runtime: merge de remoto[id:1] + local[id:2,id:1] → `[1,2]`
(une e deduplica).

---

## [2026-06-29] — Validação de tamanho de entradas (R-M04)

### MÉDIO corrigido — guarda de tamanho + maxlength

**Guarda no save (a parte importante).** Existe um único documento Firestore
compartilhado por todos os grupos; a regra rejeita `dados` ≥ 500 KB. Antes, um write
acima do limite falhava **silenciosamente para todos**. Agora `fbWriteGrupos()` mede o
tamanho do `dados` (`JSON.stringify`) e, se passar de **480 KB**, cancela o write e
avisa o usuário (`alert`, com throttle de 60 s para não repetir). Transforma perda
silenciosa em aviso claro.

**`maxlength` nos campos que sincronizam** (prevenção na origem):

| Campo | Limite |
|-------|--------|
| Nome do grupo (`insc-grupo-nome-input`) | 40 |
| Departamento (`insc-dept`) | 40 |
| Nome do participante (`insc-nome`, `troca-papel-nome`) | 80 |
| Nome do usuário (`user-name-input`, `tp-nome-input`) | 80 |
| Pedido de oração ao companheiro (`my-prayer-input`) | 300 |
| Post do mural (`grat-input`, 2 composers) | 500 |

Invisível no uso normal; só limita ao atingir o teto. Não afeta diário pessoal nem
campos não sincronizados.

Verificado: app carrega sem erros; `fbWriteGrupos`/`fbWarnTooLarge` definidas;
`maxlength` confirmado no DOM.

---

## [2026-06-29] — Varredura XSS ampla (mural, grupos, bandeirola)

### ALTO corrigido — XSS em campos controlados por usuário (innerHTML)

Auditoria sistemática dos `innerHTML` que renderizam dados de usuário. A reescrita
via GitHub havia reintroduzido pontos sem escape (a correção C01 da auditoria anterior
se perdeu). Aplicado `sanitize()` nos vetores **cross-user** (onde um usuário injeta
script que executa no navegador de outro):

| Função | Campo |
|--------|-------|
| `renderComunidade` (mural sincronizado) | `item.autor`, `item.data`, `item.texto` |
| `renderGratCard` (mural local) | `g.texto` (`g.nome` já estava ok) |
| `renderGrupoDetalhe` (card de status) | `g.nome`, `g.tutor`, `g.coordenador` |
| `renderGrupoSelecionadoPreview` | `meuGrupo.grupoNome`, `g.tutor`, `g.coordenador` |
| lista de participantes inscritos | `p.nome` |
| painel de envio ao tutor | `d.nome` (2 pontos) |
| convite por link (welcome) | `g.nome` |
| **`generatePennantSvg`** | nome do grupo dentro de `<text>` do SVG |

> **Destaque:** a bandeirola (`generatePennantSvg`) inseria o nome do grupo direto no
> markup SVG — um nome com `<` permitia injeção. Agora escapado. Verificado em runtime:
> nome `<img onerror>` aparece escapado, não cru.

**Deixados intencionalmente sem `sanitize`:**
- Campos via `.textContent =` (ex.: `insc-grupo-tutor`) — já seguros; sanitizar
  mostraria entidades literais (`&amp;`).
- Nomes de nível/missão e `enc.texto` — conteúdo constante do código (currículo).
- Diário pessoal (`saved[pi]`) — self-XSS, não sincroniza para outros.

Verificação: app carrega sem erros; todas as funções editadas parseiam; teste de
injeção na bandeirola confirmado neutralizado.

---

## [2026-06-29] — Sanitização XSS na área do Companheiro de Jornada

### ALTO corrigido — XSS na nova tela de Companheiro

A reescrita do "Companheiro de Jornada" (ver seção abaixo) passou a renderizar
nomes, departamentos e pedidos de oração de participantes via `innerHTML` **sem
escape**. Como esses campos vêm do cadastro/entrada do usuário, um valor com
HTML (ex.: `<img onerror=...>`) seria executado. Aplicado `sanitize()` em 8
pontos:

| Local (função) | Campo sanitizado |
|----------------|------------------|
| `renderCompanionSelector` — convite recebido | `c.de` (nome de quem convidou) |
| `renderCompanionSelector` — membro do grupo | `p.nome` |
| `renderCompanionSelector` — membro do grupo | `p.departamento` |
| `renderCompanionDashboard` — botão de oração | `p.name.split(' ')[0]` |
| `renderCompanionDashboard` — caixa de pedido | `p.prayerRequest` (texto livre — maior risco) |
| `renderCompanionDashboard` — nome do parceiro | `p.name` |
| `renderCompanionDashboard` — compositor de oração | `p.name.split(' ')[0]` |
| `renderCompanionHomeBtn` — botão da home | `p.name.split(' ')[0]` |

> Os argumentos dentro de `onclick="...(...)"` já estavam protegidos pela função
> `escAttr()` (contexto de string JS), então não precisaram de `sanitize`.

### Limpeza — remoção do `_TUTORS_BOOTSTRAP`

Removidos o array `_TUTORS_BOOTSTRAP` (4 capelães com WhatsApp hardcoded), a função
`seedTutorsToFirebase()` e seu chamador na inicialização. O campo `tutores` já está
populado no Firestore (verificado no Console), então o seed virou código morto. O
runtime carrega `TUTORS` do Firestore em `syncFromFirebase()`. Tira PII do código-fonte
público; não afeta o funcionamento.

> Ressalva honesta: não torna os telefones privados — eles permanecem legíveis via
> Firestore (`read: if true`) e no campo `dados`. É limpeza de código + redução de
> exposição no repositório, não correção de privacidade.

### Verificações de Console (sem mudança de código)

- **Firestore Rules:** confirmadas já endurecidas (não em modo teste). Resolvido.
- **API Key:** confirmada restrita a `capelaniahospitalar.github.io/*` + `localhost/*`. Resolvido.

---

## Mudanças anteriores (commits `637d407`..`d8806e3`, via GitHub) — documentadas retroativamente

Estas entraram fora de uma sessão de manutenção assistida; registradas aqui para histórico.

### Reescrita do Companheiro de Jornada
- De escolha local (`CP.companionIdx`) para **convite mútuo entre participantes
  do grupo**, sincronizado via Firebase.
- Novos campos no participante: `compParceiro`, `compConvites`.
- Novas funções: `cpMyGroup`, `cpFindParticipant`, `cpMyParticipant`,
  `cpDisplay`, `escAttr`, `inviteCompanion`, `acceptCompanion`,
  `declineCompanion`, `removeCompanion`.
- Pedido de oração agora gravado no participante (`pedidoOracao`) para o
  companheiro visualizar pela nuvem.

### Progresso semanal passou a ser do grupo
- `getPgGroupWeek()` soma as contribuições (`contrib` com `weekKey`) de todos os
  participantes da semana ISO.
- `bumpPgProgress` grava contribuição individual com `updatedAt`; "semana
  completa" agora exige as **metas do grupo**.
- Meta de estudos: 3 → 1; na home, estudos vira "progresso da jornada" `x/13`.
- `getOrInitPgProgress` deixou de persistir ao apenas inicializar (evita
  sobrescrever Firebase antes da sync).

### Endurecimento do Firebase
- **Proteção anti-apagamento:** nunca grava lista vazia local sobre nuvem com
  dados — recupera da nuvem.
- Merge de participantes mantém a versão mais recente por `updatedAt`.
- `fbLastKnownTs` setado após `applyGruposData` (mais seguro se aplicar falhar).
- Null-safe em `p.nome` na deduplicação.

---

## [2026-06-26] — Auditoria de Segurança e Confiabilidade (Sessões 1 e 2)

Detalhamento completo das 22 correções (C01–C07, A04–A15, FB-C3, M04, M11)
preservado na memória persistente do projeto (`project_security_audit.md`).
