# CHANGELOG — Jornada Discipular em Pequenos Grupos

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
