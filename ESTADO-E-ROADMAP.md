# Estado do Projeto Rocha — Handoff de sessão (2026-06-30)

> Documento para retomar o trabalho em outra máquina/sessão. Cole o conteúdo de volta
> para o assistente ao recomeçar — a "memória" do assistente **não viaja entre máquinas**;
> só este arquivo (via GitHub) viaja. **Nenhuma alteração de código sem aprovação do desenho.**

## Natureza do projeto
App de discipulado (Capelania HAS) para ~50 Pequenos Grupos. **NÃO é Flutter** — é um
**único `index.html`** (HTML/JS puro, PWA) usando **Firestore via REST** num **único documento
compartilhado** `jdpg/grupos` (campo `dados` = JSON de todos os grupos). Publicado em
GitHub Pages: https://capelaniahospitalar.github.io/jornada-pequenos-grupos/ . Usuário é
não-programador; commits feitos por ele via **GitHub Desktop** (revisa o diff).

## Onde estamos
- **Commit 1 (concorrência) — FEITO, commitado e enviado** (`c747675`). Inclui: trava otimista
  `currentDocument.updateTime` (testada na API real: conflito=HTTP 400 FAILED_PRECONDITION,
  sucesso=200); retry 3× com backoff aleatório; reconnect-retry (`online`/`visibilitychange`);
  `deviceId`; log local de conflitos; telemetria local (`recordSync`, success rate,
  `lastSuccessfulSyncVersion`). Validado em runtime (app inicia, console limpo, flags congeladas).
- **Homologação do Commit 1 — EM ANDAMENTO.** Teste 1 (inclusão concorrente) **passou em campo**
  com 3 aparelhos. Faltam testes 2 (edição concorrente), 3 (reconexão), 4 (fechar/reabrir),
  5 (alternância ~5min), 6 (cliques rápidos), 7 (reinício total) + conferência da telemetria.
  Checklist e roteiro detalhados no histórico da conversa.

## Achado de campo importante (deadlock)
Ao usar **"Cancelar minha inscrição"** (`cancelarInscricao`), o app: (1) apaga o vínculo do
aparelho (`localStorage 'jdpg_meu_grupo_v1'`) e (2) remove o nome da lista. Com vários aparelhos,
o **merge ressuscita** o nome (bug de remoção → tombstone). Resultado: nome na lista (bloqueia
reinscrição com "já inscrita") + sem vínculo (mostra tela de inscrição) = **beco sem saída**.
Tutores precisam pertencer a **vários grupos** — o modelo "um meuGrupo por aparelho" não serve.
Workaround sem código: usar um **grupo novo** e não usar "Cancelar".

## Roadmap (RENUMERADO após o achado de campo)
Cada commit é precedido de **Mapa de Impacto** (análise, sem código); tombstone também leva **ADR**.
- **C1 — Concorrência:** FEITO (ver acima). Tag de restauração: `v0-pre-concurrency` (→ a167578).
  Marco pós-homologação a criar: `v1-concurrency-homologated`.
- **C2 — Modelo "Meus Grupos" (multi-grupo):** trocar `meuGrupo` (single) por `meusGrupos` (lista);
  **pertencimento DERIVADO** = se o nome está na lista de participantes do grupo, é membro
  (sem reinscrição, sem botão "entrar de novo"); "já inscrita" vira **"Você já participa. Entrar
  como [nome]?"**. **Identidade por nome é frágil** (achado: no grupo 6 a mesma pessoa entrou 2× com
  grafias diferentes — nome curto vs. completo) → considerar **nome + WhatsApp** como chave.
  Requisito de negócio (tutor multi-grupo). Mapa de Impacto antes de código.
- **C3 — Tombstone transitório:** remoção vira `removed:true` (+ carimbo) e `updatedAt` por
  participante no topo; merge compara remoção × edição (mais recente vence); resolve ressurreição
  e a borda "edição estrutural concorrente no mesmo participante". Inclui **ADR** com **Exit Criteria**.
- **C4 — Debounce ~400ms** (`FB_FLAGS.debounceMs`) com dirty-check de payload.
- **C5 — Limpeza:** remover código morto (`sendMyPrayer`/`clearMyPrayer` duplicadas em 5154/5176,
  sobrescritas por 5673/5688) + atualizar `CHANGELOG.md`.

## Rollback / segurança
- Flags congeladas no topo do `<script>`: `FB_FLAGS = Object.freeze({ usePrecondition, retryOnReconnect,
  debounceMs, useTombstone })` → desligar cada camada por 1 linha.
- Tag `v0-pre-concurrency` = snapshot íntegro pré-Commit-1.
- Validação local (sem node/python): servidor estático PowerShell + preview do assistente.

## Estado dos dados na nuvem (snapshot 2026-06-30)
- `dados` ~10,4 KB (2,16% do limite de 480 KB). 6 grupos preenchidos, 13 participantes. Sem
  duplicado exato, sem `ts` repetido, sem corrupção.
- **Grupo 1 = REAL** (preservar SEMPRE). **Grupos 2–6 = teste** (podem ser apagados quando o
  usuário autorizar — preservando o 1).
- Observações (não são bugs do C1): todos se inscreveram como "tutor" (grupos 5 e 6 com 4
  "tutores"; só o 1º vira tutor oficial do grupo); duplicata por variação de grafia no grupo 6.

## Próximas decisões pendentes do usuário
1. Apagar grupos de teste 2–6 (preservando o 1)? (confirmar lista antes)
2. Terminar homologação (testes 2–7, sem "Cancelar") ou pausar e começar o Mapa de Impacto do C2?
