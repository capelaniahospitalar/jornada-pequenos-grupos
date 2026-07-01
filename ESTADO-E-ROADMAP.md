# Estado do Projeto Rocha — Handoff de sessão (atualizado 2026-07-01)

> Documento para retomar o trabalho em outra máquina/sessão. Cole o conteúdo de volta
> para o assistente ao recomeçar — a "memória" do assistente **não viaja entre máquinas**;
> só este arquivo (via GitHub) viaja. **Nenhuma alteração de código sem aprovação do desenho.**

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
- **C5 — Limpeza:** remover código morto (`sendMyPrayer`/`clearMyPrayer` duplicadas em 5154/5176,
  sobrescritas por 5673/5688) + atualizar `CHANGELOG.md`. Também dead code novo a considerar:
  `window._conviteGrupoNum` (linhas ~4975/4986) — nada mais define essa variável desde que o fluxo
  `?pg=N` foi removido na Etapa 2.

## Rollback / segurança
- Flags congeladas no topo do `<script>`: `FB_FLAGS = Object.freeze({ usePrecondition,
  retryOnReconnect, debounceMs, useTombstone, identidadeUuid, convitesV2 })` → desligar cada
  camada por 1 linha. `debounceMs` e `useTombstone` são só reservas (ver Roadmap acima).
- Tags: `v0-pre-concurrency` (pré-Commit-1, → `a167578`) e `v2a-pre-identidade` (pré-Etapa-1/2,
  → `c747675`). Ambas publicadas no GitHub.
- Validação local (sem node/python): servidor estático PowerShell + preview do assistente.

## Estado dos dados na nuvem
Snapshot de 2026-06-30 (antes da Etapa 1/2): `dados` ~10,4 KB, 6 grupos preenchidos, 13
participantes, sem duplicado/corrupção. **Desatualizado** — a Etapa 2 acrescentou o campo
`convites` ao mesmo documento; tamanho e conteúdo atuais não foram reconferidos depois disso.
**Grupo 1 = REAL** (preservar SEMPRE). **Grupos 2–6 = teste** (podem ser apagados quando o
usuário autorizar — preservando o 1).

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
- **DB-01** — Colaborador pode pertencer a múltiplos PGs (sem bloqueio em `confirmarInscricao`/`aceitarConvite`)
- **DB-02** — Sincronização de progresso usa nome exato, não `memberId` (`bumpPgProgress`, `syncProgressoParaFirebase`, `_syncMissaoParaGrupo`)
- **DB-03** — Progresso só é atribuído ao Grupo Aberto, não a todos os vínculos
- **DB-04** — Campanhas (Embaixadores) só em `localStorage`, sem sincronização com a nuvem
- **DB-05** — Sem histórico/tombstone ao trocar de PG (`cancelarInscricao`) — mesmo achado do
  "Achado de campo" documentado acima
- **FLOW-01** — Sem caminho de recuperação de identidade num segundo aparelho
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

**Ordem de prioridade combinada:**
1. **P1 — `PERM-01`** (segurança): corrigir autenticação do Painel Tutor/Coordenador antes de
   uma implantação mais ampla.
2. **P2 — `DB-01`** (integridade): garantir 1 PG por colaborador.
3. **P3 — `DB-02`** (identidade): completar a migração para `memberId` na sincronização de progresso.
4. **Segunda onda:** `DB-03`, `DB-04`, `FLOW-01`.
5. **Terceira onda (limpeza, não muda a experiência do usuário):** `DB-05`, `FUNC-01`, `STR-01` a `STR-05`.

**Decisões de contexto ainda em aberto:**
6. Algum link antigo `?pg=N` já foi distribuído para pessoa real antes da Etapa 2 quebrar esse
   fluxo? (Especialmente relevante para o Grupo 1.)
7. A homologação do Commit 1 (testes 2–7) foi concluída antes de avançar para a Etapa 1/2, ou
   ficou pendente?
8. Apagar grupos de teste 2–6 (preservando o 1)? (confirmar lista antes)
