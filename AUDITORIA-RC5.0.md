# RC5.0 — Auditoria Geral do Aplicativo (somente diagnóstico)

> Auditoria realizada em 2026-07-29. Escopo: `index.html` (~11.400 linhas), `ARCHITECTURE.md`,
> `CHANGELOG.md`. **Nenhuma alteração de código foi feita nesta RC** — diagnóstico puro, dividido
> em 4 frentes paralelas (Persistência/Concorrência · Integridade de Dados/Permissões ·
> Painéis/Interface · Regras de Negócio/Performance) e consolidado num único documento.

---

## 1. Resumo Executivo

| Severidade | Quantidade |
|---|---|
| 🔴 Crítico | 2 |
| 🟠 Alto | 4 |
| 🟡 Médio | 8 |
| 🟢 Baixo | 3 |
| **Total de achados corretivos** | **17** |

Além disso, 5 observações **positivas** (nenhuma ação necessária) — ver seção 4.

**Avaliação geral:** a base funcional do app está sólida — os fluxos mais sensíveis a
concorrência (convites, gratidão, aceite) já usam trava otimista com retries, e a separação de
responsabilidades (Cadastro Mestre / Efetivo / Cobertura calculada) é consistente. Os dois
achados críticos não são sintomas de descuido, e sim de um padrão que já se repetiu antes no
projeto (documentado no próprio `CHANGELOG.md`): **quando um campo novo é adicionado à
sincronização, é fácil atualizar a escrita e esquecer a leitura, o merge ou a regra do
Firestore** — mesmo padrão do bug já visto com `convites`. Isso sugere que a causa raiz mais
valiosa de corrigir não é um achado isolado, mas o **processo** de estender o payload de
sincronização (ver Matriz de Causas Raiz, seção 3).

---

## 2. Achados Técnicos

Cada achado separa **Sintoma** (o que se observa), **Causa raiz** (por que acontece) e
**Correção recomendada** (o quê fazer — sem implementar nesta RC).

### 🔴 AUD-001 — Setores institucionais gravados na nuvem, nunca lidos de volta
- **Categoria:** Persistência/Firestore · **Tipo:** Bug · **Arquivo:** `index.html`
- **Função/Linhas:** `fbReadDoc()` (8897-8915) vs. `fbWriteGrupos()` (8933-8981),
  `syncFromFirebase()` (9081-9092), `salvarFbConfig()` (9309-9311)
- **Sintoma:** um Tutor cadastra um setor institucional ou atualiza o Efetivo num aparelho;
  em qualquer outro aparelho (ou no mesmo, após limpar dados), o Cadastro Mestre de Setores e o
  Efetivo Institucional nunca chegam — só o que já existia localmente ali.
- **Causa raiz (confirmada em código):** `fbWriteGrupos` grava `setoresMestre`, `setoresEfetivo`
  e `embaixadoresExternos` (linhas 8954-8956); `syncFromFirebase`/`salvarFbConfig` esperam
  `result.setoresMestre` etc. Mas `fbReadDoc` — a única função que lê o documento do Firestore —
  só extrai `dados`, `ts`, `tutores`, `convites` e `updateTime` (8902-8913); **nunca foi
  atualizada** para extrair os três campos novos, que existem desde a RC4.8.2A (27/07). Não é
  cache/localStorage mascarando, nem caminho de leitura diferente, nem substituição por outro
  campo — é assimetria escrita↔leitura: 3 lugares foram atualizados quando o campo foi criado, o
  4º (extração na leitura) ficou pra trás. Distinto do problema já conhecido e documentado da
  allowlist da regra do Firestore (`CHANGELOG.md:164-166`) — mesmo corrigindo a allowlist, sem
  este fix a sincronização continuaria quebrada.
- **Correção recomendada:** adicionar em `fbReadDoc` a extração de
  `doc.fields?.setoresMestre?.stringValue` / `setoresEfetivo` / `embaixadoresExternos` (com
  `JSON.parse`), mesmo padrão já usado para `tutores`/`convites`.
- **Impacto:** Alto · **Esforço:** Baixo · **Prioridade:** Muito Alta · **Necessita ADR?** Não

### 🔴 AUD-002 — Ausência de autenticação Firebase (controle de acesso só client-side)
- **Categoria:** Segurança/Permissões · **Tipo:** Risco arquitetural · **Arquivo:** `index.html`
- **Função/Linhas:** ausência total de `firebase.auth`/`signInAnonymously`/`getAuth` no arquivo
  (confirmado por busca); escrita via REST puro em `fbWriteGrupos` usando só `projectId`+`apiKey`
  (8786-8787, comentário explícito reconhecendo isso na 8777)
- **Sintoma:** não há como distinguir, do lado do servidor, "quem" está gravando — só "o
  formato" dos dados.
- **Causa raiz:** o app nunca autentica o usuário perante o Firebase. Sem autenticação, regras
  do Firestore só podem validar a **forma** do documento (`hasOnly([...])`), nunca a
  **identidade** de quem grava (`request.auth`). Toda a separação Tutor/Coordenador/Participante
  é imposta **só na interface** (esconder botão) — não há barreira no servidor.
- **Risco atual:** como `apiKey`+`projectId` estão públicos no `index.html` (normal para apps
  Firebase client-side), qualquer pessoa com esses dois valores pode montar as mesmas chamadas
  REST diretamente, ignorando a UI — apagar um grupo, forjar um tutor, ler dados de participantes.
- **Impacto real hoje:** **não verificável a partir deste repositório** — não existe
  `firestore.rules` versionado (as regras são geridas direto no console do Firebase, numa conta
  Google diferente da padrão, conforme já registrado). Não sei dizer se a regra atual é
  `allow read, write: if true` (risco máximo) ou já tem alguma restrição de formato. **Recomendo
  como próximo passo você mesmo — ou eu, com acesso ao console — conferir a regra publicada
  antes de dimensionar a urgência real.**
- **Arquitetura recomendada:** Firebase Authentication (pode ser anônima, só para existir um
  `request.auth.uid` estável por dispositivo/papel) + regras que validem papel a partir de um
  documento de identidade, não confiando em nada vindo do cliente sem prova. É uma mudança
  estrutural, não um "ligar interruptor".
- **Correção recomendada:** não é corrigível só no `index.html`. Exige decisão explícita: (a)
  adicionar autenticação e reescrever regras por identidade, ou (b) aceitar o risco
  conscientemente (uso interno, dado de baixo valor de revenda) e documentar como limitação
  conhecida.
- **Impacto:** Crítico · **Esforço:** Alto · **Prioridade:** Alta (estratégica) ·
  **Necessita ADR? Sim** — decisão sobre estratégia de autenticação/autorização, afeta todos os
  papéis do sistema.

### 🟠 AUD-003 — `pgProgress`/`pgNivel` não entram no payload de gravação (RC3.2-A, já conhecido)
- **Categoria:** Persistência · **Tipo:** Bug (já rastreado, confirmado ainda aberto)
- **Função/Linhas:** `trySaveGrupos()` (9131-9143), `saveGruposLocal()` (8078-8094),
  comentário de governança já existente (9857-9861)
- **Sintoma:** progresso semanal do PG e nível do PG (🌱→👑) se perdem a cada reload/reconexão.
- **Causa raiz:** o payload de gravação (nuvem e localStorage) inclui
  `num, nome, tutor, coordenador, diaReuniao, horaReuniao, participantes, gratidoes,
  reunioesMes, pgIMD, pgRanking, setores` — mas não `pgProgress` nem `pgNivel`.
  `savePgProgress()`/`savePgNivel()` alteram esses campos só em memória.
- **Correção recomendada:** incluir os dois campos no payload de `trySaveGrupos` e
  `saveGruposLocal` — executar a RC3.2-A já planejada.
- **Impacto:** Alto · **Esforço:** Baixo · **Prioridade:** Muito Alta · **Necessita ADR?** Não

### 🟠 AUD-004 — Senha de Tutor/Coordenador não é controle de acesso real
- **Categoria:** Permissões · **Tipo:** Risco (subordinado ao AUD-002)
- **Função/Linhas:** `getTutorPassStore`/`setTutorPass` (2922-2933, só `localStorage`),
  `tutorConfirmarCriarPass` → `verificarWhatsappDoPapel` (3078-3095)
- **Sintoma:** a senha nunca sincroniza entre aparelhos — todo aparelho novo recria a senha
  provando posse do WhatsApp cadastrado.
- **Causa raiz:** a prova de WhatsApp é checada em JavaScript contra dados do próprio Firestore,
  que (pelo AUD-002) também não tem garantia de proteção no servidor. A "senha" é conveniência de
  UX (não repetir a etapa a cada visita no mesmo aparelho), não uma barreira de segurança.
- **Correção recomendada:** documentar explicitamente essa distinção; o controle de acesso real
  só é resolvido junto com o AUD-002.
- **Impacto:** Alto (mas mitigado hoje) · **Esforço:** Baixo (documentar) / Alto (resolver de
  verdade) · **Prioridade:** Média agora, atrelada ao AUD-002 no longo prazo ·
  **Necessita ADR?** Não isoladamente — está dentro do ADR do AUD-002.

### 🟠 AUD-005 — "Pedidos de oração" usa contador desatualizado (duplicação de lógica com Gratidão)
- **Categoria:** Regras de negócio · **Tipo:** Dívida técnica / regressão parcial
- **Função/Linhas:** `getPgGroupWeek()` (9795-9814, `oracoes += pr.contrib.oracoes`, linha 9805),
  `renderPgProgressHome()` (11092), `renderTutorGrupoDetalhe()` (3690); comparar com
  `getGratidoesDaSemanaISO()` (9789-9792) e seu uso em 11086
- **Sintoma:** o número de "pedidos de oração" exibido na Home e no Painel do Tutor pode não
  bater com o que está de fato publicado no Mural.
- **Causa raiz (confirmada em código):** a RC4.8.2-A corrigiu a **gratidão** especificamente —
  criou `getGratidoesDaSemanaISO()`, que conta direto do Mural (`g.gratidoes` filtrado por
  `tipo:'gratidao'` e Semana ISO) em vez do contador paralelo `pr.contrib.gratidao` (que o
  próprio código descreve como "pode ficar desatualizado", comentário 11081-11086). O **pedido
  de oração** nasce da mesma função de publicação (`enviarGratidao()`, grava com `tipo:'oracao'`
  em `g.gratidoes`, linha 11409) — mas nenhuma função `getOracoesDaSemanaISO` equivalente foi
  criada. Dois módulos que deveriam evoluir juntos evoluíram de forma diferente.
- **Correção recomendada:** criar `getOracoesDaSemanaISO(g)` análoga, e trocar `grp.oracoes`/
  `grpW.oracoes` por ela nos dois pontos de exibição. Considerar extrair uma função genérica
  `getContagemMuralDaSemanaISO(g, tipo)` reaproveitada pelas duas, evitando um 3º módulo
  divergir no futuro (ver Matriz de Causas Raiz).
- **Impacto:** Alto · **Esforço:** Baixo · **Prioridade:** Muito Alta · **Necessita ADR?** Não

### 🟠 AUD-006 — Excluir um encontro registrado não pede confirmação
- **Categoria:** Interface · **Tipo:** Bug/Risco (ação destrutiva sem proteção)
- **Função/Linhas:** `removerEncontroPg()` (3411-3423), botão "✕" (3454)
- **Sintoma:** um toque acidental apaga permanentemente o registro de presença de um encontro,
  sem chance de desfazer.
- **Causa raiz:** diferente de toda outra ação destrutiva do app (excluir setor, sair da
  coordenação, revogar convite — todas com `confirm()`), este botão chama a exclusão
  diretamente. Padrão de proteção existente no app, só não aplicado aqui.
- **Correção recomendada:** adicionar `confirm()` antes de `removerEncontroPg()`, mesmo padrão
  de `excluirSetor`/`revogarConvite`.
- **Impacto:** Alto · **Esforço:** Baixo · **Prioridade:** Muito Alta · **Necessita ADR?** Não

### 🟡 AUD-007 — Merge de reconciliação não cobre setores institucionais
- **Categoria:** Persistência/Concorrência · **Tipo:** Risco · **Depende do AUD-001**
- **Função/Linhas:** `prepareSaveGrupos()` (9109-9128), `mergeGruposData()` (9006-9063)
- **Sintoma:** dois Tutores editando setores institucionais diferentes ao mesmo tempo, em
  aparelhos diferentes, arriscam um sobrescrever o array inteiro do outro.
- **Causa raiz:** `PEQUENOS_GRUPOS` passa por merge por `updatedAt`/tombstone contra o remoto
  antes de gravar; `SETORES_MESTRE`/`SETORES_EFETIVO`/`EMBAIXADORES_EXTERNOS` são gravados como
  estão em memória, sem reconciliação — e, pelo AUD-001, nem sequer são recarregados da nuvem
  antes de gravar.
- **Correção recomendada:** ao corrigir o AUD-001, replicar a mesma lógica de merge por
  registro (`setorId`/`registroId`/`historico`) já usada em `mergeGruposData`.
- **Impacto:** Médio · **Esforço:** Médio · **Prioridade:** Média (após AUD-001) ·
  **Necessita ADR?** Não

### 🟡 AUD-008 — IDs de gratidão/oração usam `Date.now()`, não UUID
- **Categoria:** Integridade de dados · **Tipo:** Melhoria/bug latente
- **Função/Linhas:** publicação em `g.gratidoes` (11406, 11411); dedup em `mergeGruposData`
  (`gratKey`, 9037-9041)
- **Sintoma:** dois participantes do mesmo PG publicando no mesmo milissegundo, em aparelhos
  diferentes, podem ter um post descartado como "duplicata" pelo merge.
- **Causa raiz:** ao contrário de convites/participantes/encontros (que usam `uuid()`, 8811),
  gratidão/oração usam `id: Date.now()`. Baixa probabilidade prática, mas é o único ponto do app
  fora do padrão já estabelecido.
- **Correção recomendada:** trocar por `uuid()` no ponto de publicação.
- **Impacto:** Baixo/Médio · **Esforço:** Baixo · **Prioridade:** Média · **Necessita ADR?** Não

### 🟡 AUD-009 — Aviso de "vínculo perdido" existe em só uma tela
- **Categoria:** Interface/Integridade · **Tipo:** Melhoria
- **Função/Linhas:** aviso em `renderEmbaixadoresMissoes` (4719-4723); sem equivalente em
  `syncProgressoParaFirebase` (8858), `getCompanionPool` (6301), telas de Comunhão (10772,
  11071-11085, 11307)
- **Sintoma:** quando `tutorConfirmarZerarGrupo` (4287) apaga o participante de um grupo, o
  cartão "Companheiro de Jornada" some sem explicação em outras telas — só o cartão de
  Embaixadores explica o que aconteceu.
- **Causa raiz:** a checagem "meuGrupo existe mas o participante não está mais nele" foi
  implementada uma vez, localmente, dentro do Embaixadores, em vez de como função central
  reutilizável.
- **Correção recomendada:** extrair a checagem para uma função central e reutilizá-la nas
  outras telas dependentes do vínculo.
- **Impacto:** Médio · **Esforço:** Médio · **Prioridade:** Média · **Necessita ADR?** Não

### 🟡 AUD-010 — Rascunho do "Meu pedido de oração" (Companheiro) perdido durante sincronização automática
- **Categoria:** Interface · **Tipo:** Bug
- **Função/Linhas:** `renderCompanionDashboard()` (6746-6779) vs. proteção já existente em
  `renderComunidade()` (comentário `BUG-RASCUNHO-01`, 11318-11326)
- **Sintoma:** o usuário começa a digitar um pedido de oração no Companheiro de Jornada; se
  levar mais de 30s ou trocar de app, o composer é reconstruído do zero pelo poll de
  sincronização e o texto some sem aviso.
- **Causa raiz:** o Mural já tem proteção explícita para esse cenário (lê o valor atual do campo
  antes de reconstruir o HTML); o composer do Companheiro nunca recebeu a mesma proteção.
- **Correção recomendada:** replicar a lógica de preservar rascunho (leitura do `value` atual +
  foco/cursor) já usada em `renderComunidade()`.
- **Impacto:** Médio · **Esforço:** Baixo · **Prioridade:** Alta (vitória rápida) ·
  **Necessita ADR?** Não

### 🟡 AUD-011 — Ações do Companheiro de Jornada não bloqueiam botão durante sincronização
- **Categoria:** Concorrência/Interface · **Tipo:** Bug/Risco
- **Função/Linhas:** `inviteCompanion`, `acceptCompanion`, `declineCompanion`, `removeCompanion`
  (6556-6666) vs. padrão já usado em `confirmarEntradaConvite` (8717-8718, desabilita botão e
  mostra "Entrando…")
- **Sintoma:** com rede lenta, duplo toque em "Convidar"/"Aceitar" pode processar a mesma ação
  duas vezes.
- **Causa raiz:** essas 4 funções fazem `await syncFromFirebase()` antes de agir, mas nenhum
  botão que as aciona é desabilitado durante a espera — diferente do padrão já estabelecido
  em outro fluxo do mesmo app.
- **Correção recomendada:** aplicar o mesmo padrão de desabilitar botão + texto de carregamento.
- **Impacto:** Médio · **Esforço:** Baixo · **Prioridade:** Alta (vitória rápida) ·
  **Necessita ADR?** Não

### 🟡 AUD-012 — Dois indicadores "de engajamento" com denominadores diferentes
- **Categoria:** Regras de negócio/Transparência · **Tipo:** Melhoria (ou risco de confusão)
- **Função/Linhas:** `getPgEngajamentoSemana()` (9821, denominador = todos participantes ativos)
  vs. `calcularCapilaridadeScoreV2`/`participanteElegivelV2` (10142/10100, denominador = só
  participantes elegíveis, ≥7 dias)
- **Sintoma:** um coordenador comparando "% de Engajamento" da Home com a "Capilaridade" do
  Painel do Tutor pode ver números diferentes para o mesmo conceito aparente e achar que é bug.
- **Causa raiz:** os dois painéis usam critérios de elegibilidade diferentes, sem essa diferença
  estar documentada em nenhum dos dois lugares — viola o princípio de transparência dos
  indicadores só parcialmente (o cálculo de cada um é auditável isoladamente; o que falta é
  explicar por que os dois "parecidos" não batem).
- **Correção recomendada:** no mínimo, documentar a diferença de escopo nas duas telas; se fizer
  sentido de negócio, avaliar unificar o critério de elegibilidade (nesse caso, é mudança de
  regra de negócio, não só de texto).
- **Impacto:** Médio · **Esforço:** Baixo (documentar) · **Prioridade:** Média ·
  **Necessita ADR?** Não para documentar · **Sim** se decidirem unificar o critério

### 🟡 AUD-013 — `ARCHITECTURE.md` descreve o IMD v1 como vigente (código já está em v2)
- **Categoria:** Documentação · **Tipo:** Dívida técnica
- **Localização:** `ARCHITECTURE.md:76-101` vs. `classificarPgsV2` (10259), `getPgIMDv2`
  (10207), `FB_FLAGS.imdV2` (8804)
- **Sintoma:** quem ler a seção "Componentes Homologados" no topo do documento vai entender um
  modelo (5 dimensões antigas) que não é mais o exibido em produção.
- **Causa raiz:** a seção de Roadmap do próprio documento já registra que v2 é o motor vigente
  desde a RC3.5.5 — só a seção descritiva do topo não foi atualizada.
- **Correção recomendada:** atualizar a seção para descrever v2 como vigente, mantendo v1 só
  documentado como mecanismo de rollback (`FB_FLAGS.imdV2 === false`).
- **Impacto:** Baixo · **Esforço:** Baixo · **Prioridade:** Média-Baixa · **Necessita ADR?** Não

### 🟢 AUD-014 — Reprocessamento redundante ao abrir o Painel de Ranking
- **Categoria:** Performance · **Tipo:** Dívida técnica
- **Função/Linhas:** `renderRankingPgs` (10570) chama `classificarPgsV2()` e, em seguida, mais
  3 funções (`calcularTaxaConversaoV2` 10363, `calcularMediaIndicadoresV2` 10382,
  `calcularDistribuicaoIndicadoresV2` 10295) que recalculam `getPgIMDv2` e a deduplicação de
  participantes de novo, do zero, para cada PG.
- **Causa raiz:** cada função agregada foi escrita de forma independente, sem reaproveitar o
  resultado já calculado por `classificarPgsV2`.
- **Correção recomendada:** calcular `getPgIMDv2` uma vez por PG e reaproveitar nas 3 funções.
- **Impacto:** Baixo hoje (37-50 PGs pequenos), cresce com o tempo · **Esforço:** Médio ·
  **Prioridade:** Baixa · **Necessita ADR?** Não

### 🟢 AUD-015 — Deduplicação O(n²) de participantes copiada em 6+ funções
- **Categoria:** Performance/Dívida técnica
- **Função/Linhas:** `getPgIMD` (10025), `getPgIMDv2` (10219), `calcularCoberturaSetorial`
  (3831), `calcularEmbaixadoresPorSetor` (5334), `calcularMediaIndicadoresV2` (10389),
  `calcularDistribuicaoIndicadoresV2` (10300)
- **Causa raiz:** o padrão `filter((p,i,arr) => arr.findIndex(...) === i)` foi copiado de forma
  independente em cada função em vez de extraído uma vez.
- **Correção recomendada:** extrair `participantesSemDuplicata(g)` única, idealmente O(n) com
  `Map`/`Set`.
- **Impacto:** Baixo · **Esforço:** Médio · **Prioridade:** Baixa · **Necessita ADR?** Não

### 🟢 AUD-016 — Cálculo institucional de Embaixadores roda 2x por gravação
- **Categoria:** Performance · **Função/Linhas:** `calcularEmbaixadoresPorSetor` (5324),
  chamada de novo dentro de `salvarParticipantesExternos` (10668-10672) só para validar um
  número digitado.
- **Correção recomendada:** validar só o setor específico sendo editado, sem recalcular todos.
- **Impacto:** Baixo · **Esforço:** Baixo/Médio · **Prioridade:** Baixa · **Necessita ADR?** Não

### 🟢 AUD-017 — "Nível do PG" (gamificação) já em produção antes do Épico 5
- **Categoria:** Documentação/Governança · **Tipo:** Dívida técnica (doc)
- **Localização:** `PG_GRUPO_LEVELS`/`getPgGrupoLevel` (10803-10832), `renderPgProgressHome`
  (11159) vs. `ARCHITECTURE.md` ("Épico 5 — Gamificação Discipular, aprovado, não iniciado")
- **Sintoma:** o roadmap oficial diz que a gamificação não começou; o código já exibe nível do
  PG (Semente → Comunhão Plena) com ícone e barra de progresso.
- **Correção recomendada:** não é bug funcional — só reconciliar o documento (registrar o Nível
  do PG como recurso pré-existente, fora do escopo formal do Épico 5).
- **Impacto:** Baixo · **Esforço:** Baixo · **Prioridade:** Baixa · **Necessita ADR?** Não

---

## 3. Matriz de Causas Raiz

Agrupar os achados por causa raiz evita tratar sintomas isoladamente — em vários casos, uma
única mudança de processo ou de código elimina mais de um achado ao mesmo tempo.

| Causa raiz | AUDs relacionados | Observação |
|---|---|---|
| **Assimetria escrita↔leitura ao estender o payload de sincronização** | AUD-001, AUD-003, AUD-007 | Padrão já visto antes com `convites` (registrado no `CHANGELOG.md`). Sugere revisar, ao final da RC5.1, um checklist único para "todo campo novo no Firestore precisa: write + read + merge + allowlist" — evita reabrir esta mesma classe de bug numa 4ª vez. |
| **Ausência de autenticação Firebase** | AUD-002, AUD-004 | Uma única decisão arquitetural (ADR) resolve as duas. |
| **Duplicação de lógica entre Gratidão e Oração** (mesmo composer, evolução divergente) | AUD-005, AUD-008 | Ambos nascem do mesmo ponto de publicação (`enviarGratidao`/`g.gratidoes`); vale considerar uma função genérica por `tipo` em vez de duas paralelas. |
| **Padrão de proteção de interação (confirmação / desabilitar botão / preservar rascunho) aplicado de forma inconsistente entre telas** | AUD-006, AUD-010, AUD-011 | O padrão correto já existe em outro lugar do app (`excluirSetor`, `confirmarEntradaConvite`, `renderComunidade`) — não precisa ser inventado, só replicado. |
| **Verificação de vínculo/elegibilidade reimplementada por tela, sem função central** | AUD-009, AUD-012 | Duas checagens de "quem conta para o quê" vivem duplicadas em vez de centralizadas. |
| **Recalculo redundante sem cache/memoização por render** | AUD-014, AUD-015, AUD-016 | Todos no Painel de Ranking/Indicadores; uma função central de "IMD + dedup por PG, calculado uma vez por render" resolveria os três. |
| **Documentação não acompanha a evolução do código em produção** | AUD-013, AUD-017 | Nenhum dos dois é bug — é o `ARCHITECTURE.md` correndo atrás do código já homologado. |

---

## 4. Pontos Positivos (nenhuma ação necessária)

- **Concorrência bem tratada nos fluxos mais críticos:** `saveGruposToFirebase`/
  `trySaveGrupos`/`prepareSaveGrupos` usam trava otimista via `updateTime` com merge e até 3
  retentativas; `commitConviteChange` usa o mesmo padrão para convites/aceite (até 4
  tentativas); botões-chave (`confirmarEntradaConvite`, `enviarGratidao`, `completeStudy`)
  já desabilitam/marcam guard antes de qualquer `await`.
- **Proteção setor↔participante robusta:** `excluirSetor` bloqueia corretamente a remoção
  enquanto houver participante vinculado; não há caminho de exclusão sem essa proteção.
- **Firebase config exposto é o esperado:** só `projectId`+`apiKey` públicos — normal para apps
  Firebase client-side; nenhuma chave de admin/service account encontrada.
- **O bug de "campo não limpo" (corrigido em Gratidão/Oração) não se repete** no Diário
  Espiritual nem no diário de encontro — esses reconstroem o formulário inteiro a cada render,
  por isso escapam do padrão.
- **"Jornada Discipular"/"Mapa de Discipulado" não existe neste código** — confirma que a
  separação entre este app (Pequenos Grupos) e o app irmão de discipulado individual está
  correta; não é uma lacuna, é o produto certo não tendo o módulo do outro produto.

---

## 5. Dívida Técnica (separada de bugs)

AUD-013, AUD-014, AUD-015, AUD-016, AUD-017 são dívida técnica pura (nada quebra hoje, mas
custam manutenção/performance no crescimento). Registrado à parte, já recomendado anteriormente
pelo usuário e reforçado por esta auditoria: extrair os 5 indicadores da Meta Semanal
(`estudo, oracao, bondade, gratidao, missoes`) para uma estrutura de configuração única, e
extrair `IndicadorSetorial` unificando Cobertura Setorial e Embaixadores — ambos deliberadamente
adiados até haver um segundo consumidor real, decisão já registrada e mantida aqui.

---

## 6. Roadmap de Correção Proposto

| RC | Escopo | Achados | Observação |
|---|---|---|---|
| **RC5.1 — Persistência e Sincronização** | AUD-001, AUD-003, AUD-007 | Todos de Impacto Alto/Esforço Baixo (exceto AUD-007, que depende do AUD-001) — vitórias rápidas prioritárias. |
| **RC5.2 — Segurança e Permissões** | AUD-002, AUD-004 | Requer ADR antes de codificar; escopo maior, não é "vitória rápida". |
| **RC5.3 — Interface, UX e Regras de Negócio do Mural** | AUD-005, AUD-006, AUD-008, AUD-009, AUD-010, AUD-011, AUD-012 | Mistura vitórias rápidas (005, 006, 010, 011) com melhorias de médio esforço (009). |
| **RC5.4 — Performance** | AUD-014, AUD-015, AUD-016 | Baixo risco, pode esperar; útil antes de qualquer expansão de escala. |
| **RC5.5 — Documentação e Governança** | AUD-013, AUD-017 | Só atualização de documento, sem código. |

**Sugestão de ordem por valor/esforço:** RC5.1 primeiro (maior impacto, menor esforço) →
RC5.3 (várias vitórias rápidas) → RC5.5 (documentação, barato) → RC5.4 (performance, sem pressa)
→ RC5.2 por último não por ser menos importante, e sim por exigir a decisão de ADR mais ampla
antes de começar a codificar.

---

## 7. Critério de Saída (Exit Criteria) — RC5.0

| Critério | Status |
|---|---|
| Todas as 8 áreas pedidas auditadas (Persistência, Concorrência, Integridade, Painéis, Regras de Negócio, Interface, Permissões, Performance) | ✅ |
| Todos os achados classificados (severidade, tipo Bug/Risco/Melhoria/Dívida Técnica, Impacto×Esforço, Prioridade) | ✅ |
| Evidências anexadas (arquivo:linha por achado) | ✅ |
| Sintoma separado de causa raiz e de correção recomendada | ✅ |
| Matriz de Causas Raiz | ✅ |
| Roadmap RC5.1+ definido | ✅ |
| Nenhuma alteração de código realizada nesta RC | ✅ |

**RC5.0 encerrada.** Próximo passo: decidir com qual RC do roadmap (seção 6) começar.
