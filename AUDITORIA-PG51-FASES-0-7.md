# AUDITORIA DO PG 51 — REGISTRO CONSOLIDADO DAS FASES 0 A 7

**Data da investigação:** 20/08/2026 (sessão única, ~22h00 às 23h20)
**Motivo:** desaparecimento do PG 51 "Puro & Simples", criado em 19/08 às 15:58, com 3 convites utilizados, encontrado como slot vazio em 20/08.
**Base de código auditada:** `d76a181` (publicado em 19/08 15:54)
**Snapshot da nuvem:** `jdpg/grupos`, updateTime `2026-08-20T20:47:51.295280Z`, 299.917 bytes
**Resultado:** versão candidata `1.1.0-rc1`, commit `ac7aae8`, **não publicada** — aguardando decisão.

> Este documento é o registro recuperado das Fases 0 a 7. Dados pessoais (nomes completos de participantes e números de WhatsApp) foram deliberadamente mantidos **fora** deste arquivo, porque o repositório é publicado no GitHub Pages. Eles estão em `Documents\Backups-PequenosGrupos\` (fora do repositório).

---

## SUMÁRIO DAS 7 FASES

| Fase | O que foi feito | Escreveu em produção? |
|---|---|---|
| 0 | Diagnóstico preliminar — versão, arquitetura, riscos | Não |
| 1 | Auditoria forense — identidade, slot, duplicidade, exclusão, contagem, persistência, hipóteses | Não |
| 2 | Reconciliação do inventário — as 70 posições classificadas | Não |
| 3 | Correção arquitetural — desenho, invariantes, migração M0–M6 | Não |
| 4 | Implementação da capacidade 70 + proteções | Não |
| 5 | Testes de integridade/regressão/estresse (14 testes em Firestore falso) | Não |
| 6 | Homologação controlada — relatório de 10 itens + checklist | Não |
| 7 | Registro pré-publicação — **PAROU AQUI**, aguardando decisão (A) ou (B) | Não |

**Produção nunca foi tocada em nenhuma fase.** Verificado byte a byte no fim: mesmos 299.917 bytes e mesmo `updateTime` do início.

---

## FASE 0 — DIAGNÓSTICO PRELIMINAR

### Arquitetura encontrada

```
NUVEM — Firestore — documento ÚNICO  jdpg/grupos
   dados = string JSON com os 70 PGs (tudo dentro de um campo só)
   ts · tutores · convites · setoresMestre · setoresEfetivo · embaixadoresExternos
   regra: allow read: if true · allow write: SEM AUTENTICAÇÃO
        ^ fbWriteGrupos (ÚNICO ponto de escrita)  |  fbReadDoc (ÚNICO ponto de leitura)

APARELHO
   PEQUENOS_GRUPOS = Array.from({length:70}) — memória
   localStorage['jdpg_grupos_v1'] — espelho
   + 20 chaves auxiliares
```

Não existe coleção de PGs nem documento por PG. Todo o cadastro é **um único campo de texto**, reescrito por inteiro a cada gravação, por qualquer aparelho, sem autenticação.

### Os 12 riscos da Fase 0

| # | Risco | Nível |
|---|---|---|
| 1 | Qualquer aparelho substitui a base inteira, sem autenticação | CRÍTICO |
| 2 | Versão antiga em cache (50 slots) apaga os PGs 51–70 | CRÍTICO |
| 3 | Status congelado + flag `pgStatusFiltros` = bomba armada | CRÍTICO |
| 4 | Slots "fantasmas" reutilizáveis (PG 3 e 25: gente sem nome) | CRÍTICO |
| 5 | `num` reciclável sem identidade permanente | ALTO |
| 6 | Gravação automática na produção durante o boot (`migrarStatusPg`) | ALTO |
| 7 | `tutorConfirmarZerarGrupo` destrói campos e ignora ciclo de vida | ALTO |
| 8 | `pgProgress` descartado em toda gravação | ALTO |
| 9 | Guarda pré-gravação não detecta PG que volta vazio | MÉDIO |
| 10 | Cada lista usa um critério diferente de "PG existe" | MÉDIO |
| 11 | `firestore.rules` do repositório não é aplicado | MÉDIO |
| 12 | `APP_VERSION` congelada em 2026-06-30 | BAIXO |

### Fato-âncora sobre o PG 51

Os três convites do PG 51 estão marcados `utilizado`, e o código só marca assim **depois** que a nuvem confirma a gravação. Logo: **em 19/08 às 16:05 o PG 51 existia na nuvem, com nome, coordenadora e 3 participantes.** O apagamento veio depois. O mesmo vale para o PG 52 "ACOLHIDOS" (criado 16:47).

**Perícia da forma do dado:** o slot 51 na nuvem hoje é **byte a byte idêntico** aos slots 60 e 70, que nunca foram usados — é o objeto de fábrica, não um objeto "limpo por alguém".

---

## FASE 1 — AUDITORIA FORENSE

### 1.1 Identidade

| Pergunta | Resposta |
|---|---|
| Qual campo identifica um PG? | `num` (1–70). Não há `id`, `uuid` nem `pgId` |
| É permanente? | **Não** — o número volta ao pool quando o PG é cancelado |
| Depende do índice do array? | No acesso não (`find(x => x.num === n)`); na origem sim |
| Depende do slot? | **`num` e slot são a mesma coisa** |
| Dois PGs podem ter o mesmo ID? | Tecnicamente sim; no snapshot atual não há duplicata |

### 1.2 Exclusão — o que significa "remover um PG"

**Não existe exclusão.** Existem duas operações, ambas destrutivas de formas diferentes:

| | `cancelarCriacaoPg` | `tutorConfirmarZerarGrupo` |
|---|---|---|
| Efeito | campos = null, status = LIVRE | **substitui o objeto inteiro** |
| Participantes | **NÃO são limpos** — ficam órfãos | zerados |
| Campos perdidos | nenhum | status, setores, campanhas, gratidões, reunioesMes, institucional, pgIMD, pgRanking |
| Nome gravado | `null` | `''` |
| Guarda de ciclo de vida | exige `EM_FORMACAO` | **nenhuma** |

### 1.3 Contagem — a mesma base, seis respostas diferentes

| Critério | Onde | Total |
|---|---|---|
| nome OU participantes ativos | `classificarPgs` / `V2` | 45 |
| `status === 'ATIVO'` | com flag `pgStatusFiltros` | 30 |
| nome E tutor E coordenador | `getGrupoStatus` = completo | 38 |
| sem nome, sem tutor, sem coordenador | fila de criação | 25 |
| `status === 'LIVRE'` | fila com a flag ligada | 33 |
| tem nome | lista administrativa | 43 |

### 1.4 Descoberta central: a leitura dispara escrita

`loadGrupos()` e `syncFromFirebase()` terminam chamando `migrarStatusPg()`, que **grava na nuvem** sempre que encontra um `status` nulo. A sincronização roda a cada 30 segundos, ao voltar da tela bloqueada e ao reconectar. Basta ler um documento com slots sem status para o aparelho escrever de volta a lista inteira.

**Podas que apagam dado fisicamente na volta:** gratidões e pedidos com mais de 7 dias; participantes `removed` com mais de 30 dias; todo mês anterior a 2026-07 em `reunioesMes`; participantes homônimos (o segundo é descartado por `applyGruposData`).

### 1.5 Hipóteses para o PG 51 — ordenadas

| Ordem | Hipótese | Veredito |
|---|---|---|
| 1 | **B+H — sobrescrito por aparelho com versão antiga (50 slots)** | **muito provável** |
| 2 | G — materializado vazio pela migração de status | provável (2º passo do nº 1) |
| 3 | A — excluído por ação humana | **refutada** |
| 4 | I — duplicado que substituiu a identidade | improvável |
| 5 | C/D/F — deslocado, mudou de ID, está em outro slot | **refutadas** |
| 6 | E — está no Firebase mas não é exibido | **refutada** |

**Cadeia técnica da hipótese 1:**

```
aparelho com app anterior a 18/08 (conhece 50 PGs, sem fbGruposPreservados)
        v grava sua lista de 50
documento fica só com PGs 1–50 — o 51 e o 52 somem
        v qualquer aparelho de 70 lê e vê 20 slots sem status
migrarStatusPg atribui LIVRE e grava sozinho
        v
slots 51–70 reaparecem VAZIOS, no formato de fábrica  <- estado atual
```

### 1.6 Evidências que ainda faltam

| Hipótese | Evidência que decide | Onde obter |
|---|---|---|
| B+H | `localStorage['jdpg_grupos_v1']` de cada aparelho: até que `num` a lista vai | Aparelho, DevTools, **offline** |
| B+H | `jdpg_sync_conflict_log` e `jdpg_sync_telemetry` | mesmas chaves |
| G | mensagem `[Migração status PG]` no console ao abrir o app | Console do aparelho |
| Recuperar conteúdo | **PITR (Point-in-Time Recovery)** | Console Firebase — **NÃO VERIFICADO ATÉ HOJE** |
| Todas | Cloud Audit Logs | Console Google Cloud |

**Advertência de método:** abrir o app num aparelho suspeito pode apagar a evidência e gravar na produção. A inspeção precisa ser feita **com o aparelho sem internet**. O modo `?teste=1` não serve para essa perícia (usa chaves com prefixo `teste_`).

---

## FASE 2 — RECONCILIAÇÃO DO INVENTÁRIO

Fontes cruzadas: banco atual (20/08 20:47Z) · baseline `AUDITORIA-IMD-FASE-2-MATRIZ.csv` (18/08 11:51, commit `2b7c4f3`) · trilha de 351 convites · código `d76a181`.

### Separação dos conceitos

| Conceito | Definição correta | Como o sistema tratava |
|---|---|---|
| SLOT | posição de 1 a 70 — um continente | existe |
| PG | grupo real: nome + tutor + coordenador + pessoas | **não existia como entidade** |
| ID | identificador único e imutável | **não existia** — usava o número do slot |
| STATUS | estado do ciclo de vida | gravado **uma vez**, nunca atualizado |
| CAPACIDADE | quantos PGs cabem | 70 slots ≠ 70 PGs |

### Resumo do inventário

| Medida | Valor |
|---|---|
| Slots totais | **70** |
| Slots ocupados | **45** |
| Slots livres | **25** — 18 de fábrica (53–70) + 7 com histórico (7, 32, 38, 45, 48, 51, 52) |
| PGs válidos (nome+tutor+coordenador) | **38** |
| PGs em formação | **5** (11, 13, 26, 28, 35) |
| PGs sem identificação / órfãos | **2** (3 e 25 — com pessoas, sem nome) |
| PGs duplicados simultâneos | **0** |
| Nomes reutilizados em outro slot | **12 nomes** |
| PGs removidos (cancelamentos plausíveis) | **5** (7, 32, 38, 45, 48) |
| PGs desaparecidos | **2** (51 e 52) |
| IDs duplicados | **0** |
| Registros inconsistentes | **12** (status: 34, 39, 41, 43, 44, 46, 47, 49, 50 · dados: 9, 31, 43) |

### Posições que exigem ação

| Slot | Situação | Ação proposta |
|---|---|---|
| 3 | **Sem nome** — era "Higienização plantão B" em 18/08; 5 pessoas intactas; tutor mudou | Restaurar nome (confirmar com o tutor) |
| 9 | Centro Cirúrgico — slot reciclado: contém a coordenadora do antigo "PÃO DA VIDA" + **4 participantes de teste** | Auditar e separar |
| 25 | **Sem nome** — era "Limpando corações"; hoje esse nome vive no slot 49 | Reconciliar identidade |
| 31 | Medicina — sem dia e horário | Completar cadastro |
| 34, 39, 41, 43, 44, 46, 47, 49, 50 | **Status incoerente** (LIVRE com gente dentro) | Corrigir status |
| 43 | Coordenador inválido (o campo contém o nome do grupo) | Corrigir |
| 7, 32, 38, 45, 48 | Vazios com histórico | Confirmar se o cancelamento foi intencional |
| **51** | **PG DESAPARECIDO** — "Puro & Simples", 3 pessoas, 3 convites utilizados em 19/08 | **Reservar o slot. Não recriar.** |
| **52** | **PG desaparecido/abortado** — "ACOLHIDOS", convite de coordenador pendente | Reservar o slot |
| 53–70 | Vazios de fábrica | Capacidade disponível |

### Identidade instável — nomes que já ocuparam mais de um slot

FORTALEZA (35, 41, 45) · HEMOGLOBINA ESPIRITUAL (37, 45, 46) · Limpando corações (25, 48, 49) · ACOLHIDOS (38, 52) · BÁLSAMO (34, 39) · Foco no Alto (2, 38) · PÃO DA VIDA (9, 33) · Manutenção da Fé (5, 32) · Plantão B Hotelaria (7, 13) · Alfa (3, 33) · REFUGIO ILUMINADO (36, 43) · Portaria do Céu-2 (13, 15)

**Isto é o sintoma "PGs duplicados":** não há duplicata simultânea — há um mesmo grupo que mudou de slot ao longo do tempo, deixando convites e vínculos apontando para o número antigo.

### PG 51 — situação encontrada

| Fonte | O que diz |
|---|---|
| Banco atual | Slot vazio, byte a byte idêntico aos slots 60 e 70 |
| Trilha de convites | "Puro & Simples", 3 convites **utilizados** em 19/08 entre 15:58 e 16:05 |
| Baseline de 18/08 | Não existia ainda (o slot nasceu em 19/08 15:54) |
| Código | Nenhum caminho legítimo produz este estado |
| Aparelhos | **Não inspecionados** |
| Backup / histórico / PITR | **Não verificado** |

**Situação:** PG desaparecido, existência comprovada, causa técnica identificada, conteúdo original ainda não recuperado. Os nomes dos dois colaboradores **só existem no aparelho da coordenadora** — nenhuma fonte no banco os contém.

**Nota de método:** a coluna `status` do baseline de 18/08 é derivada, então não foi usada para afirmar regressões de status. Os campos `nome`, `tutor`, `coordenador` e `participantes` são leitura direta e sustentam todas as divergências acima.

### Proposta de reconciliação R0–R8 (NUNCA APROVADA — continua pendente)

| Etapa | O que é | Escreve? |
|---|---|---|
| **R0** | Congelar a fonte de perda: identificar e atualizar o aparelho com versão antiga (inspeção offline dos 4 tutores) | Não |
| **R1** | **Verificar o PITR no Firebase** — única chance de recuperar o conteúdo do PG 51 | Não |
| **R2** | Restaurar identidade dos PGs 3 e 25 | Sim (2 campos) |
| **R3** | Corrigir os 9 status incoerentes | Sim (1 campo × 9) |
| **R4** | Limpar os 4 participantes de teste do PG 9 | Sim |
| **R5** | Confirmar os 5 cancelamentos (7, 32, 38, 45, 48) | Não |
| **R6** | Decidir o destino dos PGs 51 e 52 | Depende |
| **R7** | Completar cadastro do PG 31 e corrigir coordenador do PG 43 | Sim |
| **R8** | Política de capacidade: 70 slots ≠ 70 PGs; 51 e 52 reservados | Não |

**Duas travas adotadas como regra de trabalho:** nenhum slot com histórico volta para a fila de criação até a reconciliação terminar; toda escrita de reconciliação é feita campo a campo, com leitura antes e verificação depois — nunca por regravação da lista inteira.

---

## FASE 3 — CORREÇÃO ARQUITETURAL (desenho aprovado)

**Princípio:** o PG passa a ter identidade própria; o slot vira **endereço**. Mudança **aditiva** — o formato continua sendo um array de 70 objetos.

### A trava de versão — a peça central

Um cliente antigo não apenas ignora campos novos: **ele os apaga**. `applyGruposData` copia campo a campo de uma lista fixa e `trySaveGrupos` remonta o payload da mesma forma. Logo, nenhuma proteção escrita em JavaScript satisfaz a Invariante 7. A única fronteira que o aparelho antigo não atravessa é a **regra do Firestore**:

```
allow write: if request.resource.data.diff(resource.data).affectedKeys()
                    .hasAny(['dados'])   ->   exige também  'schemaVersion'
```

Quem mexer no cadastro tem que declarar em que esquema está escrevendo. O app antigo nunca envia `schemaVersion` — sua gravação é recusada **pelo servidor**. Ele continua lendo normalmente.

### As 8 invariantes e como cada uma é garantida

| # | Invariante | Garantia |
|---|---|---|
| 1 | Cada PG tem exatamente um ID | `pgId` UUID gerado na criação |
| 2 | Um ID identifica só um PG | `validarInventario` recusa colisão |
| 3 | Um PG ocupa no máximo um slot | `pgId` aparece uma única vez |
| 4 | Um slot contém no máximo um PG | `num` único, validado explicitamente |
| 5 | Slot vazio não é PG | slot vazio tem `pgId: null`; é PG quem tem `pgId` |
| 6 | Remover não renumera | já era verdade — passa a ter teste |
| 7 | Versão antiga não sobrescreve | **regra do Firestore + `schemaVersion`** |
| 8 | Contagem não vem da capacidade | todas passam por `inventarioPgs()` |

### Estrutura de dados proposta

```js
// PG ocupado — campos novos: pgId, setorId, historico
{
  num: 51,                 // SLOT — endereço, nunca identidade
  pgId: "b7c1…",           // ID estável (UUID v4), imutável
  nome, setorId, setores[], tutor, coordenador,
  diaReuniao, horaReuniao,
  status,                  // recalculado em toda transição
  participantes[], gratidoes[], reunioesMes{}, campanhas{},
  pgNivel, pgIMD, pgRanking, institucional,
  historico: [ { ts, evento, por } ]
}

// Slot vazio
{ num: 53, pgId: null, nome: null, …, status: "LIVRE" }

// Documento
{ schemaVersion: 2, dados: "[…]", ts, tutores, convites, setoresMestre, setoresEfetivo, embaixadoresExternos }
```

Custo: `pgId` em 70 PGs ≈ 3,2 KB sobre os 116 KB atuais (limite 500 KB).

### Estratégia de migração M0–M6

| Etapa | O que faz | Escreve? | Estado |
|---|---|---|---|
| **M0** | Publicar versão que **lê e preserva** `pgId`, `setorId`, `historico`, `schemaVersion` | não | **implementada, não publicada** |
| **M1** | Esperar adoção nos 4 tutores e coordenadores ativos | não | pendente |
| **M2** | **Fechar a porta:** alterar a regra no Console exigindo `schemaVersion` | não (regra) | **pendente — depende de você** |
| **M3** | `migrarPgIds()` nos 43 PGs existentes | **sim** | pendente (depende de M2) |
| **M4** | Reconciliação da Fase 2 (R2, R3, R4, R7) | **sim** | pendente |
| **M5** | Trocar as 6 contagens para `inventarioPgs()` | não | feito na Fase 4 |
| **M6** | Política de slots: 51 e 52 reservados | não | pendente |

**A ordem não é negociável: M2 antes de M3.** Atribuir `pgId` antes de fechar a porta significa vê-los apagados pelo primeiro aparelho antigo que gravar.

---

## FASE 4 — IMPLEMENTAÇÃO (capacidade 70 + proteções)

### Auditoria obrigatória das 17 ocorrências de 50/70

**Existe apenas UMA referência funcional à capacidade** em todo o arquivo (linha 9072, `Array.from({length:70})`). Todas as outras são XP de missões, faixas do IMD, limite do log de conflitos, z-index, timeouts e metas. **Nenhuma substituição mecânica de 50 por 70 era necessária ou correta.**

### Diff conceitual

```
CAPACIDADE
-  const PEQUENOS_GRUPOS = Array.from({length:70}, …)   <- número solto
+  const TOTAL_SLOTS = 70;                              <- capacidade, um lugar só

CONTAGEM
-  6 critérios espalhados -> 45, 30, 38, 25, 33, 43 para a mesma base
+  inventarioPgs() -> uma resposta, sete categorias

SCHEMA
+  SCHEMA_VERSION = 2, lido da nuvem em toda leitura
+  nuvem mais nova que o app -> gravação cancelada, alteração preservada, aviso

GRAVAÇÃO
   guarda antiga: "algum PG sumiu da lista?"     <- não pegava o caso do PG 51
+  guarda nova:   "algum PG que tinha conteúdo iria em branco?"
+  guarda nova:   invariantes (slot único, pgId único) antes de tocar a nuvem

ESCRITA AUTOMÁTICA
-  loadGrupos() -> migrarStatusPg() -> saveGrupos() -> PATCH em produção
+  … -> saveGruposLocal()
```

### As 7 proteções implementadas

1. **Guarda de esvaziamento** — cancela a gravação em que um slot com nome ou pessoas na nuvem voltaria em branco. É exatamente o buraco por onde o PG 51 passou.
2. **Guarda de invariantes** — nenhuma gravação sai com slot ou `pgId` repetido.
3. **Trava de schema no leitor** — app antigo em relação à nuvem não grava; a alteração fica pendente e protegida, e o usuário é avisado uma vez.
4. **Transporte de campos** — `pgId`, `setorId`, `historico` e `pgProgress` atravessam leitura → memória → aparelho → nuvem por uma lista única, num lugar só.
5. **Fim da gravação disparada por leitura** — `migrarStatusPg` persiste só no aparelho.
6. **`salvarFbConfig` desarmado** — grava o registro completo e exige confirmação.
7. **Capacidade centralizada** — o literal 70 não existe mais como capacidade em nenhum outro ponto.

---

## FASE 5 — TESTES DE INTEGRIDADE, REGRESSÃO E ESTRESSE

**Ambiente isolado:** a rede foi interceptada e substituída por um **Firestore falso em memória**, com a mesma semântica de `updateMask`, precondição `updateTime` e conflito `FAILED_PRECONDITION`. Produção verificada byte a byte no fim: intocada, nenhuma gravação tentada.

### 14 de 14 aprovados

| # | Teste | Evidência |
|---|---|---|
| 1 | 70 slots vazios | 70 slots / **0 PGs** / 70 livres |
| 2 | Criar PG1 | 1 PG / 69 livres / status EM_FORMACAO / pgId presente |
| 3 | Criar PG51 + reload | pgId na nuvem **idêntico** ao da memória |
| 4 | Criar PG52 | 51 intacto, pgId preservado |
| 5 | Criar até o PG70 | 70 PGs, 71º recusado (`sem_slot`), IDs únicos |
| 6 | Excluir PG52 | 52 vazio, 51 intacto |
| 7 | Excluir PG51 | slot livre; vizinhos 50 e 53 intactos; **numeração inalterada** |
| 8 | Recriar no slot liberado | pgId novo ≠ anterior |
| 9 | Dois PGs com o mesmo nome | permitido; IDs distintos |
| 10 | Versão antiga de 50 slots | 51–55 sobrevivem e voltam com **a mesma identidade** |
| 11 | Duas sessões simultâneas | B no slot 2, A no slot 3 — ninguém apagado |
| 12 | Reload após cada operação | estado idêntico após 3 recargas |
| 13 | Perda e volta de rede | não cria pela metade; pendência marcada; reenvio ao reconectar |
| 14 | Contagens | capacidade 70 · cadastrados 12 · livres 58 |

Mais as **11 invariantes internas** de `autoTesteFase4()`.

### Os 4 defeitos reais que a suíte encontrou

**D1 · O status nunca acompanhava o conteúdo.** Criar um PG gravava nome e tutor mas não tocava no status. Reproduzido do zero no laboratório: os 70 slots ficaram LIVRE com nome e gente dentro, e **o Tutor não conseguia cancelar o PG que ele mesmo tinha acabado de criar**. É o estado dos PGs 39, 41, 43, 44, 46, 47, 49 e 50 na produção — e a razão pela qual o PG 51 nasceu LIVRE, o que **prova** que ele não pode ter sido apagado por cancelamento.
→ Corrigido: `atualizarStatusPg()` na criação, na entrada por convite e na remoção de participante.

**D2 · Slot reciclado herdava a identidade do PG anterior.** Sem `pgId`, o novo PG no slot 51 era, para todos os efeitos, o PG antigo.
→ Corrigido: a identidade nasce com o PG e **morre com ele** (cancelar zera o `pgId`).

**D3 · Duas sessões colidiam e uma apagava a outra.** Cada aparelho escolhia o próximo slot livre olhando a própria cópia local, e no merge `nome: lg.nome ?? rg.nome` — o local sempre vence. O segundo a gravar apagava o nome do PG do primeiro **mantendo as pessoas dele dentro**.
→ **É a assinatura exata do PG 9 na produção.** As "renomeações" dos PGs 9, 15, 16 e as perdas de nome dos PGs 3 e 25 provavelmente **não foram renomeações — foram colisões**.
→ Corrigido: `criarPgNoProximoSlot()` sincroniza antes de escolher, declara a intenção e desfaz a criação local se outro aparelho ocupou o slot.

**D4 · O `pgId` chegava ao aparelho mas nunca à nuvem.** `trySaveGrupos` era o único dos quatro pontos de cópia que ficou de fora na Fase 4.
→ Corrigido, mais um teste que **lê o código-fonte das quatro funções** e falha se alguma parar de transportar.

### Desvio de escopo declarado

A Fase 5 pedia executar testes, não implementar. Os testes 6, 7 e 8 não podiam sequer rodar com D1 e D2 no caminho. As correções foram aplicadas **dentro do desenho aprovado na Fase 3**, e a suíte inteira foi reexecutada do zero. Uma decisão foi além da Fase 4: **`pgId` passou a ser gerado em PGs novos** (era M3). A migração dos 43 PGs existentes continua sendo M3 e continua não feita.

---

## FASE 6 — HOMOLOGAÇÃO CONTROLADA

### 1. Versão

| | |
|---|---|
| Candidata | **1.1.0-rc1** · build 2026-08-20 · schema de dados **2** |
| Base | `d76a181` |
| Alcance | `index.html` +447/−23 · `firestore.rules` +46 (só comentário) |

A versão saiu de `1.0.0`/junho, onde estava congelada há dois meses — foi essa constante congelada que impediu descobrir qual aparelho havia gravado.

### 3. Migrações realizadas: **NENHUMA**

Os 43 PGs existentes continuam **sem `pgId`**. Os `pgId` só passam a existir em PGs criados a partir de agora.

### 4. Schema

| Campo | Natureza |
|---|---|
| `schemaVersion` | novo · **lido sempre, gravado só com a flag ligada** |
| `pgId` | novo · aditivo, gerado só em PG novo |
| `setorId`, `historico` | reservados: transportados, ainda não usados |
| `pgProgress` | **já existia e estava sendo descartado**; volta a ser preservado |

Custo: ~3 KB sobre 116 KB, contra limite de 500 KB. Todos aditivos.

### 5. Funções alteradas

`PEQUENOS_GRUPOS` · `loadGrupos` · `saveGruposLocal` · `applyGruposData` · `trySaveGrupos` · `fbReadDoc` · `fbWriteGrupos` · `prepareSaveGrupos` · `saveGruposToFirebase` · `migrarStatusPg` · `confirmarCriarPg` · `cancelarCriacaoPg` · `aceitarConvite` · `removerParticipanteDoPainel` · `salvarFbConfig` · `renderTutorGruposList` · `APP_VERSION`.

**Novas:** `inventarioPgs` · `validarInventario` · `detectarEsvaziamento` · `registrarRetratoRemoto` · `transportarCamposPg` · `atualizarStatusPg` · `criarPgNoProximoSlot` · `painelCapacidadeHtml` · `autoTesteFase4`.

**Intactas, por decisão:** `commitConviteChange`, `gerarConvite`, `revogarConvite`, toda a identidade de pessoa (`memberId`), `fbGruposPreservados`, a precondição `updateTime`, o modo de teste, as podas, todo o cálculo do IMD e do ranking, e toda a camada visual exceto o painel novo.

### 6, 7 e 8. Testes: executados 25 · aprovados 25 · reprovados 0

**Validação cruzada mais forte que a suíte:** o app novo, lendo os dados reais, produz o inventário **idêntico** ao levantado à mão na Fase 2 — 70 / 43 cadastrados / 38 ativos / 5 em formação / 2 sem nome / 25 livres / 7 removidos.

### 9. Os 8 riscos residuais

| # | Risco | Nível | Situação |
|---|---|---|---|
| 1 | **Aparelho antigo ainda pode truncar o documento** | **ALTO** | só a regra do Firestore fecha a porta — **depende de você, no Console** |
| 2 | Ligar `schemaVersionWrite` antes da regra derruba todas as gravações (403) | **ALTO** | flag nasce desligada; ordem escrita em `firestore.rules` |
| 3 | `migrarSetoresParaMestre` ainda grava sozinha no boot | MÉDIO | identificada, não alterada; dano contido pela guarda |
| 4 | Os 43 PGs continuam sem identidade estável | MÉDIO | por decisão: M3 depende de M2 |
| 5 | Dados inconsistentes da Fase 2 continuam lá | MÉDIO | a reconciliação nunca foi aprovada |
| 6 | Modelo "documento único, lista inteira" continua de pé | MÉDIO, aceito | dívida registrada |
| 7 | Teste do formulário feito pela função, não pela tela | BAIXO | cobrir na homologação manual |
| 8 | PWA instalado pode demorar a pegar a versão nova | BAIXO | Service Worker removido e desregistrado no boot |

### Checklist de homologação

- [x] 70 slots funcionando · [x] Slots não são tratados como PGs · [x] IDs permanentes
- [x] Nenhum ID duplicado · [x] Nenhum PG ocupa dois slots · [x] Slots vazios identificados
- [x] PGs removidos fora da contagem ativa · [x] PG51 preservado (não tocado)
- [x] Contagens corretas · [x] Backup disponível · [x] Rollback definido
- [ ] ⚠️ **Versão antiga bloqueada contra escrita incompatível — PARCIAL.** No cliente sim; no servidor **não**: a regra está escrita, revisada e **não aplicada**
- [ ] ⚠️ **Firebase protegido contra substituição destrutiva — PARCIAL**, pela mesma razão

**Os dois itens abertos dependem de ação no Console do Firebase, não de código.**

### 10. Rollback

| Camada | Ação | Tempo |
|---|---|---|
| Antes de publicar | descartar as alterações no GitHub Desktop | imediato |
| Depois de publicar | republicar `d76a181` | 1 minuto |
| Regra do Firestore | colar de volta o texto guardado em `firestore.rules` | 1 minuto |
| Dados | **nenhuma reversão necessária** — nada foi migrado | — |
| Último recurso | `backup-firestore-jdpg-grupos-2026-08-20-1747.json` | manual |

**Não existe ponto sem retorno nesta entrega.**

---

## FASE 7 — REGISTRO PRÉ-PUBLICAÇÃO (ponto de parada)

**Commit `ac7aae8` feito localmente; `main` está 1 à frente da origem. NADA foi enviado ao GitHub.**

| # | Item | Valor registrado |
|---|---|---|
| 1 | Backup integral | `PRE-PUBLICACAO-2026-08-20-2313.json` · 299.917 bytes (2ª cópia) |
| 2 | Hash/versão | `index.html` sha256 `81104b32…a75eee` · 13.639 linhas · commit `ac7aae8` · 1.1.0-rc1 |
| 3 | schemaVersion | Código entende 2 · produção: **ausente = schema 1** |
| 4 | Quantidade de PGs | **43 cadastrados** — 38 ativos + 5 em formação |
| 5 | Slots ocupados | **45** (43 com nome + 2 registros sem nome) |
| 6 | Slots livres | **25** — 18 de fábrica (53–70) + 7 com histórico (7, 32, 38, 45, 48, 51, 52) |
| 7 | **PG 51** | **O slot existe; o PG não.** Nome vazio · pgId ausente · status LIVRE · 0 participantes · **3 convites utilizados** |
| 8 | IDs duplicados | **0** |
| 9 | PGs duplicados | **0** |
| 10 | Registros órfãos | ⛔ **2 — slots 3 e 25** |

### A divergência que bloqueou a publicação

Os slots 3 e 25 têm tutor, coordenador e participantes ativos, mas **não têm nome**. Pela regra definida ("qualquer inconsistência gera bloqueio e diagnóstico, não correção automática"), a publicação parou aqui.

Três pontos: (1) a divergência é **anterior** a esta versão; (2) esta versão **não a causa nem a corrige** — a publicação não escreve nem migra dado nenhum; (3) esta versão **impede que aconteça de novo** — é o defeito D3, corrigido e testado em T11.

### As duas saídas legítimas — DECISÃO PENDENTE

**(A) Publicar assim mesmo** — a versão não toca em dado; os órfãos seguem para a reconciliação (R2), agora com a garantia de que a causa não se repete. *Recomendado:* cada hora sem publicar é mais uma hora com o defeito de colisão ativo em produção.

**(B) Reconciliar antes** — restaurar os nomes dos slots 3 e 25 primeiro (exige confirmar com os tutores), e só depois publicar. Mais rigoroso, mais lento, e a reconciliação seria feita com o código antigo, que ainda tem o defeito.

### Ordem de publicação (não pode ser invertida)

1. Publicar `1.1.0-rc1` pelo GitHub Desktop (flag de escrita do `schemaVersion` desligada)
2. Confirmar que os 4 tutores e os coordenadores ativos carregaram a versão nova
3. Só então acrescentar `schemaVersion` à allowlist no Console (passo A da regra)
4. Ligar `FB_FLAGS.schemaVersionWrite = true` e publicar
5. Confirmar que as gravações continuam funcionando
6. Só então aplicar o passo B da regra — o que finalmente barra o aparelho antigo

### Bateria pós-publicação prevista (ainda não executada)

Leitura · lista de PGs · contagens · PG 51 · PG 70 · limites 50/51/52 · slots vazios — tudo em modo leitura, sem migração, sem limpeza, sem normalização. Se qualquer número divergir do registro acima: interromper e ir para o rollback (`git revert` do commit e republicação de `d76a181`).

---

## O QUE CONTINUA EM ABERTO

1. **Decisão (A) ou (B)** da Fase 7 — bloqueia a publicação.
2. **Verificar o PITR no Console do Firebase** (R1) — única chance de recuperar os nomes dos dois colaboradores do PG 51. Não depende de publicar nada. **É o item mais urgente.**
3. **R0 — inspeção offline dos aparelhos dos 4 tutores** para achar o que ainda tem 50 slots.
4. **M2 — aplicar a regra do Firestore** (a única barreira real contra o aparelho antigo).
5. **M3 — atribuir `pgId` aos 43 PGs existentes** (depende de M2).
6. **R2–R7 — reconciliação dos dados** (nomes dos PGs 3 e 25, 9 status, participantes de teste do PG 9, cadastro do PG 31, coordenador do PG 43).
7. **Bateria pós-publicação** da Fase 7.

## ARQUIVOS DE APOIO (fora do repositório)

| Arquivo | Onde |
|---|---|
| `backup-firestore-jdpg-grupos-2026-08-20-1747.json` | `Documents\Backups-PequenosGrupos\` |
| `PRE-PUBLICACAO-2026-08-20-2313.json` | `Documents\Backups-PequenosGrupos\` |
| `inventario70.csv` — as 70 posições com todas as colunas de evidência | área temporária da sessão de 20/08 |

⚠️ Os backups contêm **nomes e WhatsApps reais**. Estão fora do repositório de propósito — **não podem ser movidos para a pasta do projeto**, que é publicada no GitHub Pages.
