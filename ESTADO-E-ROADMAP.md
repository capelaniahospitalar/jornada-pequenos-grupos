# Estado do Projeto Rocha — Handoff de sessão (atualizado 2026-07-18)

> Documento para retomar o trabalho em outra máquina/sessão. Cole o conteúdo de volta
> para o assistente ao recomeçar — a "memória" do assistente **não viaja entre máquinas**;
> só este arquivo (via GitHub) viaja. **Nenhuma alteração de código sem aprovação do desenho.**

## 📝 Registro retroativo — Ranqueamento entre PGs, Registro de Encontros, Lembrete ao PG, Trio (2026-07-16/17)

Entre a última atualização deste documento (2026-07-14) e esta (2026-07-18), o usuário fez **18
commits diretamente** pelo outro computador, sem passar por sessão do assistente — este documento
ficou parado 4 dias sem refletir esse trabalho (repetição do padrão já visto em 07-09 e 07-13/14).
Registrado por leitura completa dos 18 diffs em 2026-07-18; nenhum teste em preview/produção feito
por este assistente nesta revisão. Detalhamento completo no `CHANGELOG.md` (entrada
`[2026-07-16/17]`); resumo aqui:

- **Novo — Ranqueamento Saudável entre PGs:** já homologado e documentado à parte, em detalhe
  arquitetural, no novo `ARCHITECTURE.md` (`v3.4a.1-homologado`) — índice de maturidade discipular
  (`pgIMD`, 5 dimensões) + motor de classificação (`classificarPgs()`), somente leitura, exclusivo
  Tutor/Coordenador. Consultar `ARCHITECTURE.md` para arquitetura; não duplicado aqui.
- **Mudança de regra — Registro de encontros do PG:** a pergunta Sim/Não de frequência mensal foi
  substituída por registro individual de cada encontro (data + presentes), com medidor visual
  "meta vs. realizado" no relatório. `reunioesMes` mudou de formato de novo (era `{aconteceu}`,
  passou por `{vezes}`, agora é `{encontros: [...]}`) — terceira mudança de formato deste campo em
  menos de uma semana; qualquer relatório ou export que dependa do formato antigo precisa ser
  conferido antes de reusar.
- **Novo:** lembrete de reunião por WhatsApp por participante (Painel do Tutor/Coordenador); aviso
  de LGPD/participação voluntária no Painel do Discípulo; opção de trio (3 pessoas) no Companheiro
  de Jornada quando o PG tem número ímpar; edição de dia/horário de reunião, saída da função de
  Coordenador e troca de Tutor direto do Painel.
- **Pendência aberta por este achado (repetição do padrão de 07-09 e 07-13/14):** se o usuário
  fizer mais mudanças direto pelo GitHub fora de uma sessão do assistente, avisar no início da
  próxima sessão para não perder o rastro de novo — já é o terceiro lote seguido nesse padrão.

## 🚨 BUG-TUTORES-CONVITES — RESOLVIDO (2026-07-10)

Achado em campo durante a homologação real (Grupo CAPELANIA, 4 capelães já usando o app): o Tutor
relatou que pedidos de oração e gratidões pararam de aparecer no aparelho dele, e que o Companheiro
de Jornada dizia que ele não pertencia ao grupo. A investigação revelou um bug bem mais grave e sem
relação direta: **`fbWriteGrupos()` gravava no Firestore via `PATCH` sem `updateMask`** — sem essa
máscara, o Firestore substitui o documento inteiro pelos campos enviados, apagando qualquer campo
omitido. `trySaveGrupos()` (toda ação comum do app: gratidão, oração, missão, Embaixadores,
progresso etc.) nunca reenviava `convites`, e só reenviava a allowlist `tutores` se ela já estivesse
carregada na memória do aparelho. **Confirmado por leitura direta da produção:** o campo `tutores`
estava completamente ausente da nuvem — qualquer um dos 4 capelães, num aparelho novo, teria o
acesso `?tutor` recusado por falta de allowlist. `dados` (grupos/participantes) estava intacto.

**Correção (commit `a970fde`, publicada):** `fbWriteGrupos()` agora monta `updateMask.fieldPaths`
só com os campos realmente incluídos na gravação (`dados`+`ts` sempre; `tutores`/`convites` só
quando fornecidos) — uma gravação que não inclui esses dois campos agora **deixa-os como estão na
nuvem**, em vez de apagá-los. Testado no preview (fetch interceptado, sem tocar produção): máscara
correta nos dois cenários (com e sem tutores/convites); nenhuma mudança de assinatura, todos os
chamadores existentes continuam compatíveis. **Restauração de dados** (autorizada explicitamente
pelo usuário, lista de 4 nomes/WhatsApp confirmada antes de gravar): backup prévio em
`PRE-RESTAURACAO-TUTORES-2026-07-10.json` + gravação de um único campo (`tutores`) com pré-condição
de concorrência fresca; confirmado por releitura que `dados`/`convites` ficaram intocados.

**Causa do sintoma original (mural/Companheiro sumidos só no aparelho do Tutor):** sem relação com
o bug acima — o aparelho dele havia perdido localmente o vínculo com o grupo (`Meus Vínculos`),
provavelmente por `?resetar`/limpeza de cache depois de já ter entrado como participante; o login
de Tutor (`?tutor`, separado) continuou funcionando, mascarando o problema. Confirmado que os
outros 3 capelães viam tudo normalmente nos aparelhos deles. Resolvido operacionalmente: o Tutor
recebeu um novo convite e reentrou com nome+WhatsApp iguais aos originais — o sistema reconheceu o
cadastro existente e recuperou o vínculo, sem duplicar nem perder o pareamento de Companheiro já
feito com a Coordenadora.

**Bug relacionado corrigido junto (mesmo commit):** "Cancelar minha inscrição"
(`removerDoGrupoAtual`) já estava documentado como o "Achado de campo — deadlock" abaixo (ver seção
"Roadmap") — corrigido agora: nova função `removeVinculo(grupoNum)` limpa também o registro em
`Meus Vínculos` ao cancelar, então o botão deixou de ser reproduzível como bug. Testado no preview
(rede neutralizada): depois de cancelar, `loadMeuGrupo()` volta vazio e a tela avança para "Convite
necessário" corretamente, em vez de ficar presa num estado inconsistente.

## 📝 Registro retroativo — Painel do Discípulo, Relatórios Mensais, Embaixadores (2026-07-09)

Entre a última atualização deste documento (2026-07-05) e esta (2026-07-10), o usuário fez **10
commits diretamente** (671 linhas em `index.html`, sem passar pelo processo usual de Mapa de
Impacto → aprovação → implementação por etapas). Investigado, confirmado com o usuário e testado
no preview em 2026-07-10 (rede neutralizada, dados fictícios, nenhuma escrita real ao Firebase) —
ver detalhamento completo no `CHANGELOG.md` (entrada `[2026-07-09]`). Resumo:

- **Novo:** Relatórios Mensais no Painel do Tutor (frequência do PG + participação nos
  Embaixadores, com envio por WhatsApp); campo `g.reunioesMes` sincronizado com merge por mês.
- **Mudança de regra de negócio:** Embaixadores da Esperança deixou de ser 3 campanhas fixas
  (jul/ago/set, progresso só local) e virou um evento recorrente mensal por participante
  (`p.embaixadores`), sincronizado de verdade — confirmado intencional com o usuário.
- **Reorganização estrutural da Home:** streak-card removido; Atributos ("Crescimento cristão"),
  Obstáculos, Diário e Companheiro migraram para dentro do novo "Painel do Discípulo". **O Mapa de
  Discipulado (gráfico radar) foi removido, não só movido** — confirmado intencional.
  Diário/Companheiro agora "lembram" se foram abertos da Home ou do Painel para o botão Voltar
  retornar ao lugar certo.
- **Novo:** botão "🔄 Atualizar" na Home (recarrega com anticache, útil no PWA do iPhone) e botão
  de instalar o app também na tela de aceite de convite.
- **Correção de bug pré-existente:** missão "Escolher Tutor de Jornada" nunca podia ser concluída
  (checava `ST.tutor`, que nunca é definido); agora checa vínculo com um Pequeno Grupo.
- **DEDUP-01:** evita criar identidade duplicada de Tutor/Coordenador quando a pessoa digita uma
  variação do nome — converge pelo WhatsApp já cadastrado em qualquer grupo.
- **Testado no preview (2026-07-10):** todos os pontos acima, sem erros de console, sem escrita
  real ao Firebase. Não exercitados ao vivo (risco baixo): clique real em "🔄 Atualizar" (recarrega
  a página de propósito, por isso não testado contra produção) e o fluxo completo de criação de
  senha do Tutor com `DEDUP-01` (revisado só por leitura de código).
- **Pendência aberta por este achado:** este documento e o `HOMOLOGACAO-RC1.md` não foram mantidos
  atualizados durante trabalho feito fora de uma sessão do assistente — se o usuário fizer mais
  mudanças direto pelo GitHub, avisar no início da próxima sessão para não perder o rastro de novo.

## 📝 Registro retroativo — correções de campo + "Desafios do Discipulado" (2026-07-13/14)

Entre a última atualização deste documento (2026-07-10) e esta (2026-07-14), o usuário fez **9
commits diretamente** (296 linhas em `index.html`), a maioria através de sessões do assistente que
geraram mensagens de commit detalhadas (revisado por leitura completa dos diffs em 2026-07-14, sem
achado que contradiga as mensagens). Nenhum desses commits toca nos itens grandes ainda pendentes do
roadmap (`C3`-tombstone, `C4`-debounce, homologação de campo da RC1, `PERM-02`, `DB-03`) — são
correções de bugs de campo e funcionalidades novas, à parte. Resumo:

- **Correção de bug (concorrência):** `confirmarCriarPg()` agora espera (`await`) a gravação do
  novo Pequeno Grupo chegar na nuvem antes de gerar o convite do Coordenador — antes, o
  `syncFromFirebase()` seguinte podia ler um instantâneo anterior à criação e reverter o nome do
  grupo localmente, fazendo o convite sair com dados de outro PG (achado de campo). `saveGrupos()`
  passou a retornar a Promise de `saveGruposToFirebase()`.
- **Correção de bug:** senha do Painel do Tutor/Coordenador era indexada pelo nome digitado
  exatamente como veio (case-sensitive) — uma capitalização diferente do nome (variação de teclado
  do celular) fazia o app tratar como pessoa nova e pedir senha nova de novo. Agora o nome é
  normalizado (trim + minúsculas) antes de guardar/consultar.
- **Correção de bug:** reabrir o app pelo atalho do celular só buscava dados novos da nuvem se a
  tela "Grupos" estivesse aberta — Mural e Companheiro de Jornada ficavam desatualizados até um
  toque manual em "Atualizar". Agora a busca acontece sempre que o app volta a ficar visível
  (`visibilitychange`), independente da tela aberta.
- **Novo:** login do Painel do Tutor/Coordenador passou a persistir entre visitas
  (`ST.tutorPanelAuth`) — não pede nome/WhatsApp/senha de novo a cada acesso; "🚪 Sair" continua
  sendo o jeito de encerrar a sessão manualmente.
- **Novo:** botão "✎ Editar nome do grupo" no Painel do Tutor/Coordenador (achado de campo: nome
  digitado errado na criação, sem forma de corrigir depois).
- **Novo:** gratidões e pedidos de oração do Mural agora expiram e são apagados 7 dias após a
  publicação (`podarGratidoesExpiradas`) — evita acúmulo permanente no documento compartilhado da
  nuvem. Poda roda ao carregar grupos, ao receber dados da nuvem e ao publicar um novo post.
- **Reorganização estrutural — nova página "🏆 Desafios do Discipulado":** "Jornada de
  Conquistas" e "Missões" saíram da Home; "Obstáculos Espirituais" saiu do Painel do Discípulo;
  as 2 missões semanais dos Embaixadores (antes só texto no Companheiro de Jornada) viraram botões
  de 15 XP cada, resetando toda semana. Tudo migrou para a página nova, acessível por um botão
  próprio na Home. A confirmação mensal de participação nos Embaixadores (40 XP) também migrou para
  lá. "Minha missão desta semana" (card duplicado dentro do Companheiro de Jornada) foi removido —
  a mesma informação já vive na página nova.
- **Ajuste de texto:** missão "Visitar outro Pequeno Grupo em Julho" reformulada para "Enviar
  delegação representando o PG para visitar outro Pequeno Grupo, e orar por eles."
- **Pendência aberta por este achado (repetição do padrão de 07-09):** se o usuário fizer mais
  mudanças direto pelo GitHub fora de uma sessão do assistente, avisar no início da próxima sessão
  para não perder o rastro de novo.

## ⭐ STATUS ATUAL — retomar por aqui (2026-07-05)

**Onde estamos:** produção reinicializada (**MARCO ZERO**, 2026-07-05) — 50 grupos vazios, Grupo 1
"CAPELANIA" apagado, allowlist dos 4 tutores preservada, sem convites. Backup:
`PRE-HOMOLOGACAO-2026-07-04.json` (Desktop, fora do repo — contém PII). Detalhes na seção
"Estado dos dados na nuvem".

**Trabalho recente (todos commitados):** UX-01 (Painel da Comunidade consolidado na Home),
ARCH-04 (página institucional terminal — acesso 100% por convite, sem entrada pública), UX-04
(Home reorganizada em 7 blocos temáticos), Item 4B (experiência do Coordenador revalidada —
7/7 checkpoints por trilha de código + simulação isolada), e o Marco Zero.

**PII no histórico do Git:** `_diag_cloud.json`/`_prod_atual.json` (WhatsApp dos 4 capelães) foram
commitados no passado (`70f8abc`). **Decisão do usuário = Opção A:** removidos do projeto +
`.gitignore` (feito). **Rewrite de histórico NÃO agora** — reavaliar na v1.0.

**PRÓXIMO PASSO — homologação operacional (atividade atual):**
1. **Resetar** cada aparelho de teste (`<url>?resetar` + limpar cache + remover PWA) — como celular novo.
2. Rodar o roteiro do **`HOMOLOGACAO-RC1.md`** (Fases 0–5, contra a **produção real**, pelo **link do
   Tutor**). Há um **"Roteiro rápido"** no topo desse arquivo para seguir com os celulares na mão.
3. Registrar cada falha como `BUG-XXX` no `HOMOLOGACAO-RC1.md` — **sem corrigir durante a homologação.**
4. Depois: corrigir os `BUG-XXX` em lote → declarar versão estável → só então a reorganização da
   navegação por páginas (evolução de UX; não bloqueia a validação do fluxo principal).

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

## Achado de campo (deadlock) — RESOLVIDO (2026-07-10)
Ao usar **"Cancelar minha inscrição"** (`cancelarInscricao`), o app apagava a chave antiga
(`localStorage 'jdpg_meu_grupo_v1'`) e removia a pessoa da lista de participantes na nuvem — mas
**não atualizava `Meus Vínculos`**, a lista nova criada na Etapa 1. Corrigido junto do
`BUG-TUTORES-CONVITES` (ver seção no topo do documento): nova função `removeVinculo(grupoNum)`
limpa também o vínculo daquele grupo; `removerDoGrupoAtual()` passou a chamá-la. O risco de
"ressurreição" pelo merge deixa de se manifestar nesse caminho porque o vínculo local não fica mais
órfão. **Continua valendo para uma versão futura:** um tombstone de verdade (`C3` abaixo) ainda é a
solução estrutural mais robusta para remoção concorrente entre dispositivos — esta correção resolve
o sintoma de campo, não substitui o `C3`.

## Roadmap
Cada commit é precedido de **Mapa de Impacto** (análise, sem código); tombstone também leva **ADR**.
- **C1 — Concorrência:** FEITO (ver acima).
- **Etapa 1 (identidade) + Etapa 2 (convites):** FEITO (ver acima) — cobre o que antes era descrito
  como "C2 — Modelo Meus Grupos", mas foi além (também substituiu o sistema de convite/link).
- **C3 — Tombstone transitório: FEITO (2026-07-23).** Remoção vira `removed:true` (+ `updatedAt`
  no topo do participante, separado de `progresso.updatedAt`); `mergeGruposData` passa a comparar
  `Math.max(updatedAt, progresso.updatedAt)` dos dois lados — remoção × edição, mais recente vence
  — resolvendo a ressurreição do achado de campo acima. Nova `podarParticipantesRemovidos()` apaga
  o tombstone de vez após 30 dias (mesmo padrão de `podarGratidoesExpiradas`); nova
  `participantesAtivos(g)` filtra removidos em ~10 pontos de exibição/contagem (painel do tutor,
  ranking IMD, tela de inscrição, card de progresso). Sem script de migração — dado antigo sem os
  campos novos é tratado como não removido. Comportamento gated por `FB_FLAGS.useTombstone`
  (`true` por padrão) — desligar reverte ao hard-delete antigo em 1 linha. Mapa de Impacto + ADR
  aprovados pelo usuário antes do código. **Testado no preview** (servidor estático local, rede do
  Firebase não tocada): sem erros de console; lógica de filtro/poda/merge validada isoladamente no
  console do navegador (ver `CHANGELOG.md`). **Não testado ao vivo** contra dois aparelhos reais
  (residual: se algum dispositivo ficar mais de 30 dias offline com um participante já removido em
  outro aparelho, pode ressuscitá-lo ao sincronizar — risco aceito na decisão dos 30 dias).
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
- ✅ **UX-01 — Consolidação do módulo comunitário na Home — CONCLUÍDO (2026-07-03)** (registrado 2026-07-02).
  Achado durante o C5: a Home tem hoje **dois botões** que levam para a mesma tela — "Mural de
  Gratidão" (dentro de `renderGruposBtnHome`, só aparece se já estiver num grupo) e "Comunidade"
  (`renderComunidadeBtnHome`, sempre aparece, com contador "X compartilhada(s) por você"). Esse
  contador lê de um `localStorage` (`loadGratidoes`/`GRAT_KEY`) que **não é mais escrito por
  ninguém** desde que o mural virou por grupo/Firebase — fica travado permanentemente. Deliberadamente
  **não mexido no C5** (removê-lo muda a tela inicial, deixa de ser limpeza pura). Escopo proposto
  para quando for feito: eliminar a duplicidade, unificar num único botão, remover o contador
  baseado em `localStorage` (ou trocar por um derivado do Firebase). Planejado para depois da RC e
  da homologação, como rodada de refinamento de UX — não antes.
  - **Implementado (2026-07-03):** os dois cards da Home ("Comunidade" em `renderComunidadeBtnHome`
    e "Mural de Gratidão" dentro de `renderGruposBtnHome`, ambos abrindo o MESMO `openComunidade`)
    foram consolidados em **um único card "❤️ Painel da Comunidade — [nome do PG]"** (nome dinâmico),
    subtítulo "Gratidões • Orações • Celebrações". `openComunidade()` NÃO foi tocado — ele já reúne
    gratidões, pedidos de oração e celebrações (estas via patch `injectCelebsIntoComunidade`).
    Contador morto (`totalGrat`/`loadGratidoes`) removido do card (função não apagada — limpeza fora
    de escopo). Chip "Grupo N — Nome" preservado. **Só UI** — nenhuma regra de negócio, permissão,
    Firebase, convite ou banco tocados. Validado no preview (rede neutralizada): 1 card só;
    título/subtítulo corretos; `openComunidade` abre mural + celebrações sem erro; console limpo.
    Diff só em `index.html`. Decisão de nomenclatura do usuário: marcar o próprio `UX-01` como
    concluído em vez de abrir um `UX-03`, para não fragmentar uma melhoria já prevista.
- **`ATIVACAO-01` — Criação de Pequenos Grupos pelo Tutor — Etapa 2 da RC2 CONCLUÍDA
  (2026-07-02).** Um Tutor autenticado pela allowlist (Etapa 1, `ARCH-02`) agora pode criar PGs de
  verdade, sem reativar nenhum autocadastro.
  - **Implementado:** `renderCriarPgForm(nomeTutor, errorMsg)` (nome do grupo obrigatório, dia/
    horário opcionais) + `confirmarCriarPg(nomeTutor)` — usa `getProximoGrupoVazio()` (já existia,
    reaproveitada) pra achar o próximo slot livre dos 50 fixos, preenche `nome`/`diaReuniao`/
    `horaReuniao`/`tutor` e grava com `saveGrupos()` — herda de graça a trava de concorrência já
    testada (`saveGruposToFirebase`: precondição + 3 tentativas + backoff), **sem nenhum código
    novo de concorrência**.
  - **Estado sem grupos:** botão "➕ Criar Primeiro Pequeno Grupo". **Estado com 1+ grupos:** lista
    normal + botão "➕ Criar outro Pequeno Grupo" — **só visível para quem é `g.tutor` de pelo
    menos um desses grupos** (`souTutorDeAlgum`); um Coordenador autenticado no mesmo painel nunca
    vê esse botão — não pode criar grupo.
  - **Sem duplicar fluxo:** uma única função de criação serve os dois estados (zero e 1+ grupos).
  - **Placeholder da Etapa 1 removido:** `abrirCriarPrimeiroPg()`/`alert()` não existem mais no
    código.
  - **Testado (preview, dados fictícios):** zero grupos → cria o primeiro corretamente · Tutor com
    grupo → botão "criar outro" aparece e funciona (2º grupo criado corretamente) · Coordenador
    (não-tutor) → botão não aparece · console limpo, sem requisições falhas.
  - **Fora do escopo (decisão explícita):** convite automático do Coordenador **não** entra nesta
    etapa — ver `ARCH-03` abaixo.
- **`ARCH-03` — Identidade dupla de "quem é o Tutor" — Etapa 3 da RC2 CONCLUÍDA (2026-07-02).**
  Existiam duas checagens de autoridade de Tutor que não se falavam: `getGruposDoResponsavel()`
  (Painel) via `g.tutor` string; `getMinhaFuncaoNoGrupo()` (usada por `gerarConvite()`) via lista
  de `participantes`. Como o `ATIVACAO-01` deliberadamente não cria participante pro Tutor, ele não
  conseguia gerar convite de Coordenador. **Resolvido sem alterar `getMinhaFuncaoNoGrupo()`**
  (evita risco no fluxo comum `openShare()`) e **sem criar Tutor artificial em `participantes[]`**:
  - `gerarConvite()` (branch `coordenador`): autoridade por 2 vias — participante papel `'tutor'`
    (legado, intocado) OU nova função `souTutorAdminDoGrupo(gLocal)` (`ST.tutorPanelAuth` bate com
    `g.tutor`, comparação normalizada). Quando só a via admin autoriza, `deNome` do convite usa o
    nome canônico (`ST.tutorPanelAuth`), não a identidade de participante (que pode nem existir).
  - **Contrapartida obrigatória em `validarConviteParaAceite()`** (achado durante o desenho, sem a
    qual o convite gerado nunca poderia ser aceito): mesma lógica de 2 vias no lado do aceite —
    participante papel `'tutor'` OU `g.tutor` (fresco) batendo com `inv.deNome` (gravado na
    emissão). Fluxo de `colaborador` (emitido por Coordenador) **intocado**.
  - **Limitação conhecida, documentada (não bloqueante):** a via admin usa **nome canônico**, não
    um identificador estável — `inv.deNome` é comparado como string. Melhoria futura: migrar para
    um ID estável da allowlist em vez de nome.
  - **Testado:** convite gerado via admin (zero participante) ✅ · aceite desse convite pelo
    Coordenador ✅ (papel + participante criados corretamente) · fluxo legado via participante
    (Wladimir-style) sem regressão ✅.
  - **Orquestração (convite automático ao criar o PG):** `confirmarCriarPg()` chama
    `gerarConvidarCoordenadorAutoEExibir()` logo após `saveGrupos()` — sem ação extra do Tutor.
    Antes de gerar, verifica se já existe convite `pendente` (não expirado) pra aquele grupo/função
    e **reaproveita** em vez de duplicar. Sucesso → tela com link pronto + campo opcional de
    WhatsApp do Coordenador + botão que abre o WhatsApp já preenchido (reaproveita
    `textoConviteWhatsApp()`, mesmo texto padrão de sempre). **Falha nunca fica silenciosa:** tela
    própria explicando que o PG foi criado mas o convite não, com botão "🔁 Tentar gerar o convite
    novamente" (chama a mesma função). Testado: geração com sucesso, reaproveitamento de convite
    existente (não duplica), falha simulada de rede + retry funcionando.
  - **Residual não resolvido (fora do escopo desta etapa, por instrução explícita do usuário):** se
    o Tutor sair da tela de falha sem clicar em "tentar novamente", hoje não há outro ponto de
    entrada no Painel pra gerar esse convite depois — `renderTutorGrupoDetalhe` não tem esse botão.
    Construir esse caminho permanente é "adequação do fluxo do Coordenador" (item 4 da ordem da
    RC2), fora do escopo da Etapa 3.
- **FUNC-02 — Remover definitivamente o fluxo legado de autocadastro (novo, 2026-07-02).**
  O `BLOCKER-001` fechou o **acesso** ao autocadastro (via `openGrupos()` redefinida), mas
  deliberadamente não apagou o código: `confirmarInscricao()`, `selectProfile()`, `startJourney()`
  e o HTML da tela antiga (`screen-welcome`, passos 2 e 3) continuam no arquivo, inertes (nenhum
  caminho os alcança mais). Remoção física fica para uma limpeza futura, no mesmo espírito do
  `FUNC-01`/`STR-01` a `STR-05` já feitos — não é urgente, não representa risco enquanto
  inalcançável.
- **UX-02 — Ocultar "Convidar amigo" para colaboradores (novo, 2026-07-02).** Achado numa
  demonstração da Home pós-`BLOCKER-001`: o botão "🔗 Convidar amigo" (`openShare()`, linha 2970)
  aparece pra **todo mundo** na Home, mas só funciona pra Tutor/Coordenador — um Colaborador que
  clica cai numa tela dizendo "Apenas o Coordenador do grupo pode convidar novos integrantes".
  **Não é bug funcional nem falha de segurança** — a autorização já está correta nos dois níveis
  (`openShare()` e `gerarConvite()` checam `getMinhaFuncaoNoGrupo` e bloqueiam corretamente); é só
  a Home oferecendo uma ação que aquele papel não pode executar.
  - **Severidade:** Baixa. **Tipo:** UX (não `BUG-XXX`).
  - **Comportamento esperado:** Tutor → botão visível; Coordenador → botão visível; Colaborador →
    botão **nem renderizado** (não travado/desabilitado — simplesmente não existe pra esse papel).
  - **Renomear** "Convidar amigo" → **"Convidar participante"** (o texto antigo é de antes do
    modelo por Pequenos Grupos).
  - **Ideia maior anotada para o futuro (não decidida ainda):** revisar a Home inteira por
    permissão de papel — Tutor vê Painel do Tutor + Convidar + Mural + Diário + Estudos +
    Progresso; Coordenador vê tudo isso exceto o Painel; Colaborador vê só Mural + Diário +
    Estudos + Progresso. Reduz ações impossíveis na tela, mas é um escopo bem maior que só
    esconder um botão — avaliar separadamente, não faz parte do UX-02.
  - **Decisão:** registrado, **não implementado agora**. Entra na fila de UX (junto do `UX-01`)
    para uma próxima RC ou a primeira versão estável, condicionado a não haver achados mais
    críticos nos testes de campo em andamento.
- **`ARCH-02` — Separar o acesso administrativo (Tutor) da jornada do participante — Etapa 1
  CONCLUÍDA (2026-07-02).** *(Nota de nomenclatura: já existia um `ARCH-01` no documento, sobre o
  Diário Espiritual — item não relacionado, da auditoria de 2026-07-01. Este é numerado `ARCH-02`
  para não colidir.)* Achado ao questionar a necessidade da tela "Convite necessário": ela era um
  **beco sem saída** — sem caminho para o Painel do Tutor/Coordenador para quem nunca tinha um
  grupo. Rastreado: `openTutorPanel()` só era chamado pelo botão da tela antiga de boas-vindas
  (morta, `FUNC-02`) e pelo botão da Home (só existe depois de `welcomeDone=true`). Além disso,
  mesmo com uma porta nova, `tutorIdentificar()` dependia de `getGruposDoResponsavel()` — que só
  encontra quem **já** aparece como `g.tutor`/`g.coordenador` em algum grupo, deixando um Tutor
  novo (sem grupo ainda) sem saída mesmo com link dedicado.
  - **Decisão de arquitetura (usuário):** a allowlist `tutores` passa a ser a **única fonte de
    verdade** para autenticar um Tutor — a existência de grupos é consequência da autenticação,
    nunca o mecanismo dela. Identidade real = WhatsApp (não o nome, que é só exibição).
  - **Implementado:**
    - Novo ponto de entrada `?tutor` em `initApp()` — funciona independente de `welcomeDone`/
      dispositivo, checado antes do roteamento normal.
    - `estaNaAllowlistTutores()` passou a retornar o registro encontrado (nome canônico incluso)
      em vez de só `true`/`false` — mudança retrocompatível (objeto é truthy, `null` é falsy),
      sem alterar o caller existente (`gerarConvite`).
    - `tutorIdentificar()` não bloqueia mais quem não tem grupo — segue pro mesmo fluxo de
      primeiro acesso de sempre.
    - `tutorConfirmarCriarPass()` ganhou um segundo caminho de prova de identidade: se não há
      registro de participante (`verificarWhatsappDoPapel` falha por `sem_registro`), tenta a
      allowlist `tutores` como prova alternativa válida — usa o nome canônico da allowlist daí
      em diante.
    - `renderTutorGruposList()`: o estado "sem grupo" deixou de ser um erro — agora mostra "Você
      está autorizado como Tutor, mas ainda não tem nenhum Pequeno Grupo" + botão **"➕ Criar
      Primeiro Pequeno Grupo"** (placeholder — a criação de fato é a próxima etapa, `ATIVACAO-01`).
    - **Sem duplicar login:** em vez de uma função paralela pra cada origem, uma única variável de
      controle (`tutorPanelOrigem`, `'home'`|`'tutor'`) decide só a exibição do botão "voltar" do
      cabeçalho (oculto via `?tutor`, já que não há Home pra voltar) — todas as funções de
      identificação/senha/dashboard continuam únicas, reaproveitadas por ambas as origens.
  - **Testado (preview, dados fictícios, sem tocar produção):** fluxo antigo via Home com Tutor
    já-com-grupo intacto · `?tutor` com o mesmo Tutor (mesmo caminho, dashboard normal) · `?tutor`
    com Tutor novo na allowlist e zero grupos → CTA de criar primeiro PG · `?tutor` com dado que
    não bate em nada → "Acesso restrito" · botão voltar oculto só na origem `?tutor` · console
    limpo, sem requisições falhas.
  - **Fora do escopo desta etapa (fica para as próximas, ordem já definida):** criação de fato do
    PG (`ATIVACAO-01`), convite automático do Coordenador, remoção física da tela "Convite
    necessário" e do legado de autocadastro (`FUNC-02`), Home por papel (`UX-01`/`UX-02`).

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

### MARCO ZERO — Produção reinicializada (2026-07-05)
Estado inicial da homologação operacional. Gravado via REST direto (fora do app) com **`updateMask`
(só `dados`+`ts`)** + pré-condição `currentDocument.updateTime` (HTTP 200) — `tutores`/`convites`
intocados. Backup prévio: `PRE-HOMOLOGACAO-2026-07-04.json` (Desktop, fora do repo — contém PII).
Verificado por releitura:
- **50 grupos vazios** — o Grupo 1 "CAPELANIA" foi zerado; deixa de ser exceção pré-semeada.
- nenhum participante · nenhum coordenador · nenhum tutor associado a grupo · nenhum convite ativo.
- **allowlist dos 4 tutores PRESERVADA** (Felipe, Ualace, Renan, Wladimir) — é autorização, não grupo.

A partir deste ponto, **todo grupo nasce EXCLUSIVAMENTE pelo fluxo oficial:**
`Link do Tutor → cria o PG → convida o Coordenador → Coordenador convida Participantes`.
Não existe mais nenhum "Grupo CAPELANIA" pré-existente. (Resposta a "qual era o estado inicial da RC1?".)

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
- ✅ **`BLOCKER-001` resolvido (2026-07-02, commit `188a56f`)** — fluxo antigo de autocadastro
  fechado antes do início da homologação (ver `HOMOLOGACAO-RC1.md`); 6/6 testes de regressão
  aprovados. Não conta como bug de homologação — foi identificado e corrigido antes de abrir os
  testes de campo.
- ⚠️ Homologação operacional pendente — ver pendência 7 acima (esta é a atividade atual)
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

## RC1 encerrada — RC2 iniciada (decisão de gestão, 2026-07-02)

**A homologação da RC1 foi oficialmente encerrada pelo usuário.** Ela cumpriu seu objetivo: a
revisão da tela de entrada revelou resquícios importantes da arquitetura antiga (a lacuna do
`ARCH-02` — Tutores novos sem caminho de acesso). Esse achado mudou o entendimento do sistema e
justificou uma revisão estrutural antes da implantação definitiva. **RC1 passa a ser um marco
histórico do projeto**, não mais o estado ativo.

**Desenvolvimento da RC2 iniciado formalmente.** Prioridade: eliminar definitivamente o paradigma
de autocadastro e consolidar a arquitetura 100% baseada em convites hierárquicos
(`Tutor → cria PG → convida Coordenador → aceita → convida Participantes → aceitam`).

**Ordem definida pelo usuário:**
1. ✅ `ARCH-02` — ponto de entrada exclusivo dos Tutores (`?tutor`, independente de dispositivo/
   `welcomeDone`, validado contra a allowlist `tutores`). **Feito em 2026-07-02.**
2. ✅ `ATIVACAO-01` — fluxo de criação de Pequenos Grupos pelo Tutor. **Feito em 2026-07-02.**
3. ✅ `ARCH-03` + convite automático do Coordenador ao criar o grupo. **Feito em 2026-07-02.**
4. Adequar o fluxo do Coordenador — dividido em duas partes pelo usuário:
   - ✅ **Item 4A — botão permanente para (re)convidar o Coordenador — CONCLUÍDO (2026-07-03).**
     Fecha o buraco operacional que ficou da Etapa 3 (`ARCH-03`): se o Tutor saísse da tela de
     sucesso/falha sem completar o envio, não havia mais nenhum lugar no app para gerar esse
     convite depois. `renderTutorGrupoDetalhe(grupoNum, nome)` ganhou a variável
     `souTutorDesteGrupo` (`g.tutor` bate com o nome autenticado no painel) e, quando
     `!g.coordenador && souTutorDesteGrupo`, mostra o botão "🤝 Convidar Coordenador" —
     reaproveita `gerarConvidarCoordenadorAutoEExibir()` sem nenhum código novo (mesma
     reaproveitação de convite pendente, mesma tela de sucesso/falha já testadas na Etapa 3). A
     trava de autoridade já existe no backend (`gerarConvite`/`souTutorAdminDoGrupo`); o gate de
     UI é só para não oferecer um botão que sempre falharia para quem é apenas Coordenador do
     mesmo grupo. **Testado (preview, dados fictícios, com todas as funções de rede
     neutralizadas):** botão aparece só para o Tutor do grupo sem Coordenador ainda · botão some
     quando o Coordenador já está definido · botão some quando a pessoa logada é a Coordenadora
     (não a Tutora) daquele grupo · clique gera o convite e mostra a tela de sucesso normalmente ·
     console limpo.
   - **`BLOCKER-01` — fechamento de caminhos legados alcançáveis de ingresso e alteração de
     autoridade — CORRIGIDO (2026-07-03), aguardando commit.** Encontrado durante a auditoria de
     campo do Item 4B (ver abaixo): a tela legada `screen-inscricao`/`openInscricao(num)` (do
     autocadastro antigo) continuava **ativamente alcançável** pela Home normal — um chip
     (`onclick="openInscricao(meuGrupo.grupoNum)"`) para qualquer membro logado no seu próprio
     grupo. De dentro dela, dois vetores confirmados ao vivo:
     1. **Escalonamento de autoridade sem invite:** botões "Trocar" chamavam
        `iniciarTrocaPapel(grupoNum,'tutor'|'coordenador')` → `confirmarTrocaPapel()`, que gravava
        `g.tutor`/`g.coordenador` a partir de um campo de texto livre, **sem checar allowlist,
        convite ou autoridade**. Reproduzido: um Colaborador (papel mais baixo) conseguia se
        autonomear Tutor do próprio PG.
     2. **Reabertura do autocadastro:** um botão "Trocar" (`showScreen('grupos');
        renderGrupoList()`) reabria a grade completa dos 50 PGs — inclusive o próximo slot vazio
        — sem passar pelo `openGrupos()` já neutralizado pelo `BLOCKER-001`. Clicar num grupo (vazio
        ou de terceiros) caía em `confirmarInscricao()`, o formulário completo do autocadastro
        antigo (nomear grupo, virar tutor/colaborador sem convite).
     - **Correção:** `openInscricao(num)` agora checa `loadMeuGrupo()?.grupoNum === num` **antes**
       de qualquer outra coisa — se o grupo não é o meu, mostra a mesma tela "Convite necessário"
       do `openGrupos()`, em vez do formulário. Os 2 botões "Trocar" de papel (tutor/coordenador)
       foram removidos de `renderInscricaoBody`; as funções `iniciarTrocaPapel`/`confirmarTrocaPapel`
       foram removidas (sem outro caller). O botão que reabria a grade foi removido dos 2 lugares
       (cabeçalho de `screen-inscricao` e card do "já inscrito"). `cancelarTrocaPapel()` foi mantida
       (reusada pelo cancelar do formulário de troca de reunião, que não mexe em autoridade).
     - **Fora do escopo, mantido intacto:** troca de dia/horário de reunião (`iniciarTrocaReuniao`,
       não é escalonamento de autoridade); visualização informativa do grupo; sair do próprio grupo
       (`cancelarInscricao`, autosserviço sobre si mesmo). Nenhum formato de dado mudou — só
       caminhos de UI/lógica foram cortados.
     - **Testado (preview, dados fictícios, com as 4 funções de rede — inclusive `fbWriteGrupos` —
       neutralizadas):** Colaborador e Coordenador, cada um logado de verdade, não veem mais os
       botões de troca de papel · `openInscricao` num grupo vazio e num grupo populado de terceiros
       cai em "Convite necessário" · cadeia completa Tutor→Coordenador→Colaborador por convite
       testada de ponta a ponta e continua funcionando · troca de reunião testada e funcionando ·
       console limpo · nenhuma escrita real disparada ao Firebase durante os testes.
     - **Item 4B pausado durante a correção; retoma após o commit deste achado.**
   - ✅ **Item 4B — experiência completa do Coordenador — RECONFIRMADO (2026-07-03).** Revalidado
     com o código corrigido (pós-BLOCKER-01/UX-04), por **trilha de código + simulação isolada**
     (nuvem mockada em memória, `fbReadDoc`/`fbWriteGrupos`/`saveGruposToFirebase` neutralizados —
     **zero escrita em produção, sem reload durante o teste**). Os 7 pontos passaram:
     1. Tutor (admin, `ST.tutorPanelAuth` = `g.tutor`) gera convite de Coordenador → ok, link
        `?conv=`, texto WhatsApp padrão. 2. Coordenador aceita (`aceitarConvite`, com WhatsApp do
        `IDENT-01`) → papel `coordenador`, `g.coordenador` gravado. 3. Entra automaticamente no PG
        correto (`grupoAberto`/vínculo = grupo do convite). 4. Acesso ao Painel: `getGruposDoResponsavel`
        acha o grupo dele; `verificarWhatsappDoPapel` (PERM-01) libera com WhatsApp certo, bloqueia
        com errado, `sem_registro` p/ nome inexistente. 5. Gera convite de Colaborador → ok; Colaborador
        aceita → papel `colaborador`. 6. Painel da Comunidade abre sem erro. 7. Permissões: vê o Bloco
        6 "Liderança do Pequeno Grupo" (Convidar Participante + Painel do Tutor/Coordenador); NÃO
        consegue convidar Coordenador (só Tutor). Nenhum `BUG-XXX`/`BLOCKER` encontrado. **A prova
        final com 2 aparelhos reais é a homologação operacional (próximo item da fila).**
5. ✅ **Adequar o fluxo do Participante/Colaborador — CONCLUÍDO (2026-07-03).** Diagnóstico ao vivo
   (cadeia completa Tutor→Coordenador→Colaborador por convite) confirmou que a arquitetura já
   entregava tudo o que o checklist pedia, sem código novo necessário: entra automaticamente no
   grupo/papel corretos, sem seletor de grupo/papel no fluxo válido, não convida ninguém, não vê
   funções reais de Tutor/Coordenador (`openShare`/painel bloqueiam corretamente). Único achado real:
   - **`UX-LEGACY-01` — tela legada enganosa de escolha de papel ainda alcançável — CORRIGIDO
     (2026-07-03).** A tela antiga `screen-welcome` (Passo 2: "Serei o Tutor"/"Serei o
     Coordenador"/"Colaborador", `selectProfile()`) continuava alcançável por 2 botões — "← Voltar"
     no cabeçalho da Home e "Trocar" na tela do próprio grupo (ambos `showScreen('welcome')`).
     **Não era um `BLOCKER`** (testado ao vivo: `selectProfile('tutor')` só seta `ST.userProfile`,
     que não é mais lido por nenhum caminho ativo — `confirmarInscricao`, o único consumidor, já
     estava bloqueado pelo `BLOCKER-01`) — mas contradizia a arquitetura da RC2 e confundia o
     usuário oferecendo uma escolha que não fazia nada. **Correção:** os 2 botões foram removidos
     ([index.html:1660](index.html:1660) header da Home; botão "Trocar" na tela do grupo). Nenhuma
     função/tela removida fisicamente (`screen-welcome`, `selectProfile`, `prefillWelcomeForm`
     continuam no código, agora sem nenhum caminho ativo até eles — fica para o `FUNC-02`).
     **Testado:** Colaborador e Coordenador sem caminho para a tela antiga · Tutor mantém acesso ao
     painel dedicado (`?tutor`) · cadeia completa por convite continua funcionando · Home utilizável
     · console limpo · nenhuma escrita real ao Firebase.
6. `FUNC-02` — remover definitivamente o legado de autocadastro (código físico, não só acesso).
   Diagnóstico completo feito em 2026-07-03 (mapa de funções mortas/vivas/compartilhadas), plano
   incremental aprovado em 4 sub-etapas:
   - ✅ **`FUNC-02a` — mover "Instalar na Tela Inicial" para a Home — CONCLUÍDO (2026-07-03).**
     Achado do diagnóstico: `instalarApp()`/`mostrarInstrucoesInstalacao()` é funcionalidade real
     (prompt PWA nativo + instruções manuais por SO), mas seu único botão vivia dentro do
     `screen-welcome` morto — apagar a tela sem mover o botão perderia a função de instalar o app.
     Novo `<div id="h-install-area">` na Home + `renderInstallArea()` (chamada em `renderHome()`
     junto de `renderShareArea()`/`renderAIArea()`), botão discreto (texto simples, sem destaque),
     em área própria — não misturado com `h-share-area`/`h-tutor-area`. `instalarApp()`/
     `mostrarInstrucoesInstalacao()` não foram alteradas. Botão removido de `screen-welcome`
     (mantém as demais funções/HTML da tela intactos, aguardando `FUNC-02b`). **Testado:** botão
     aparece na Home · clique sem `deferredInstallPrompt` mostra as instruções corretamente ·
     console limpo · nenhuma escrita real ao Firebase.
   - ✅ **`FUNC-02b` — apagar `screen-welcome` e funções órfãs — CONCLUÍDO (2026-07-03).** Removida
     a tela inteira (123 linhas de HTML) + `selectProfile()`/`prefillWelcomeForm()`/
     `renderWelcomeLevelBadge()`, todas com zero chamador restante após o `FUNC-02a`. **Achado
     durante a limpeza:** `renderGrupoBarWelcome()` e o ramo em `initGrupos()` que a invocava
     (`if (document.getElementById('screen-welcome')...)`) também só existiam para essa tela —
     removidos junto, mesma origem, risco zero (função já se autoprotegia com
     `if (!welcomeHero) return`). `instalarApp()`/`mostrarInstrucoesInstalacao()` intocadas (já
     movidas para a Home no `FUNC-02a`). **Testado:** visitante novo sem convite cai em "Convite
     necessário" sem erro · cadeia completa Tutor→Coordenador→Colaborador por convite, de ponta a
     ponta · botão de instalar na Home · tela do próprio grupo intacta · `getProximoGrupoVazio()`
     intacta (`ATIVACAO-01`) · console limpo · nenhuma escrita real ao Firebase. CSS órfão
     (`#screen-welcome .profile-opt` etc.) deixado de propósito — limpeza cosmética, sem risco,
     fica para uma faxina de CSS separada se o usuário quiser.
   - ✅ **`FUNC-02c` — apagar `screen-grupos` e funções órfãs — CONCLUÍDO (2026-07-03).** Removida
     a tela inteira (grade dos 50 PGs) + `renderGrupoList()`/`filterGrupos()`. **Achado real durante
     a limpeza:** `salvarFbConfig()` (tela de configuração inicial do Firebase, admin) chamava
     `renderGrupoList()` diretamente — ficaria quebrada com uma referência inexistente; chamada
     removida. Um segundo resíduo (`if (active==='screen-grupos') renderGrupoList()` dentro do
     poller `startFbPoll`) também foi limpo pela mesma razão, embora já inalcançável.
     `renderGrupoSyncBadge()`/`isGrupoAcessivel()`/`getGrupoStatus()`/`getProximoGrupoVazio()`
     mantidas — usadas por fluxos legítimos ou já protegidas contra elemento ausente. **Testado:**
     cadeia completa por convite · bloqueio de grupo vazio/alheio via `openInscricao` · tela do
     próprio grupo intacta · console limpo · nenhuma escrita real ao Firebase.
   - ✅ **`FUNC-02d` — apagar o ramo morto de autocadastro em `renderInscricaoBody` — CONCLUÍDO
     (2026-07-03). `FUNC-02` inteiramente concluído (a, b, c, d).** Removidos: o ramo `!jaInscrito`
     de `renderInscricaoBody` (o formulário completo de autocadastro), `confirmarInscricao`,
     `mostrarErroInsc`, `atualizarPreviewFlamula`, `renderGrupoPreviewWelcome`,
     `renderRecuperarIdentidadeModal`, `recuperarIdentidade` e a variável órfã `status`.
     **Achado adicional durante a limpeza (mesmo cluster morto, fora da lista original):**
     `selecionarTipo()` — zero chamadores em todo o arquivo, referenciava `#tipo-opt-*` inexistente
     no HTML atual. Removida junto. **Bug introduzido e corrigido no mesmo turno:** ao remover o
     ramo morto, uma chave de fechamento ficou faltando (fechava só o `if(jaInscrito)`, não a
     função) — pego pelo teste imediato (`typeof renderInscricaoBody === 'function'`) antes de
     qualquer regressão maior, corrigido na hora. Mantidas intocadas (compartilhadas com o aceite
     de convite real ou fluxos legítimos): `getMeuGrupoAtivo`/`renderTrocaDeGrupoModal`/
     `buscarCadastroExistente`/`renderIdentidadeRecuperadaModal`/`startJourney`/`getGrupoStatus`/
     `getProximoGrupoVazio`/`isGrupoAcessivel`. **Testado:** cadeia completa por convite · tela do
     próprio grupo · bloqueio de grupo alheio/vazio · **recuperação de identidade em aparelho
     novo** (mesmo nome+WhatsApp, ponta a ponta incluindo o modal) · console limpo · nenhuma
     escrita real ao Firebase.
7. `UX-01`/`UX-02` — permissões e interface por papel.
   Diagnóstico feito em 2026-07-03, testando as 3 identidades (Tutor administrativo puro,
   Coordenador, Colaborador) ao vivo na Home e no Painel:
   - **Tutor administrativo puro (`?tutor`):** já correto estruturalmente — nunca chega à Home,
     não existe caminho de volta ao fluxo de Participante a partir do Painel.
   - **Zona cinzenta discutida e resolvida (decisão do usuário):** o Tutor legado que também é
     participante (`papel:'tutor'` em `participantes[]`) continua podendo usar a jornada pessoal
     normalmente — **tolerado de propósito** nesta fase de fechamento da RC2, não é bug. Só se
     torna incompatível quando o último registro legado desse tipo deixar de existir (não há prazo
     definido).
   - **Coordenador:** já correto (vê só o próprio grupo, convida Colaborador, não vê ações de
     Tutor no Painel — validado no item 4B/`ATIVACAO-01`).
   - ✅ **`UX-02` — ocultar becos sem saída da Home para Colaborador — CONCLUÍDO (2026-07-03).**
     Achado: `renderShareArea()` mostrava "Convidar amigo" (`openShare()`) e "Painel do
     Tutor/Coordenador" (`openTutorPanel()`) igual para Coordenador e Colaborador — para
     Colaborador os dois eram becos sem saída ("apenas o Coordenador pode convidar" / "acesso
     restrito"). **Correção:** os 2 botões só renderizam quando
     `getMinhaFuncaoNoGrupo() === 'tutor' || 'coordenador'` (inclui o tutor legado-participante,
     por compatibilidade); para Colaborador/sem grupo, só "Meu progresso" aparece (grid ajusta pra
     1 coluna). "Convidar amigo" renomeado para "Convidar Participante". Nenhuma mudança de
     autorização ou de modelo de dados — só visibilidade condicional. **Ideia antiga superada:** o
     registro original do `UX-02` também cogitava esconder o Painel do Coordenador — descartado,
     incompatível com a arquitetura atual (Coordenador depende do Painel pra gerenciar o próprio
     grupo, já testado extensivamente). **Testado:** Colaborador vê só "Meu progresso" · Coordenador
     vê os 2 botões normalmente · Tutor legado-participante preservado por compatibilidade ·
     console limpo · nenhuma escrita real ao Firebase.
- ✅ **UX-04 — Reorganização da Home em blocos temáticos — CONCLUÍDO (2026-07-03).**
  Reorganização da tela inicial para refletir a jornada do participante. **Sem funcionalidade nova
  e sem tocar em regra de negócio** (Firebase/convites/permissões/papéis/estudos/XP/missões/
  comunidade intactos). Nova ordem em 7 blocos:
  1. **Meu Caminho Hoje:** XP/Estudos/Sequência · Progresso da Trilha · **Iniciar Estudo** (CTA subiu) · Estudos anteriores.
  2. **Meu Pequeno Grupo:** chip do grupo · Progresso do PG · Painel da Comunidade.
  3. **Minha Formação:** Conquistas (medalhas) · Jornada das Conquistas · Atributos · Mapa de Discipulado · Obstáculos/Bosses.
  4. **Minha Missão:** Missões.
  5. **Ferramentas:** Meu Diário · Meu Progresso · Mentor IA · Companheiro de Jornada.
  6. **Liderança do Pequeno Grupo** (role-gated): **Convidar** por papel (Tutor → Convidar Coordenador; Coordenador → Convidar Participante) + **Painel do Tutor/Coordenador** (rótulo combinado — é uma tela ÚNICA compartilhada, `openTutorPanel`, então não se rotula por papel; ajuste feito após revisão do usuário); Participante → bloco oculto.
  7. **Sistema:** Instalar aplicativo (fim absoluto).
  - **Decisões do usuário:** "Descrição do grupo" fora do escopo (não existe, não criar); Estudos
    anteriores no Bloco 1; Obstáculos no Bloco 3; Conquistas (medalhas) migram p/ o Bloco 3; bloco
    admin renomeado "Liderança do Pequeno Grupo"; rótulo do Convidar por papel (só texto, sem alterar
    `openShare`/`gerarConvite`); **Painel mantido para o Coordenador** (evita regressão do UX-02).
  - **Implementação (só `index.html`, +33/−18):** reordenados os placeholders estáticos do
    `#screen-home` nos 7 blocos; re-apontadas as inserções dinâmicas (`renderGruposBtnHome`→
    `#h-grupo-area`, `renderCompanionHomeBtn`→`#h-companion-area`, fallback de
    `renderComunidadeBtnHome`→`#h-grupo-area`); `renderShareArea` dividida em "Meu Progresso"
    (`#h-progress-area`, Bloco 5) e "Liderança" (`#h-lideranca-area`, Bloco 6, role-gated, rótulos
    por papel). Nenhuma lógica de negócio alterada.
  - **Validado no preview (rede neutralizada, sem escrita ao Firebase):** ordem dos 7 blocos correta
    de cima para baixo; Bloco 6 vazio p/ Participante, "Convidar Participante + Painel do Coordenador"
    p/ Coordenador, "Convidar Coordenador + Painel do Tutor" p/ Tutor; nenhum componente sumiu;
    console limpo.
  - **Observação arquitetural registrada (NÃO é uma nova tarefa):** a Home ainda depende de uma
    composição híbrida entre HTML estático e inserções dinâmicas por âncoras (`anchor.after(...)`/
    `appendChild`). Isso aumenta o custo de manutenção e de reorganização visual. Recomenda-se, numa
    versão futura, **refatorar a Home para uma composição por blocos independentes**, preservando
    integralmente as regras de negócio. (Sem abrir item próprio no roadmap.)
8. Auditoria completa da arquitetura antes de uma nova homologação (RC2).

## ARCH-04 — Remoção definitiva da entrada pública do aplicativo (decisão arquitetural, 2026-07-03)

> Nota de nomenclatura: `ARCH-02` (entrada `?tutor`) e `ARCH-03` (identidade do Tutor) já existem
> neste documento; esta decisão é numerada `ARCH-04` para não colidir.

O aplicativo passou a operar **exclusivamente por convites**. A URL base deixou de ser uma
entrada — tornou-se uma **página institucional informativa e terminal**
(`showInstitutionalLanding()` / tela `#screen-landing`), **sem ações de cadastro ou navegação
(sem botão)**.

**Regra estrutural (não reabrir sem decisão explícita):** não existe entrada pública. As ÚNICAS
portas de entrada do sistema são:
- `?tutor` → Painel do Tutor (autorizado pela allowlist `tutores`)
- `?conv=<id>` → cadastro pelo convite de uso único
- `welcomeDone == true` → retorno automático do participante já autenticado (Home)
- qualquer outro acesso (URL base sem contexto) → página institucional terminal

**Motivação:** fechar a divergência entre a arquitetura (acesso 100% por convite) e a interface —
a antiga tela "Convite necessário" parecia uma entrada pública e tinha um botão "Ir para o início"
que, sem `welcomeDone`, voltava para si mesma (resíduo do autocadastro removido no `FUNC-02`). Quem
perde o acesso pede um novo convite ao Coordenador (caso operacional; o `IDENT-01` recupera o
progresso ao re-aceitar — não é preciso fluxo de recuperação próprio). **Se no futuro alguém
sugerir "colocar um botão de cadastro na página inicial", isso contraria esta decisão deliberada.**

**Responsabilidade única por tela** (resultado da consolidação): Página institucional → informa ·
Link do Tutor → administra · Link de Convite → ingressa · Home → participa.

**Implementado** em `index.html` (+36/−9, 2026-07-03): função dedicada `showInstitutionalLanding()`
(separada de propósito da infraestrutura de mensagens de convite/erro) + tela `#screen-landing` +
roteamento do ramo `else` do `initApp`; `telaConviteMensagem` preservada para as mensagens de
DENTRO do app (convite usado/expirado/grupo alheio), onde o botão "Ir para o início" continua
legítimo (`welcomeDone == true` → Home). **Validado em runtime** (landing sem botão; mensagens
internas intactas; rotas `?conv=`/`?tutor` preservadas; console limpo; nenhuma escrita ao Firebase).
**Aguardando commit.**

**Processo mantido (igual à RC1, reafirmado pelo usuário):** diagnóstico + mapa de impacto →
proposta técnica detalhada (arquivos afetados) → aprovação explícita → implementação de **uma
etapa por vez** → testes de regressão → commit isolado e documentado → atualização do roadmap →
só então a próxima etapa. Nenhuma refatoração massiva sem pontos de controle. O assistente deve
continuar questionando decisões inconsistentes e reportando riscos/dependências ocultas antes de
implementar, mesmo com essa autorização mais ampla.
