# CHANGELOG — Jornada Discipular em Pequenos Grupos

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
