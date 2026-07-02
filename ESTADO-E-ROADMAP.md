# Estado do Projeto Rocha — Handoff de sessão (atualizado 2026-07-02)

> Documento para retomar o trabalho em outra máquina/sessão. Cole o conteúdo de volta
> para o assistente ao recomeçar — a "memória" do assistente **não viaja entre máquinas**;
> só este arquivo (via GitHub) viaja. **Nenhuma alteração de código sem aprovação do desenho.**

## 🚨 Incidente de contaminação de produção (2026-07-01) — RESOLVIDO

**O que aconteceu:** durante o checklist de regressão do IDENT-01, um `window.location.reload()`
no meio de um teste ao vivo derrubou os bloqueios de rede (`fbReadDoc`/`syncFromFirebase`
mockados só existem em memória da aba) — o app voltou a sincronizar de verdade com o Firebase de
produção antes que os bloqueios fossem reaplicados, e escreveu dados de teste por cima do
documento real (`jdpg/grupos`).

**Escopo do dano (confirmado por leitura direta, byte a byte):**
- Grupo 1 (CAPELANIA, real): nome/tutor/coordenador trocados por dados fictícios + 5
  participantes fictícios adicionados. Participantes reais e mural (`gratidoes`) preservados o
  tempo todo.
- Grupo 2 (teste): nome/tutor trocados por dados fictícios.
- Campo `tutores` (allowlist dos 4 capelães): **removido inteiramente** (write sem esse campo
  substitui o documento por completo — comportamento do Firestore, não um bug novo).
- Grupos 3-50: confirmados intactos (nenhuma alteração).

**Restauração:** snapshot do estado contaminado salvo localmente antes de qualquer nova escrita;
diff programático confirmou que só os Grupos 1 e 2 mudariam; gravação final protegida por
`currentDocument.updateTime` (aborta se algo mudar entre a leitura e a escrita). Grupo 1 e 2
restaurados ao estado exato de antes do incidente; `tutores` reconstruído com os dados fornecidos
pelo usuário (não estava salvo em nenhum snapshot — perda real, mas recuperada por fonte humana).
Confirmado por leitura: Grupo 1 = CAPELANIA com os 2 participantes reais + mural intacto; Grupo 2
= vazio; `tutores` com os 4 capelães; Grupos 3-50 intactos.

**Causa raiz:** ausência de isolamento entre ambiente de teste e produção — não é um bug de
código, é uma lacuna de processo. **Decisão tomada:** nenhum teste funcional deve rodar contra o
Firebase de produção daqui para frente; ver regra permanente e plano de ambiente de homologação
mais abaixo.

**Nota sobre dados sensíveis:** o snapshot bruto da restauração (com nomes/WhatsApp reais) foi
salvo **só localmente** (`C:\Users\wladimir.souza\Documents\backups-firebase-jdpg\`), não neste
repositório — este é público, e o snapshot contém PII (WhatsApp dos 4 capelães).

## Regra permanente — isolamento de teste vs. produção

**É terminantemente proibido executar qualquer teste que possa escrever no Firebase de produção.**
Sempre que houver necessidade de validar fluxos que alterem dados (cadastro, convites, campanhas,
progresso, mural, companheiro, recuperação de identidade etc.), usar exclusivamente ambiente de
homologação ou mocks locais com a rede bloqueada (`fbReadDoc`/`syncFromFirebase`/
`saveGruposToFirebase` sobrescritas). **Nunca recarregar a página (`location.reload()`) durante um
teste com a rede bloqueada** — o reload apaga os bloqueios (são só JS em memória da aba) e a app
volta a sincronizar de verdade antes que os bloqueios possam ser reaplicados. Se não for possível
garantir isolamento absoluto, interromper o teste e pedir autorização antes de prosseguir.

**Próximo passo estrutural (ainda não feito):** criar um ambiente de homologação separado (cópia
do Firebase de produção, projeto/documento distinto) para que toda validação funcional futura
aconteça lá, nunca em produção.

## Natureza do projeto
App de discipulado (Capelania HAS) para ~50 Pequenos Grupos. **NÃO é Flutter** — é um
**único `index.html`** (HTML/JS puro, PWA) usando **Firestore via REST** num **único documento
compartilhado** `jdpg/grupos` (campos `dados`, `tutores`, e agora também `convites` — todos
JSON serializado). Publicado em GitHub Pages:
https://capelaniahospitalar.github.io/jornada-pequenos-grupos/ . Usuário é não-programador;
commits feitos por ele via **GitHub Desktop** (revisa o diff).

## Onde estamos
- **Commit 1 (concorrência) — FEITO** (`c747675`). Trava otimista `currentDocument.updateTime`
  (testada na API real: conflito=HTTP 400 FAILED_PRECONDITION, sucesso=200); retry 3× com
  backoff aleatório; reconnect-retry (`online`/`visibilitychange`); `deviceId`; log local de
  conflitos; telemetria local (`recordSync`, success rate, `lastSuccessfulSyncVersion`).
  **Homologação de campo:** só o Teste 1 (inclusão concorrente) foi confirmado como aprovado
  (3 aparelhos). Testes 2–7 (edição concorrente, reconexão, fechar/reabrir, alternância ~5min,
  cliques rápidos, reinício total) e a conferência da telemetria **não têm confirmação
  registrada** de terem rodado antes da Etapa 1/2 avançarem — checar com o usuário.
- **Etapa 1 — Identidade da pessoa (`memberId`) + Meus Vínculos — FEITO** (`309d685`, flag
  `FB_FLAGS.identidadeUuid`). Substitui "1 vínculo por aparelho" por identidade permanente:
  `memberId` (UUID gerado 1x por instalação, `localStorage 'jdpg_member_id_v1'`) carimbado no
  registro do participante; lista `Meus Vínculos` (`localStorage 'jdpg_meus_vinculos_v1'`) com
  todos os grupos da pessoa; `Grupo Aberto` (`ST.grupoAberto`) = qual está sendo exibido agora,
  sem afetar o vínculo. `loadMeuGrupo()`/`saveMeuGrupo()` viraram wrappers de compatibilidade
  (mantêm as ~20 chamadas existentes funcionando). Migração automática e silenciosa dos dados
  antigos roda 1x (`migrateToVinculos`), com log de auditoria no console.
- **Etapa 2 — Convites de uso único — FEITO** (4 sub-commits: `fb72f19` estrutura de dados,
  `17f5f7f` geração/leitura/aceite em memória, `0a310d7` sincronização segura à concorrência,
  `3ad5e9f`+`593e89e` tela e UI). Flag `FB_FLAGS.convitesV2`. Substitui o link antigo `?pg=N`
  (que auto-inscrevia qualquer um que abrisse) por uma cadeia de autoridade com link `?conv=<id>`:
  - Tutor (confirmado contra a allowlist `tutores`) → convida Coordenador
  - Coordenador do grupo → convida Colaborador
  - Convite de **uso único**, expira em 7 dias, estados `pendente/utilizado/cancelado/expirado`
    (máquina de estados: terminais nunca voltam a `pendente`)
  - Sincronizado no Firestore (campo novo `convites`), reaproveitando a trava de concorrência do
    Commit 1 (loop `commitConviteChange`: lê remoto fresco → monta mudança em memória → grava com
    pré-condição → só aplica local se gravar → repete em caso de FAILED_PRECONDITION)
  - Tela de aceite dedicada (`?conv=<id>`), mensagem padrão de WhatsApp, lista "convites que você
    enviou" com opção de revogar
  - **Mudança que quebra links antigos:** `?pg=N` não funciona mais — quem abrir um link desse
    tipo agora vê a mensagem "convite de versão anterior, peça um novo ao Coordenador". **Isso já
    está no ar.** Não confirmado ainda: se algum PG (principalmente o **Grupo 1, que é real**) já
    distribuiu links `?pg=N` para pessoas reais antes dessa mudança — perguntar ao usuário.
- **Ponto de restauração:** tag `v2a-pre-identidade` (→ `c747675`, estado antes da Etapa 1/2,
  já publicada no GitHub). Restauração: `git checkout v2a-pre-identidade`.

## Achado de campo (deadlock) — AINDA NÃO RESOLVIDO
Ao usar **"Cancelar minha inscrição"** (`cancelarInscricao`, linha ~8492), o app apaga a chave
antiga (`localStorage 'jdpg_meu_grupo_v1'`) e remove a pessoa da lista de participantes na nuvem
— mas **não atualiza `Meus Vínculos`**, a lista nova criada na Etapa 1. Ou seja:
1. O bug original (merge ressuscita o nome removido → "já inscrita" trava reinscrição) continua
   presente, porque o `cancelarInscricao` não foi tocado.
2. Risco novo: `Meus Vínculos` pode ficar com uma entrada "fantasma" apontando para um grupo do
   qual a pessoa já foi removida na nuvem, já que ninguém limpa essa lista no cancelamento.

Workaround sem código continua o mesmo: usar um **grupo novo** e não usar "Cancelar". Esse ponto
precisa entrar no Mapa de Impacto antes de qualquer novo commit que mexa em vínculos/remoção
(toca diretamente no C3 — tombstone — abaixo).

## Roadmap
Cada commit é precedido de **Mapa de Impacto** (análise, sem código); tombstone também leva **ADR**.
- **C1 — Concorrência:** FEITO (ver acima).
- **Etapa 1 (identidade) + Etapa 2 (convites):** FEITO (ver acima) — cobre o que antes era descrito
  como "C2 — Modelo Meus Grupos", mas foi além (também substituiu o sistema de convite/link).
- **C3 — Tombstone transitório:** remoção vira `removed:true` (+ carimbo) e `updatedAt` por
  participante no topo; merge compara remoção × edição (mais recente vence); resolve a
  ressurreição do achado de campo acima. Inclui **ADR** com **Exit Criteria**. Flag
  `FB_FLAGS.useTombstone` já existe no código (`true`) mas **não está implementada** — nenhuma
  função lê esse flag ainda; é só um marcador reservado do plano original.
- **C4 — Debounce ~400ms** (`FB_FLAGS.debounceMs`) com dirty-check de payload. Mesma situação:
  flag existe (`400`) mas **não está implementada/lida em nenhum lugar do código**.
- **C5 — Limpeza: FEITO (2026-07-02).** `FUNC-01` (4 duplicatas: `sendMyPrayer`, `clearMyPrayer`,
  `openComunidade`, `enviarGratidao`) + a cadeia inteira que só a 1ª versão de `openComunidade`/
  `enviarGratidao` chamava (`renderComunidadeScreen`, `renderGratCard`, `timeAgoGrat`,
  `setMuralFiltro`, `setPostTipo`, `getMinhasReacoes`, `reagirGratidao` + variáveis) + `STR-01`
  (`revisao.html`) + `STR-02` (`.claude/launch.json`) + `STR-03` (resolvido junto com STR-01) +
  `STR-04` (`TUTOR_PANEL_URL`) + `STR-05` (`window._conviteGrupoNum`, nunca definido em lugar
  nenhum). 253 linhas removidas de `index.html`, zero mudança de comportamento observável — só
  o que já era comprovadamente inalcançável foi tirado. `CHANGELOG.md` atualizado. Verificado:
  busca global sem duplicatas remanescentes; app carrega sem erros de console nem requisições
  falhas.
- **UX-01 — Revisar acesso à Comunidade/Mural de Gratidão na Home (novo, 2026-07-02).**
  Achado durante o C5: a Home tem hoje **dois botões** que levam para a mesma tela — "Mural de
  Gratidão" (dentro de `renderGruposBtnHome`, só aparece se já estiver num grupo) e "Comunidade"
  (`renderComunidadeBtnHome`, sempre aparece, com contador "X compartilhada(s) por você"). Esse
  contador lê de um `localStorage` (`loadGratidoes`/`GRAT_KEY`) que **não é mais escrito por
  ninguém** desde que o mural virou por grupo/Firebase — fica travado permanentemente. Deliberadamente
  **não mexido no C5** (removê-lo muda a tela inicial, deixa de ser limpeza pura). Escopo proposto
  para quando for feito: eliminar a duplicidade, unificar num único botão, remover o contador
  baseado em `localStorage` (ou trocar por um derivado do Firebase). Planejado para depois da RC e
  da homologação, como rodada de refinamento de UX — não antes.

## Rollback / segurança
- Flags congeladas no topo do `<script>`: `FB_FLAGS = Object.freeze({ usePrecondition,
  retryOnReconnect, debounceMs, useTombstone, identidadeUuid, convitesV2 })` → desligar cada
  camada por 1 linha. `debounceMs` e `useTombstone` são só reservas (ver Roadmap acima).
- Tags: `v0-pre-concurrency` (pré-Commit-1, → `a167578`), `v2a-pre-identidade` (pré-Etapa-1/2,
  → `c747675`) e `v3-rc1-baseline` (Baseline RC1, → `43f2d15`, criada localmente em 2026-07-02 —
  **ainda não publicada no GitHub**, ver nota abaixo). As duas primeiras publicadas no GitHub.
- **Baseline RC1 (2026-07-02):** snapshot do Firestore em
  `C:\Users\wladimir.souza\Documents\backups-firebase-jdpg\BASELINE-RC1-2026-07-02.json` (50
  grupos, Grupo 1 só com o Wladimir, sem mural) + tag `v3-rc1-baseline`. Ponto oficial de
  restauração para a fase de homologação. **Pendente:** publicar a tag no GitHub — o push falhou
  neste ambiente (credencial `Wladimperator` sem permissão de escrita no repositório
  `capelaniahospitalar/jornada-pequenos-grupos`, HTTP 403); publicar pelo GitHub Desktop ou `git
  push origin v3-rc1-baseline` com uma credencial autorizada.
- Checklist de homologação e registro de defeitos: `HOMOLOGACAO-RC1.md` (novo, 2026-07-02).
- Validação local (sem node/python): servidor estático PowerShell + preview do assistente.

## Estado dos dados na nuvem
**Atualizado 2026-07-02:** Grupos 2–6 (dados de teste) zerados sob autorização do usuário —
voltaram ao mesmo estado em branco dos Grupos 7–50 (`nome`/`tutor`/`coordenador`/`diaReuniao`/
`horaReuniao` = null, `participantes`/`gratidoes` = []). Gravação feita via REST direto (fora do
app), com backup local prévio
(`C:\Users\wladimir.souza\Documents\backups-firebase-jdpg\snapshot-antes-limpeza-grupos-teste-2026-07-02.json`)
e trava de concorrência (`currentDocument.updateTime`). Confirmado por leitura: **Grupo 1
(CAPELANIA) intacto** (2 participantes reais + mural), allowlist `tutores` intacta (4 capelães),
Grupos 7–50 inalterados, 50 grupos no total. Campo `convites` não existe no documento (nenhum
convite ativo até o momento).

**Atualizado 2026-07-02 (2ª operação, mesma sessão):** confirmado que links antigos `?pg=N` **já
foram distribuídos para pessoas reais** (ver pendência 6 abaixo, agora resolvida) — o Grupo 1
(CAPELANIA) foi **resetado sob autorização explícita do usuário** para recomeçar oficialmente pela
cadeia de convites nova. Mudança: `participantes` do Grupo 1 passou de 2 para 1 (mantido só
**Wladimir Gonçalves**, tutor real, com XP/progresso intactos — 110 XP, 1 estudo, 1 missão);
**Tamires Santos removida** (precisa se recadastrar pelo convite do Coordenador/Tutor); `gratidoes`
(mural) zerado (3 posts reais do Wladimir apagados, por decisão do usuário). Backup prévio:
`snapshot-antes-reset-grupo1-2026-07-02.json`. Mesmo processo de segurança: leitura fresca →
backup → trava de concorrência (`currentDocument.updateTime`) → gravação → confirmação por
releitura. `tutores` (allowlist) e os outros 49 grupos não foram tocados. **Próximo passo humano:**
Wladimir entra no app como Tutor e usa o Painel do Tutor para gerar o convite ao Coordenador,
reiniciando a cadeia oficialmente.

## Auditoria Completa (2026-07-01) — Tabela Final de Pendências

Auditoria de 5 fases (Estrutura, Banco de Dados, Fluxos, Permissões, Código) + verificações
extras (mistura entre projetos, inventário funcional), com o objetivo de checar se a
sincronização/incidente da manhã de 2026-07-01 havia corrompido o projeto. **Conclusão: sem
evidência de corrupção causada pela sincronização.** Os achados abaixo já existiam antes.

### 🔴 Vulnerabilidades
- **PERM-01 — RESOLVIDO (2026-07-01).** Painel Tutor/Coordenador exigia só o nome, sem prova de
  posse do papel. Correção: bootstrap da credencial agora exige o WhatsApp cadastrado no grupo
  para aquele papel (`verificarWhatsappDoPapel`), com fail-closed se não houver WhatsApp no
  registro. Login normal (nome+senha) para quem já tem credencial neste aparelho — intocado.
  Testado ao vivo (WhatsApp errado bloqueia; certo libera; sem registro bloqueia com orientação;
  usuário existente não é afetado).
- **PERM-02** — Leitura do documento Firestore é global (`read: if true`) — já conhecido e
  aceito pela equipe antes desta auditoria; **confirmado ao vivo** durante o teste do CJ-01 (uma
  sessão de teste totalmente nova recebeu, sem nenhuma credencial, os dados reais de todos os
  grupos). Revisitar se o nível de segurança esperado pelo HAS mudar.

### 🟠🟡 Dívidas técnicas
- **DB-01 — RESOLVIDO (2026-07-01).** Colaborador/coordenador agora só pertence a 1 PG ativo por
  vez (tutor continua isento — supervisiona vários grupos por natureza do papel). Nova função
  `getMeuGrupoAtivo(nome)` detecta vínculo existente; ao tentar entrar em outro PG
  (`confirmarInscricao`/`confirmarEntradaConvite`), abre `renderTrocaDeGrupoModal` — **nunca migra
  automaticamente**, só após confirmação explícita ("Sim, trocar de grupo"). `cancelarInscricao`
  foi refatorada: núcleo de remoção extraído para `removerDoGrupoAtual` (reaproveitado pelo fluxo
  de troca, sem duplicar lógica). Testado ao vivo: colaborador dispara modal e migra corretamente
  ao confirmar; nada muda ao cancelar; Tutor comprovadamente isento (multi-grupo); Coordenador
  comprovadamente sujeito à regra (modal aparece); botão antigo "Cancelar inscrição" sem regressão.
  **Limpeza de dados de produção associada:** removidas entradas duplicadas de "Wladimir
  Goncalves"/"Wladimir Gonçalves de Souza" dos Grupos 2, 3, 5 e 6 (mantido só no Grupo 1, real),
  preparando a base para essa regra.
- **DB-02 — RESOLVIDO (2026-07-01).** `syncProgressoParaFirebase` e `bumpPgProgress` agora usam
  a nova função utilitária `findMeuParticipante(g)` — `memberId` como fonte de verdade, nome
  normalizado (trim+lowercase) como reserva para registros antigos sem `memberId`, mesmo padrão já
  usado em `getMinhaFuncaoNoGrupo`. Testado ao vivo: sincroniza corretamente mesmo com nome local
  divergente (via `memberId`); sincroniza via nome legado com variação de grafia/espaço; não
  quebra nem sobrescreve nada quando não há correspondência. `_syncMissaoParaGrupo` foi
  deliberadamente deixada de fora — opera só sobre cache local (`PG_MISSOES_KEY`), sem o problema
  de reconciliação entre dispositivos que motivou o DB-02.
- **DB-03 — REAVALIADO após o DB-01 (2026-07-01), não implementado por decisão consciente.**
  Rastreei os 3 pontos que mudam "Grupo Aberto" (`setGrupoAberto`, ligados só a
  `confirmarInscricao`/`aceitarConvite`) — confirmado: **resolvido por consequência do DB-01**
  para colaborador/coordenador (só podem ter 1 vínculo ativo, não há mais "grupo errado" possível).
  **Sobra um caso residual, restrito aos 4 Tutores (capelães)**: se um tutor supervisiona vários
  grupos E também faz a própria jornada pessoal de estudos pelo app, o progresso dele só atualiza
  o registro do "Grupo Aberto" (o último grupo em que entrou) — nos outros grupos que supervisiona,
  seu próprio registro de tutor fica com progresso desatualizado no Painel do Tutor. **Efeito é só
  visual/estatístico** (não altera o progresso real da pessoa, não afeta colaboradores). Correção
  proposta (gravar em todos os grupos do tutor) foi **deliberadamente adiada** — mudaria a premissa
  de "1 ação → 1 grupo atualizado" para "1 ação → N grupos", aumentando gravações/sincronizações/
  superfície de bug para resolver algo que afeta só 4 pessoas, sem impacto na operação dos PGs.
  Revisitar numa futura revisão do Painel do Tutor, não antes.
- **DB-04 — RESOLVIDO (2026-07-01).** Campanha (Embaixadores) agora mora em `g.campanhas`, dentro
  da própria estrutura do grupo — sincroniza pelo mesmo caminho já existente (`saveGrupos()` →
  Firebase, com a trava de concorrência do Commit 1). `loadCampanhasProgress`/`saveCampanhasProgress`
  reescritas; nenhuma mudança em `renderCampanhasTutor`/`salvarCampanhaPresenca`/`salvarCampanhaVisita`/
  `desfazerVisita`. **Migração automática e única** dos dados antigos (`localStorage
  'jdpg_campanhas_v1'`): na primeira leitura, se `g.campanhas` ainda não existe e há dado legado
  daquele grupo, ele vira a base do grupo e a chave antiga daquele grupo é apagada do localStorage
  — depois disso, o localStorage nunca mais é lido (só o grupo/Firebase é a fonte). Testado ao
  vivo: migração seletiva por grupo (não afeta dados de outros grupos ainda não migrados); migração
  não roda 2× (reinjeção de dado antigo no localStorage não altera o já migrado); leitura/escrita
  seguintes operam só sobre `g.campanhas`.
- **DB-05** — Sem histórico/tombstone ao trocar de PG (`cancelarInscricao`) — mesmo achado do
  "Achado de campo" documentado acima
- **IDENT-01 — RESOLVIDO (2026-07-01)** (renomeado de FLOW-01 — escopo real vai além de "segundo
  aparelho": troca de celular, reinstalação, limpeza de cache, recuperação após perda). Novas
  funções `buscarCadastroExistente(g, nome, wa)` (nome **e** WhatsApp normalizados — nunca só um
  dos dois) e `recuperarIdentidade(g, p)` (só troca `memberId`; nunca cria um segundo participante
  — papel e Companheiro de Jornada já estão no mesmo registro, preservados automaticamente).
  Restaura localmente apenas o que é sincronizado: XP, streak, estudos concluídos (reconstruído,
  jornada é sequencial). Diário/decisões (`ARCH-01`) e a lista exata de missões concluídas
  **não são recuperáveis** — comunicado explicitamente na tela de sucesso.
  - **`confirmarInscricao`:** bloqueio por nome duplicado agora primeiro tenta recuperar via
    WhatsApp digitado no próprio formulário; só mantém o erro seco se não bater.
  - **`aceitarConvite` — corrige um buraco real encontrado nesta etapa:** antes só verificava
    duplicidade por `memberId`, então aceitar convite num aparelho novo **criava um segundo
    participante com o mesmo nome**, silenciosamente. Agora verifica `buscarCadastroExistente`
    antes de criar; se encontrar, recupera em vez de duplicar.
  - **`renderTelaConvite`:** ganhou campo de WhatsApp (antes só pedia nome) — pré-preenchido com
    o que o emissor do convite informou (opcional, só conveniência), mas a identidade é sempre
    confirmada pelo valor que quem aceita digitou/corrigiu na própria tela.
  - Testado ao vivo: WhatsApp errado bloqueia sem oferecer recuperação; WhatsApp certo recupera
    (memberId trocado, XP/estudos/streak restaurados, sem duplicar) tanto via inscrição quanto
    via convite; pessoa genuinamente nova (nome parecido, WA diferente) continua sendo cadastrada
    normalmente, sem falso positivo.
- **FUNC-01** — 4 funções duplicadas por reescritas anteriores não removerem a versão antiga:
  `openComunidade` (9166/9412), `enviarGratidao` (9286/9472), `sendMyPrayer` (5119/5638),
  `clearMyPrayer` (5141/5653) — só a segunda declaração de cada uma está ativa
- **STR-01** — `revisao.html` — arquivo órfão, duplicado 4× internamente, de origem cruzada com outro repositório
- **STR-02** — `.claude/launch.json` aponta para Python inexistente nesta máquina
- **STR-03** — Link de fonte duplicado em `revisao.html`
- **STR-04 — RESOLVIDO (2026-07-01).** `manifest.json` criado (nome "PEQUENO GRUPO SILVESTRE"),
  ícones próprios gerados a partir do logo já usado no app (`icon-192.png`/`icon-512.png`, na raiz
  do repositório) e `<link>`s do `<head>` apontando para os arquivos locais — não depende mais do
  repositório `jornada-discipular`. Acompanha um botão "📲 Instalar na Tela Inicial" na tela de
  boas-vindas (`beforeinstallprompt` com fallback de instruções para iOS/Android sem suporte).
- **STR-05** — `TUTOR_PANEL_URL` declarada, nunca chamada

### 🔵 Decisões arquitetônicas (não são defeitos)
- **ARCH-01** — Diário Espiritual e decisões pessoais são privados e só locais ao aparelho —
  decisão deliberada, confirmada pelo próprio texto do app ("Diário Privado"). Melhoria futura
  possível: backup/exportação privada, sem alterar a confidencialidade.

### ✅ Concluído nesta auditoria — sem pendência
- **CJ-01** — Encerrar parceria do Companheiro de Jornada e formar uma nova. Confirmado **já
  implementado** (`removeCompanion()`) por teste ao vivo em ambiente isolado da rede: vínculo
  desfeito para os dois lados, histórico/XP/estudos intactos, ambos livres para nova parceria.
  Único ponto em aberto é cosmético: renomear o botão "🔄 Trocar companheiro" para algo como
  "Encerrar parceria" (sugestão de UX, não correção).

## Próximas decisões pendentes do usuário

**Ordem de prioridade combinada (atualizada 2026-07-01):**
1. ✅ **`PERM-01`** — autenticação do Painel Tutor/Coordenador. Feito.
2. ✅ **`DB-01`** — 1 PG por colaborador/coordenador, com confirmação explícita. Feito.
3. ✅ **`DB-02`** — migração para `memberId` na sincronização de progresso. Feito.
4. ⏸️ **`DB-03`** — reavaliado, adiado deliberadamente (ver nota acima; residual só em Tutores, sem impacto na operação).
5. ✅ **`DB-04`** — Campanhas (Embaixadores) sincronizadas via `g.campanhas`. Feito.
6. ✅ **`IDENT-01`** — Recuperação de Identidade do Colaborador. Feito.
7. ✅ **Limpeza de código morto** (`FUNC-01`, `STR-01` a `STR-05`). Feito em 2026-07-02.
8. ✅ **Apagar grupos de teste 2–6** (preservando o 1). Feito em 2026-07-02.
9. ✅ **`RC1`** — Release Candidate declarada em 2026-07-02 (ver seção **Release Candidate RC1**
   abaixo). Homologação operacional é a atividade atual.

**Decisões de contexto ainda em aberto:**
6. ✅ **Respondida (2026-07-02):** sim, links antigos `?pg=N` foram distribuídos para pessoas reais
   (Grupo 1). Ação tomada: Grupo 1 resetado (ver "Estado dos dados na nuvem" acima) — recomeço
   oficial pela cadeia de convites nova, compatibilidade com `?pg=N` **encerrada** (não é mais
   necessária, já que ninguém mais depende do link antigo).
7. ✅ **Respondida (2026-07-02) — ⚠️ Homologação técnica realizada parcialmente.** Pelo histórico
   acompanhado, houve diversos testes técnicos e validações pontuais do Commit 1 (concorrência),
   mas **não uma homologação operacional formal** com usuários representativos usando o fluxo
   completo. A homologação operacional permanece pendente e será executada utilizando a RC1 (ver
   "Próxima atividade" abaixo).

## Release Candidate RC1 (declarada 2026-07-02)

A arquitetura está estabilizada. Correções estruturais concluídas, base de dados limpa, código
morto removido, fluxo antigo de ingresso (`?pg=N`) descontinuado e novo fluxo de convites
preparado para validação em campo.

- ✅ Correções estruturais concluídas (`PERM-01`, `DB-01`, `DB-02`, `DB-04`, `IDENT-01`)
- ✅ Banco consistente (grupos de teste limpos, Grupo 1 resetado, allowlist `tutores` intacta)
- ✅ `IDENT-01` concluído
- ✅ Dados de teste removidos
- ✅ Código morto eliminado
- ✅ Nenhuma função duplicada
- ✅ Nenhuma referência órfã conhecida
- ⚠️ Homologação operacional pendente — ver pendência 7 acima
- ✅ Pronta para homologação operacional

**Regra de disciplina a partir da RC1:** novas alterações devem ocorrer **apenas** para correção de
defeitos encontrados durante a homologação ou ajustes mínimos de usabilidade previamente
documentados (como o `UX-01`). Sem novas funcionalidades antes da homologação.

**Próxima atividade (exclusivamente operacional):**
1. Wladimir entra no app como Tutor.
2. Gera o convite do Coordenador.
3. Valida toda a cadeia: Tutor → Coordenador → Coordenador → Colaboradores → ingresso no grupo →
   mural de gratidão → pedidos de oração → progresso → sincronização entre dispositivos.
4. Qualquer defeito encontrado é registrado antes de se pensar em novas funcionalidades.
