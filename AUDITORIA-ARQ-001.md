# ARQ-001 — Auditoria Arquitetural Geral (somente diagnóstico)

> Realizada em 2026-07-30. Escopo: `index.html` (11.436 linhas), `ARCHITECTURE.md`,
> `AUDITORIA-RC5.0.md`, `CHANGELOG.md`, `ESTADO-E-ROADMAP.md`. **Nenhum código foi alterado
> nesta auditoria.** Repositório confirmado (`capelaniahospitalar/jornada-pequenos-grupos`),
> sincronizado com o GitHub antes de começar (`git fetch` + `status -sb`, sem pendências).
>
> Esta auditoria **não repete** o levantamento de achados pontuais já feito na RC5.0
> (2026-07-29) — ela reclassifica o estado atual de cada um (✅/🟡/🔴/🆕) com base no código
> real de hoje, e cobre o que a RC5.0 não cobriu: mapa geral da arquitetura, fluxo completo de
> dados por entidade, e uma leitura consolidada de pontos únicos de falha e capacidade de
> recuperação.

---

## 0. O que mudou desde a RC5.0

Confirmado por `git diff --stat ee77916 bc3a2b0 -- index.html`: **uma única mudança de código**
desde o fechamento da RC5.0 — o commit `bc3a2b0` ("salvar identidade de setores"), que resolve
o **AUD-001**. Nenhum outro achado da RC5.0 teve o código tocado; a reclassificação abaixo é
uma leitura confirmada linha a linha, não uma suposição de que "nada mudou".

| AUD | Estado | Evidência |
|---|---|---|
| AUD-001 (setores gravados, nunca lidos) | ✅ **Corrigido** | `fbReadDoc` (index.html:8908-8925) agora extrai `setoresMestre`/`setoresEfetivo`/`embaixadoresExternos`, commit `bc3a2b0`, 2026-07-30 |
| AUD-002 (sem Firebase Auth) | 🔴 Ainda existe | confirmado — nenhum `firebase.auth`/`signInAnonymously` no arquivo; nenhum `firestore.rules` versionado no repo |
| AUD-003 (`pgProgress`/`pgNivel` fora do payload) | 🔴 Ainda existe | ver seção 3 — achado ampliado (ver nota abaixo) |
| AUD-004 (senha de Tutor não é controle real) | 🔴 Ainda existe (subordinado ao AUD-002) | `getTutorPassStore`/`setTutorPass` (2922-2933) inalterados |
| AUD-005 (contador de oração desatualizado) | 🔴 Ainda existe | `getPgGroupWeek` (linha deslocada, mesmo padrão) inalterado |
| AUD-006 (excluir encontro sem confirmação) | 🔴 Ainda existe | `removerEncontroPg` (index.html:3411-3423) — confirmado, sem `confirm()` |
| AUD-007 (merge não cobre setores) | 🔴 Ainda existe, **e mais amplo do que documentado** | ver seção 3 — `trySaveGrupos` grava `SETORES_MESTRE`/`SETORES_EFETIVO`/`EMBAIXADORES_EXTERNOS` direto da memória (9156), sem reconciliar com o remoto lido em `prepareSaveGrupos` (9123-9142), que só faz merge de `PEQUENOS_GRUPOS` |
| AUD-008 a AUD-017 | 🔴/🟡/🟢 inalterados | nenhuma linha das funções citadas na RC5.0 foi tocada; classificação da RC5.0 permanece válida |

**🆕 Achado novo, já corrigido antes desta auditoria:** o commit `9f7c2c3` ("bug na tela
gratidão e oração", 2026-07-29, portanto já presente quando a RC5.0 foi escrita, mas não é
nenhum dos 17 achados dela) corrigiu um bug distinto do AUD-010: em `enviarGratidao()`
(index.html:11388 em diante), o campo de texto não era limpo após a publicação — pior, a
proteção "preservar rascunho" (`BUG-RASCUNHO-01`, a mesma lógica citada no AUD-010) lia o texto
recém-publicado como se fosse rascunho não enviado e o devolvia ao campo, permitindo publicar a
mesma gratidão duas vezes. Fixado adicionando `inputEl.value = ''` e desabilitando o botão
**antes** de `renderComunidade()` rodar. Vale registrar porque é a **mesma causa raiz da matriz
da RC5.0** ("padrão de proteção de interação aplicado de forma inconsistente") se manifestando
por um ângulo diferente — a proteção de rascunho, pensada para um cenário, causou um efeito
colateral em outro.

---

## ETAPA 1 — Arquitetura Geral

**Mapa real (confirmado por contagem no código, não estimativa):**

```
index.html (11.436 linhas, ARQUIVO ÚNICO — sem build, sem bundler, sem módulo ES,
            sem transpilação, sem framework)
  ├─ ~386 funções (function/async function) no escopo top-level
  ├─ 51 funções render*() (camada de Interface)
  ├─ 13 chaves de localStorage distintas (ver ETAPA 3)
  └─ ~13 variáveis de estado global mutável no escopo do módulo (let no topo do arquivo):
       TUTORS, SETORES_MESTRE, SETORES_EFETIVO, EMBAIXADORES_EXTERNOS, ST, CP, E7, E8,
       PEQUENOS_GRUPOS (array principal), fbLastKnownTs, fbPendingSync, entre outras
```

- **Organização:** por convenção de prefixo de nome de função (`render*` = UI,
  `calcular*`/`get*` = motor de negócio puro, `save*`/`fbWrite*`/`fbRead*` = persistência), não
  por separação física de arquivo/módulo. `ARCHITECTURE.md` documenta essa convenção
  explicitamente como "camadas lógicas, não físicas" — **confirmado que a disciplina é seguida
  na prática**: nenhuma função `calcular*`/`get*` (motor) chamada nesta auditoria grava dado
  (ex.: `calcularCoberturaSetorial`, `getPgIMDv2`, `classificarPgsV2` são puras, sem
  `localStorage.setItem`/`fetch` internos), e nenhuma função `render*` chamada nesta auditoria
  faz cálculo de negócio além de formatação — o que é notável para um arquivo deste tamanho sem
  qualquer imposição estrutural de linguagem (tudo convive no mesmo escopo global de funções).
- **Acoplamento:** alto por natureza do modelo (tudo no mesmo arquivo, mesmo escopo global),
  mas **não caótico** — o acoplamento observado segue a hierarquia de camadas declarada
  (Interface → Serviços → Motor → Persistência → Firebase), sem chamadas "de baixo pra cima"
  encontradas nas amostras revisadas (motor não chama render, persistência não chama motor).
- **Estado global:** `PEQUENOS_GRUPOS` (array com todos os PGs, participantes, mural, setores
  por grupo) é o estado central de que praticamente toda função depende — lido e escrito por
  dezenas de funções diretamente (não existe um único ponto de acesso/mutação, tipo store
  centralizada com getters/setters). Isso é esperado nesta escala de app sem framework, mas é o
  motivo estrutural por trás de quase todo achado de concorrência da RC5.0 (qualquer função pode
  mutar `PEQUENOS_GRUPOS` e chamar `saveGrupos()` sem um mecanismo central de lock além da trava
  otimista já existente na gravação para a nuvem.
- **Reutilização/duplicação:** confirma os achados AUD-005, AUD-008, AUD-009, AUD-012,
  AUD-014, AUD-015, AUD-016 da RC5.0 — o padrão dominante de duplicação no código é "lógica
  copiada entre telas/indicadores irmãos" (dedup de participantes copiada em 6+ funções,
  contador de oração não replicado do padrão já corrigido pra gratidão), não duplicação
  aleatória.
- **Separação interface / regra de negócio / persistência:** respeitada como princípio (ver
  acima); a fragilidade real não é a mistura de camadas, é a **ausência de qualquer teste
  automatizado** (confirmado: nenhum arquivo de teste no repositório — `git ls-files` não
  retorna nenhum `*.test.*`/`*.spec.*`) e ausência de checagem de tipos (JavaScript puro, sem
  TypeScript/JSDoc typed) — a disciplina de camadas é mantida por convenção e revisão manual,
  não por uma ferramenta que barra a violação.

**Risco arquitetural de fundo (não é um dos 17 achados da RC5.0, é anterior a todos eles):**
um único arquivo de 11.436 linhas, sem testes automatizados, sem tipos, é uma arquitetura que
funciona **enquanto uma pessoa só a edita com disciplina manual** (o que tem sido o caso — a
RC5.0 encontrou só 2 críticos em 17 achados, nenhum de corrupção ativa). Ela **não escala** para
mais de um editor simultâneo do código-fonte, nem detecta uma regressão automaticamente antes de
chegar em produção — cada RC depende de teste manual documentado no `CHANGELOG.md` como única
rede de segurança.

---

## ETAPA 2 — Fluxo dos Dados (por entidade)

| Entidade | Nasce em | Alterada em | Armazenada em | Lida por | Pode ser perdida em |
|---|---|---|---|---|---|
| **PG (grupo)** | cadastro do Tutor | `renderTutorGrupoDetalhe` e afins | `PEQUENOS_GRUPOS[n]` → `localStorage` (`jdpg_grupos_v1`) → Firestore (campo `dados`) | quase toda tela | escrita vazia sobrescrevendo nuvem (mitigado pela proteção em `prepareSaveGrupos:9126-9134`); conflito perdendo campo não coberto pelo merge (`mergeGruposData`, só cobre o array principal) |
| **Participante** | inscrição/convite aceito | edição de perfil, contadores (`bumpPgProgress`), setor | `g.participantes[]`, aninhado no PG | telas do PG, IMD, Ranking, Setores, Embaixadores | remoção usa tombstone (`removed:true`, 30 dias) — não é apagamento imediato; risco documentado e já materializado 2x (Grupo 1, ver memória de incidentes) por teste em produção sem seguir a trava |
| **Tutor / Coordenador** | designação (`g.tutor`/`g.coordenador`, string de **nome**, não id) | correção de nome (`nomesCorrespondem`, RC-REST-02) | campo de texto dentro do PG + array `TUTORS` (topo) | `getGruposDoResponsavel`, Painel do Tutor | identidade por nome — RC4 (Identidade Canônica) planejada, não iniciada; colisão de primeiro nome é risco latente documentado |
| **Administrador** | **não existe como papel no código** — nenhuma tela/variável de "admin" encontrada; o app trata só Tutor/Coordenador/Participante | — | — | — | não é uma lacuna a corrigir agora — é о confirmado pela ausência de qualquer `papel === 'admin'` no arquivo |
| **Companheiro de Jornada** | convite entre participantes do mesmo PG | aceite/recusa/remoção (`inviteCompanion` etc., 6556-6666) | dentro do registro do participante | `getCompanionPool`, telas de Comunhão | AUD-011 (duplo toque sem bloqueio de botão); AUD-009 (aviso de vínculo perdido incompleto) |
| **Setores** | Cadastro Mestre (Tutor) | Efetivo (histórico append-only), setores acompanhados por PG (`g.setores`) | `SETORES_MESTRE`/`SETORES_EFETIVO` (globais) + `g.setores` (array de `setorId` por PG) | Cobertura Setorial, Embaixadores, Painel ADV-E (planejado) | AUD-007 — sem merge de reconciliação; dois Tutores editando setores diferentes ao mesmo tempo arriscam sobrescrita mútua (ver seção 3) |
| **Estudos** | `ST.done` (progresso local do participante, 13 estudos) | `completeStudy()` (5942) | `localStorage` local ao dispositivo + sincronizado como `p.progresso.estudosConcluidos` dentro do participante | IMD, XP, Nível | mesmo tombstone/merge do participante — sem achado próprio identificado além do já coberto |
| **Missões** | conclusão de missão (`confirmEmbaixadorMissao`, `confirmArquiteturaVidaMissao`) | `_syncMissaoParaGrupo` (4831) grava no grupo | `p.progresso` + campanhas (`PG_CAMP_KEY`, localStorage local) | IMD (`calcularMissaoScore`/`calcularMissaoColetivaScoreV2`) | `missoesConcluidas` é só total vitalício, sem recorte por tempo (limitação já documentada na RC3.5, não um bug novo) |
| **Gratidões / Pedidos de oração** | `enviarGratidao()` (11388+), `tipo:'gratidao'`/`'oracao'` no mesmo array `g.gratidoes` | poda automática (`podarGratidoesExpiradas`) | dentro do PG, `g.gratidoes[]` | Mural, contadores da Home/Painel do Tutor | AUD-005 (contador de oração desatualizado); AUD-008 (id por `Date.now()`, não uuid); bug de campo não limpo já corrigido (ver seção 0) |
| **Embaixadores** | participação registrada no evento + externos manuais | `salvarParticipantesExternos` | `p.progresso.embaixadores` (por participante) + `EMBAIXADORES_EXTERNOS` (global, por `{setorId, monthKey}`) | Cobertura/Painel Institucional | mesma classe de risco de merge do AUD-007 (campo de topo sem reconciliação) |
| **Indicadores / IMD** | calculado ao vivo (`getPgIMDv2`), **nunca persistido automaticamente** | `atualizarPgIMD()` existe mas não é chamada por nenhum evento (confirmado no `ARCHITECTURE.md:216-217`, ainda verdadeiro) | `g.pgIMD` só se alguém chamar manualmente a função — hoje o painel sempre recalcula ao vivo, então o campo persistido é irrelevante na prática | Painel de Ranking | nenhum — por ser sempre recalculado ao vivo, "perda" do campo persistido não afeta o que o usuário vê |
| **Metas** | constantes no código (`PG_COBERTURA_META_PCT`, `EMBAIXADORES_META_PCT`, metas de estudo/oração/bondade) | só por deploy de novo código | hardcoded no `index.html`, não editável em tela | todos os cálculos de %/status | não há risco de perda (não é dado de usuário) — mas também não há tela de configuração, qualquer mudança de meta exige alteração de código |
| **Configurações (Firebase)** | `salvarFbConfig()` (tela de setup) | — | `localStorage` (`jdpg_fb_config`) — **por dispositivo**, não sincronizado | toda função que fala com o Firestore | se o dispositivo perder o localStorage (troca de aparelho, limpar dados), a configuração de conexão precisa ser reinserida manualmente — `apiKey`/`projectId` ficam expostos no próprio código-fonte também, então reobter não é um problema de segredo, só de conveniência |

**Achado ampliado sobre o AUD-003 (ETAPA 2/3):** a RC5.0 registrou que `pgProgress`/`pgNivel`
faltam no payload da nuvem (`trySaveGrupos`, hoje 9146-9156). Esta auditoria confirma que o
**mesmo problema existe também no `localStorage`** — `saveGruposLocal()` (index.html:8078-8094)
grava `num, nome, tutor, coordenador, diaReuniao, horaReuniao, participantes, gratidoes,
reunioesMes, setores`, mas **nem `pgProgress`, nem `pgNivel`, nem `pgIMD`, nem `pgRanking`**.
Ou seja: o progresso semanal e o nível do PG não sobrevivem nem a um reload local, não só à
sincronização — o achado da RC5.0 estava correto mas subestimado em alcance.

---

## ETAPA 3 — Persistência

**Fonte da verdade, por camada:**

1. **Firestore** (`fbWriteGrupos`/`fbReadDoc`, REST puro com `apiKey`+`projectId`, sem SDK) —
   fonte da verdade **entre dispositivos**. Um único documento (`FB_COLL`/`FB_DOC`) guarda tudo:
   `dados` (array de PGs), `tutores`, `convites`, `setoresMestre`, `setoresEfetivo`,
   `embaixadoresExternos`, `ts`, `updateTime`.
2. **localStorage** — fonte da verdade **no dispositivo atual, entre sessões**, e cache de
   leitura rápida antes da sincronização completar. 13 chaves distintas (`jdpg_grupos_v1`,
   `jdpg_meu_grupo_v1`, `jdpg_member_id_v1`, `jdpg_convites_v1`, `jdpg_setores_mestre_v1`,
   `jdpg_setores_efetivo_v1`, `jdpg_embaixadores_externos_v1`, `jdpg_companion_v1`,
   `jdpg_campanhas_v1`, `jdpg_gratidoes_v1`, `jdpg_fb_config`, `jdpg_device_id`,
   `jdpg_sync_telemetry`, entre outras) — **não há um único "estado local", são vários
   documentos independentes**, cada um podendo, em teoria, dessincronizar dos demais.
3. **Memória (variáveis globais `let`)** — fonte da verdade **durante a sessão aberta**, escrita
   primeiro, gravada depois (padrão: mutar `PEQUENOS_GRUPOS`/`SETORES_MESTRE` em memória →
   `saveGrupos()`/`saveGrupos*Local()` → Firebase).
4. **Cache:** não há camada de cache formal separada — o próprio `localStorage` cumpre esse
   papel (é lido primeiro no boot, atualizado pelo poll de sincronização).

**Sincronização:** poll periódico (não *push*/*listener* do Firestore) + trava otimista via
`updateTime` nativo do documento + até 3 tentativas com backoff aleatório
(`saveGruposToFirebase`, 9160-9190) + merge por `updatedAt`/tombstone (`mergeGruposData`,
9020+) **só para o array `PEQUENOS_GRUPOS`**. Campos de topo (`tutores`, `convites`,
`setoresMestre`, `setoresEfetivo`, `embaixadoresExternos`) são gravados como um bloco só,
substituindo o valor anterior por inteiro — sem merge por registro, exceto `convites`, que tem
seu próprio fluxo dedicado (`commitConviteChange`, citado na RC5.0 como usando o mesmo padrão de
trava otimista).

**Riscos confirmados nesta auditoria (além dos já cobertos por AUD-001/003/007):**

- **Sem `firestore.rules` versionado no repositório** — confirmado (`git ls-files | grep rules`
  vazio). As regras vivem só no console do Firebase (conta Google separada, já registrado em
  memória). Isso significa que **esta auditoria de código não pode confirmar se a allowlist de
  campos está de fato atualizada em produção** — só pode confirmar o que o `index.html` tenta
  gravar/ler. É um ponto cego estrutural, não deste diagnóstico.
- **Configuração de conexão (`apiKey`/`projectId`) não sincroniza entre dispositivos** — vive só
  em `localStorage`, precisa ser reconfigurada manualmente por aparelho novo (mitigado por estar
  hardcoded como fallback no próprio código, então na prática funciona, mas é uma dependência
  implícita, não deliberada).

---

## ETAPA 4 — Integridade

- **Referências órfãs:** o app tem proteção deliberada contra o caso mais provável
  (participante com `setorId` fora dos setores acompanhados pelo próprio PG —
  `participanteContaParaSetor`, ADR-002) — não é ausência de cuidado, é um invariante já
  imposto por design.
- **Dados duplicados:** identidade de Tutor/Coordenador ainda é por **string de nome**, não por
  id estável (RC4 "Identidade Canônica", planejada, não iniciada) — é a maior fonte estrutural
  de duplicação/ambiguidade potencial hoje, mitigada por `nomesCorrespondem()` mas não eliminada.
- **Escritas parciais / sobrescritas:** confirmadas as do AUD-001 (corrigido)/AUD-007 (aberto) —
  campos de topo (setores, embaixadores) são unidades atômicas de sobrescrita, não de merge.
- **Campos opcionais perigosos:** `g.tutor`/`g.coordenador` podem ser `null`/string vazia sem
  bloqueio — o app tolera "PG sem tutor definido" como estado válido (não é bug, é decisão de
  produto: grupo pode existir antes de ter responsável definido).
- **Objetos sem validação:** `EMBAIXADORES_EXTERNOS` tem validação explícita (não-negativo,
  inteiro, não ultrapassa efetivo) — ponto positivo já registrado na RC5.0, confirmado
  inalterado.

Nenhum achado novo de integridade além do que a RC5.0 já cobriu com precisão (AUD-007, AUD-008).

---

## ETAPA 5 — Concorrência

Confirma o resumo da RC5.0: os fluxos de maior risco (gravação do PG, convites) **têm** trava
otimista + merge + retry; os campos de topo mais recentes (setores, embaixadores) **não têm**
merge, só a trava otimista de todo o documento (o que evita corrupção binária do documento, mas
não evita um Tutor sobrescrever o array de setores do outro).

**Cenários testados por leitura de código (não em ambiente real):**

| Cenário | Comportamento hoje | Risco |
|---|---|---|
| Dois dispositivos, dois PGs diferentes, gravando ao mesmo tempo | Trava otimista por `updateTime` do documento inteiro (não por PG) — o 2º a gravar recebe `FAILED_PRECONDITION`, faz merge (`mergeGruposData`) e tenta de novo (até 3x) | Baixo para `PEQUENOS_GRUPOS` (merge cobre); Médio para setores/embaixadores (sem merge dedicado) |
| Duas abas do mesmo dispositivo | Mesmo mecanismo — cada aba é um "cliente" independente do ponto de vista do Firestore | Mesmo risco acima, sem proteção adicional por ser mesmo dispositivo |
| Internet lenta / reconexão | `FB_FLAGS.retryOnReconnect` reenvia sync pendente ao reconectar (8867) | Coberto |
| Uso offline | `localStorage` funciona como fonte local; sync represado até reconectar | Coberto para leitura/edição local; risco de a nuvem evoluir muito nesse meio-tempo e o merge ficar mais custoso, não há limite documentado para isso |

---

## ETAPA 6 — Segurança

Reafirma AUD-002/AUD-004 como o núcleo do risco de segurança do sistema — **não há autenticação
Firebase em nenhuma camada**; toda distinção de papel (Tutor/Coordenador/Participante) é
imposta só na interface. Achado adicional desta auditoria:

- **Identidade do participante também é só client-side:** `memberId` (UUID) vive em
  `localStorage` (`MEMBER_ID_KEY`), gerado no próprio dispositivo, sem nenhuma prova
  criptográfica de posse. Isso não é um problema novo — é a mesma fragilidade do AUD-002 vista
  do lado do participante em vez do lado do Tutor: "quem sou eu" é uma convenção do cliente, não
  uma garantia do servidor. Já se manifestou como incidente real (perda de vínculo ao limpar
  dados do navegador/trocar aparelho, documentado em memória e no aviso da tela de
  Embaixadores/Missões, AUD-009).
- **Não existe papel de Administrador** no código — confirmado por ausência total de
  `papel === 'admin'` ou equivalente. Isso simplifica a superfície de risco (não há um "super
  usuário" a proteger), mas também significa que **qualquer Tutor tem, na prática, o mesmo nível
  de acesso a dados de outros PGs** que teria um admin — não há hierarquia entre Tutores.

---

## ETAPA 7 — Recuperação

**Confirmado por busca no código: não existe nenhum mecanismo de backup, snapshot ou rollback
automatizado.**

- `recordSync()` (8846-8859) grava só **telemetria agregada** (contagem de sucesso/falha/retry,
  tempo médio) em `localStorage` — não é um log de auditoria de dados, não guarda o que mudou,
  quem mudou ou quando, além do timestamp interno (`ts`) do próprio documento.
- O único mecanismo parecido com histórico é o `historico[]` **append-only** de
  `SETORES_EFETIVO` (ADR-001) — mas é específico desse componente, não geral.
- O tombstone de participante (`removed:true`, 30 dias de retenção antes da poda) é uma
  **janela de recuperação parcial**, não um backup — depois de 30 dias, ou se alguém intervier
  manualmente, o dado é perdido de vez.
- **Não existe `firestore.rules` nem regra de retenção/backup do Firestore versionada** neste
  repositório para confirmar se o próprio Google Cloud tem backup automático habilitado no
  projeto — fora do alcance desta auditoria de código.

**Evidência empírica (memória do projeto, não código):** os dois incidentes já registrados
(Grupo 1, duas vezes; Grupo 22) foram recuperados **manualmente** — PATCH direto no Firestore ou
reconstrução a partir do log de convites aceitos (`usadoPor`) — não por nenhum mecanismo de
restauração do próprio app. Isso é a confirmação prática de que a recuperação hoje depende de
intervenção manual e de sorte (dado ainda estar em algum lugar rastreável), não de um recurso
projetado para isso.

---

## ETAPA 8 — Pontos Únicos de Falha

| Falha possível | Causa | Classificação |
|---|---|---|
| Perda de participantes (registro individual) | Tombstone dá 30 dias de janela, mas depois disso é definitivo; sem backup por trás | 🟠 Alto (mitigado pela janela, mas não eliminado) |
| Perda de setores institucionais concorrente | AUD-007 — grava por inteiro, sem merge | 🟡 Médio (baixa frequência de edição concorrente hoje, ~4-5 Tutores) |
| Perda de progresso do PG (`pgProgress`/`pgNivel`) | AUD-003, confirmado também ausente do `localStorage` (não só da nuvem) | 🟠 Alto — perde a cada reload, não só a cada reconexão |
| Corrupção do documento inteiro | Mitigado pela trava otimista (`updateTime`) — não encontrada nenhuma gravação sem pré-condição fora do fluxo já revisado pela RC5.0 | 🟢 Baixo |
| Escrita indevida de qualquer ator (sem autenticação) | AUD-002 | 🔴 Crítico — arquitetural, requer ADR |
| Perda de identidade do participante (`memberId` só local) | Sem conta/autenticação — limpar dados = perder vínculo | 🟠 Alto — já materializado como incidente real (ver memória) |
| Inconsistência entre `localStorage` e Firestore | Poll, não listener — janela entre gravação remota e próximo poll de outro dispositivo | 🟢 Baixo (mitigado por sync ao focar tela + retry on reconnect, não aprofundado nesta auditoria por já estar coberto pela RC5.0) |

Nenhum ponto de falha novo além dos já cobertos por AUD-002/003/007 foi encontrado nesta
auditoria — a lista acima é a **consolidação em formato de risco**, não achados adicionais.

---

## ETAPA 9 — Evidências

Toda afirmação técnica acima cita função + linha aproximada + arquivo (`index.html`, salvo
indicação contrária) e foi verificada por leitura direta do código nesta sessão (não por
inferência da documentação) — especificamente:
`fbReadDoc` (8897-8926), `fbWriteGrupos` (8947-8981), `prepareSaveGrupos` (9123-9142),
`trySaveGrupos` (9145-9157), `saveGruposToFirebase` (9160-9190+), `mergeGruposData` (9020+),
`saveGruposLocal` (8078-8094), `savePgProgress`/`savePgNivel` (10758-10763, 10833-10838),
`removerEncontroPg` (3411-3423), `enviarGratidao` (11388+), `recordSync` (8846-8859),
`getGruposDoResponsavel`/`nomesCorrespondem` (2967+), identidade `memberId` (8100-8220),
constantes globais e chaves de `localStorage` (grep completo, seção "Persistência").

---

## ETAPA 10 — Classificação dos Riscos (consolidada)

| Risco | Severidade | Motivo da classificação |
|---|---|---|
| Ausência de autenticação Firebase (AUD-002/004) | 🔴 **CRÍTICO** | Sem barreira de servidor, qualquer pessoa com `apiKey`+`projectId` (públicos por padrão em apps Firebase client-side, mas ainda assim) pode escrever/ler qualquer coisa; toda a separação de papéis é só cosmética do ponto de vista do servidor |
| `pgProgress`/`pgNivel` não persistem (AUD-003, ampliado) | 🟠 **ALTO** | Perde a cada reload local, não só sync — usuário perde progresso visível sem nenhuma ação sua |
| Setores/Embaixadores sem merge de reconciliação (AUD-007) | 🟡 **MÉDIO** | Risco real mas baixa frequência de colisão (poucos Tutores, edição pouco frequente desse dado específico) |
| Identidade do participante só local (`memberId`) | 🟠 **ALTO** | Já causou incidentes reais documentados; sem solução prevista antes da RC5.2 (ADR de autenticação) |
| Ausência total de backup/rollback | 🟠 **ALTO** (estrutural, não um achado isolado) | Recuperação depende de sorte + intervenção manual, já testado 2x em produção real |
| Excluir encontro sem confirmação (AUD-006) | 🟠 **ALTO** (mas esforço de correção é trivial) | Ação destrutiva sem a mesma proteção já usada em todo o resto do app |
| Contador de oração desatualizado (AUD-005) | 🟠 **ALTO** | Discrepância visível ao usuário, mina confiança no indicador |
| Demais achados AUD-008 a AUD-017 | 🟡/🟢 **MÉDIO/BAIXO** | Ver RC5.0 — classificação inalterada, código inalterado |

---

## RELATÓRIO FINAL

### 1. Resumo Executivo

O aplicativo está sobre uma base **disciplinada, mas estruturalmente frágil por ausência de
rede de segurança automatizada**. Nenhuma das duas RCs de auditoria (RC5.0 e esta) encontrou
corrupção ativa de dados ou uma arquitetura desorganizada — ao contrário, a separação de camadas
declarada em `ARCHITECTURE.md` é seguida na prática, e os fluxos mais sensíveis (gravação de PG,
convites) já têm trava otimista, merge e retry bem implementados. O risco concentrado está em
**dois eixos que se repetem em quase todo achado**: (a) ausência de autenticação real (tudo é
convenção do cliente — papel de Tutor, identidade de participante, senha), e (b) ausência de
qualquer mecanismo de backup/histórico além de uma janela de 30 dias para participantes
removidos — o que já forçou duas recuperações manuais em produção este mês.

### 2. Mapa da Arquitetura

Arquivo único (`index.html`, 11.436 linhas), ~386 funções, sem build/módulos/testes/tipos,
organizado por convenção de nome de função em 5 camadas lógicas (Interface → Serviços → Motor de
Negócio → Persistência → Firebase). Disciplina de camada confirmada por amostragem nesta
auditoria. Maior fragilidade estrutural: zero teste automatizado — toda regressão é pega por
teste manual documentado no `CHANGELOG.md`.

### 3. Fluxo Geral dos Dados

`Ação do usuário → muta PEQUENOS_GRUPOS/SETORES_*/EMBAIXADORES_* em memória → saveGrupos()
→ localStorage (imediato) + fila para Firestore (poll/retry) → outros dispositivos recebem no
próximo poll`. 12 entidades mapeadas na ETAPA 2 — nenhuma tem um caminho de perda catastrófica
não documentado; todas as perdas possíveis já são conhecidas e classificadas.

### 4. Principais Fragilidades

1. Sem autenticação Firebase (crítico, estratégico).
2. Sem backup/rollback de nenhuma espécie.
3. `pgProgress`/`pgNivel` não sobrevivem nem a um reload.
4. Identidade do participante presa ao `localStorage` do dispositivo.
5. Merge de reconciliação cobre só o array principal de PGs, não os campos de topo mais novos.

### 5. Matriz de Riscos

Ver ETAPA 10 (consolidada).

### 6. Priorização Técnica

Reafirma o roadmap já proposto na RC5.0 (seção 6 daquele documento) como ainda válido, com um
ajuste: **RC5.1 (Persistência/Sincronização) deve ampliar o escopo do AUD-003** para cobrir
também `saveGruposLocal` (não só `trySaveGrupos`), achado confirmado nesta auditoria.

### 7. Recomendações Arquiteturais

- Tratar AUD-002 (autenticação) como decisão estratégica isolada, com ADR próprio, antes de
  qualquer funcionalidade nova de peso — é a raiz de 3 dos 5 riscos ALTO/CRÍTICO listados acima.
- Não introduzir nenhum backup "provisório e simples" sem decisão explícita — dado o padrão já
  visto no projeto (soluções transitórias tendem a virar permanentes, ex. `EMBAIXADORES_EXTERNOS`),
  vale desenhar com intenção mesmo que a implementação inicial seja modesta.
- Ao corrigir AUD-001-style bugs no futuro (campo novo no payload), usar o checklist já sugerido
  pela RC5.0 (write + read + merge + allowlist) — o AUD-007 é a prova viva de que "write + read"
  sozinhos não bastam.

### 8. Plano Diretor de Estabilização da Plataforma

```
RC5.1 — Persistência e Sincronização (AUD-003 ampliado, AUD-007)
   → RC5.3 — Interface/UX/Regras de Negócio do Mural (vitórias rápidas: 005, 006, 010✅, 011)
   → RC5.5 — Documentação e Governança (013, 017)
   → RC5.4 — Performance (014, 015, 016)
   → RC5.2 — Segurança e Permissões (002, 004) — ADR primeiro, código depois
   → ARQ-002 (proposta) — Estratégia de Backup/Recuperação, hoje inexistente
```

### 9. Riscos que precisam ser eliminados antes de novas funcionalidades

Nenhum risco encontrado bloqueia o desenvolvimento imediato de features não relacionadas
(nenhum é corrupção ativa). Mas **dois merecem tratamento antes de qualquer expansão de
escala** (mais Tutores, mais PGs, mais edição concorrente): AUD-002 (autenticação) e a ausência
de backup — quanto maior a base, maior o custo de cada incidente do tipo já visto 2x.

### 10. Recomendação das próximas etapas da série ARQ

- **ARQ-002 (sugerido):** aprofundar só o eixo Segurança/Identidade (AUD-002/004 + identidade do
  participante) até o nível de decisão de ADR — é o único achado desta e da RC5.0 que exige
  decisão estratégica antes de virar código.
- **ARQ-003 (sugerido):** desenhar a primeira versão de uma estratégia de backup/recuperação —
  hoje inexistente, e já provada necessária por 2 incidentes reais.
- Alternativa, se preferir menor risco/esforço primeiro: seguir o roadmap RC5.1→RC5.5 já
  existente antes de abrir uma nova frente ARQ.

**Esta auditoria é exclusivamente diagnóstica — nenhum código foi escrito, corrigido ou
refatorado.**
