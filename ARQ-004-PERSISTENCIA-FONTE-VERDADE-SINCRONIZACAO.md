# ARQ-004 — Modelo de Persistência, Fonte da Verdade e Sincronização (somente diagnóstico/projeto)

> Realizado em 2026-07-30, sobre a fundação de Pessoa/`personId` (ARQ-002, ARQ-002.1, ARQ-003).
> **Nenhum código foi alterado.** Este documento responde à pergunta que o usuário formulou:
> não "onde salvar dados", mas **"qual é a fonte da verdade de cada entidade"** — e a resposta
> honesta é que, hoje, essa pergunta não tem resposta por entidade, porque não existe hoje
> "cada entidade" do ponto de vista do armazenamento. Isso é o achado central deste documento.

---

## 0. O achado que muda o enquadramento de tudo — um documento só

Antes de desenhar fonte da verdade "por entidade", é preciso registrar um fato que nenhuma
auditoria anterior (RC5.0, ARQ-001) havia declarado de forma explícita, embora as evidências já
estivessem todas presentes: **o sistema inteiro — os 50 Pequenos Grupos, todos os
participantes, todo o Mural, todos os Setores, todos os Convites, todos os Tutores — vive dentro
de um único documento do Firestore.**

```js
const FB_COLL = 'jdpg';
const FB_DOC  = 'grupos';   // ← um documento. Só um. Para o app inteiro.
```
*(index.html:8783-8784)*

E o próprio código já sabe que isso é um limite real, não teórico:

```js
async function fbWriteGrupos(cfg, data, ...) {
  const dadosStr = JSON.stringify(data);
  // Guarda de tamanho: a regra do Firestore rejeita "dados" >= 500 KB. Aborta antes de
  // um write fadado a falhar e avisa o usuário, evitando perda silenciosa.
  if (dadosStr.length > 480000) {
    console.error('Firestore: dados muito grandes...');
    fbWarnTooLarge();  // alert(): "Sua última alteração foi salva apenas neste aparelho,
                        //          mas não foi sincronizada."
    return { ok: false, sizeExceeded: true };
  }
```
*(index.html:8947-8954, 8938-8944)*

Isso não é um detalhe técnico — é a **causa raiz estrutural** por trás de quase todo achado de
persistência já catalogado neste projeto:

| Achado já conhecido | Como o "documento único" o explica |
|---|---|
| AUD-007 (setores sem merge de reconciliação) | Não dá pra ter merge nativo por registro quando o registro não é um documento — é uma posição dentro de uma string JSON gigante dentro de um campo. O merge teve que ser escrito à mão em JS (`mergeGruposData`) só para o array principal; nunca foi (nem seria simples) estendido aos outros campos. |
| Trava otimista conflita entre mudanças que não se relacionam | `updateTime` é do **documento inteiro** — um Tutor editando o PG 3 e outro editando o PG 40 competem pela mesma pré-condição, mesmo sem overlap real de dado. |
| Ceiling de 500 KB já ativo em produção | Orçamento de tamanho é **compartilhado por todos os 50 PGs somados** — quanto mais a base cresce (mais participantes, mais Mural, mais histórico), mais perto o app chega desse teto para todo mundo ao mesmo tempo, não só para quem está crescendo. |
| "tutores ficou null" (incidente já registrado, memória do projeto) | Uma gravação problemática em qualquer parte do documento arrisca o campo `tutores` inteiro, porque tudo está na mesma unidade atômica de escrita. |
| AUD-003 (`pgProgress`/`pgNivel` fora do payload) | Sintoma direto de **payload montado à mão** (`trySaveGrupos`, `saveGruposLocal` reconstroem um objeto campo-a-campo) — cada novo campo de estado precisa ser lembrado em N funções escritoras diferentes; é humanamente fácil esquecer um. |

**Conclusão do achado:** as perguntas "onde mora o Pessoa?", "onde mora o Setor?" não podem ser
respondidas de forma satisfatória **dentro da forma de armazenamento atual**, porque a forma
atual não tem conceito de "um registro" — tem um conceito de "o documento". Qualquer modelo de
fonte da verdade por entidade, para ser real (não só documentado), precisa vir acompanhado de uma
mudança na **forma de guardar o dado no Firestore**, não só de uma reorganização do código.

---

## 1. Arquitetura-alvo: de "1 documento" para "N coleções"

Proposta central deste ARQ: substituir o documento único por **uma coleção do Firestore por
entidade**, cada registro sendo **um documento próprio** — o uso do Firestore para o qual ele
foi desenhado, em vez do uso atual (Firestore como um "arquivo de texto na nuvem").

```
Hoje:                                    Proposto:
jdpg/grupos (1 documento)                jdpg_pessoas/{personId}
  ├─ dados (string JSON, 50 PGs)         jdpg_pgs/{pgId}
  ├─ tutores (string JSON)               jdpg_participacoes/{participacaoId}
  ├─ convites (string JSON)              jdpg_convites/{inviteId}
  ├─ setoresMestre (string JSON)         jdpg_setores_mestre/{setorId}
  ├─ setoresEfetivo (string JSON)        jdpg_setores_efetivo/{setorId}
  └─ embaixadoresExternos (string JSON)  jdpg_mural/{gratidaoId}
                                          jdpg_embaixadores_externos/{setorId_monthKey}
```

**Ganhos diretos, sem precisar de nenhuma lógica nova de merge escrita à mão:**
- Escrever o Setor 7 nunca mais compete, na trava otimista, com escrever o PG 12 — são
  documentos diferentes.
- O teto de 500 KB deixa de ser um orçamento global — cada documento tem seu próprio teto (1 MB,
  limite nativo do Firestore), e o crescimento de um PG não aproxima os outros 49 do limite.
- Merge por registro passa a ser o comportamento **padrão** do Firestore (atualizar campos
  específicos de um documento não apaga os demais), em vez de uma lógica JS que precisa ser
  escrita e mantida à mão para cada novo tipo de dado (o padrão que já causou AUD-001 e ainda
  causa AUD-007).

---

## 2. Fonte da Verdade por Entidade (tabela definitiva)

| Entidade | Fonte da verdade (proposta) | `localStorage` | Memória (sessão) |
|---|---|---|---|
| **Pessoa** | `jdpg_pessoas/{personId}` | cache de leitura (a própria Pessoa do dispositivo) | `PESSOA_ATUAL` |
| **ParticipacaoPG** (ex-Participante) | `jdpg_participacoes/{id}` | cache do que já foi visto | dentro do `g` carregado |
| **Pequeno Grupo** | `jdpg_pgs/{pgId}` (metadados do grupo — nome, dia/hora, tutor/coordenador **por personId**) | cache | `PEQUENOS_GRUPOS` |
| **Convite** | `jdpg_convites/{inviteId}` | cache local (já é hoje) | — |
| **Companheiro de Jornada** | relação dentro de `ParticipacaoPG` ou coleção própria `jdpg_companion/{id}` (referenciando `personId`, não nome+ts) | cache | — |
| **Setor Mestre** | `jdpg_setores_mestre/{setorId}` | cache (já é hoje) | `SETORES_MESTRE` |
| **Setor Efetivo** | `jdpg_setores_efetivo/{setorId}` (com `historico` como subcoleção, não array — evita o mesmo problema de documento crescendo sem limite) | cache | `SETORES_EFETIVO` |
| **Setor Acompanhado pelo PG** | campo `setoresIds[]` dentro do documento do próprio PG | — | — |
| **Estudos** | contagem dentro de `ParticipacaoPG` ou `Pessoa` (a decidir — ver Pontos Indefinidos) | `ST` (só o detalhe local, nunca autoritativo) | `ST` |
| **Missões** | idem Estudos | campanhas locais (`PG_CAMP_KEY`) | — |
| **Gratidão/Oração** | `jdpg_mural/{gratidaoId}`, subcoleção por PG (`jdpg_pgs/{pgId}/mural/{id}`) — `autor` = `personId` | cache | — |
| **Embaixadores (participação)** | dentro de `ParticipacaoPG` | — | — |
| **Embaixadores (externos)** | `jdpg_embaixadores_externos/{setorId}_{monthKey}` | cache | `EMBAIXADORES_EXTERNOS` |
| **Indicador IMD / Ranking** | **nenhuma** — permanece só calculado ao vivo, nunca persistido (confirma o que já é verdade hoje, ARQ-001) | — | resultado do cálculo, descartável |
| **Vínculo (Meus Vínculos)** | **não é fonte de verdade nem hoje nem no modelo novo** — é só um atalho de navegação local; a fonte real passa a ser a consulta `ParticipacaoPG` por `personId` | é a própria entidade (ok, porque é só cache de navegação) | — |
| **Configuração (metas, Firebase)** | permanece código/`localStorage` — não é dado de domínio (ARQ-002, item 18) | config de conexão | constantes |

**Regra geral que resolve a pergunta do usuário de uma vez por todas:** `localStorage` **nunca**
é fonte da verdade de nenhuma entidade de domínio no modelo proposto — é sempre cache de leitura
rápida e fila de escrita pendente. A única coisa que `localStorage` guarda com autoridade é o
que é **genuinamente local ao dispositivo por natureza** (qual `authUid` este aparelho está
usando agora, config de conexão, preferências de UI) — nunca dado que representa o negócio.

---

## 3. Resiliência a cada cenário citado pelo usuário

| Cenário | Como o modelo-alvo responde |
|---|---|
| **Troca de celular** | `Pessoa` vive no Firestore por `personId`; recuperação (ARQ-003, seção 4) religa o `authUid` novo ao `personId` existente — todas as `ParticipacaoPG` são encontradas por consulta (`where personId == X`), não por estarem "salvas" em algum lugar do aparelho antigo. |
| **Limpeza do navegador** | Mesmo caminho acima — o navegador limpo perde só o cache e o `authUid` local; a recuperação por WhatsApp (ARQ-003) religa ao `personId`. |
| **Perda de cache** | Por definição, cache pode ser reconstruído a qualquer momento por uma leitura fresca do Firestore — deixa de ser um evento de risco, porque nenhuma entidade de domínio depende dele para existir. |
| **Atualização do aplicativo** | Sem relação direta com este modelo (é versão de código, não de dado) — mas fica mais seguro migrar o **formato** de um documento por vez (uma coleção), em vez de precisar coordenar uma migração de schema dentro de um único documento gigante compartilhado por todo mundo ao mesmo tempo. |
| **Múltiplos dispositivos** | Cada coleção/documento tem sua própria trava otimista — dois dispositivos editando **entidades diferentes** (ex.: PG 3 e PG 9) nunca mais competem entre si; só concorrência real (dois editando o **mesmo** PG 3) gera conflito, que é o comportamento correto. |
| **Falhas de sincronização** | Fila de escrita pendente por documento (não por "tudo"), com o mesmo padrão de retry/backoff já validado em produção (`saveGruposToFirebase`) — só que aplicado por entidade, então a falha de sincronizar o Mural do PG 40 não atrasa nem arrisca a sincronização do cadastro do PG 3. |

---

## 4. Os sintomas relatados pelo usuário, explicados pela causa raiz

- **"Coordenador perdeu botões"** — condizente com o incidente já registrado em memória do
  projeto (`TUTORS` chegou a ficar `null` em produção, 2x, mesmo após correção). Sob o modelo de
  documento único, um problema em **qualquer parte** do documento pode arrastar o campo
  `tutores` inteiro. Sob o modelo-alvo, o papel de Tutor mora em `ParticipacaoPG`, um documento
  por pessoa/grupo — um problema de escrita atinge, no pior caso, **um registro**, nunca todos
  os tutores do sistema ao mesmo tempo.
- **"Participantes desapareceram"** — mesma causa raiz; tombstone (já existente) continua
  valendo no modelo novo, mas some o risco adicional de uma escrita malformada no documento
  gigante arrastar junto participantes que nada tinham a ver com a mudança que causou o problema.
- **"Setores sumiram"** — era exatamente o AUD-001 (já corrigido) mais o AUD-007 (ainda aberto);
  o modelo-alvo fecha o AUD-007 por construção (merge por documento é nativo do Firestore, não
  precisa mais ser escrito à mão).
- **"Progresso ficou desatualizado"** — AUD-003, causa raiz "payload montado à mão"; no modelo
  proposto, `ParticipacaoPG`/`Pessoa` são gravados como o objeto que já existe em memória (ou um
  subconjunto explícito e único, mantido num só lugar), eliminando a necessididade de manter
  N listas de campos sincronizadas entre si.
- **"Metas antigas"** — não é um problema de sincronização (as metas são constantes no código,
  ARQ-002 item 18) — é about outra coisa (gestão de configuração/produto), fora do escopo deste
  ARQ. Sinalizado para não ser confundido com os demais.
- **"Companheiro de Jornada perdido"** — ARQ-002 Achado 3 (`compParceiro` referencia por
  nome+timestamp). No modelo-alvo, referencia `personId` — sobrevive a mudança de nome, e (se
  virar coleção própria) sobrevive até a uma reestruturação do PG, porque não fica aninhado
  dentro do array de participantes de um documento monolítico.

---

## 5. Plano Conceitual de Migração (sem código)

Migrar de "1 documento" para "N coleções" é a mudança de maior risco técnico proposta até agora
nesta série ARQ — precisa de uma estratégia de convivência, não um corte seco.

1. **Escrita dupla, leitura antiga** — o app passa a também gravar cada entidade na nova coleção
   correspondente, no mesmo momento em que grava no documento único (que continua sendo lido,
   por enquanto). Não muda nenhum comportamento visível; só começa a popular o novo formato.
2. **Leitura dupla, com preferência pela nova** — o app passa a ler da nova coleção quando o
   registro já existe lá, caindo para o documento único só para o que ainda não foi migrado.
   Nesta fase, qualquer discrepância entre os dois vira um sinal de alerta (candidato a log,
   ver futuro ARQ-005), não um erro fatal.
3. **Corte** — quando 100% dos registros tiverem sido vistos na nova coleção por um período de
   segurança (ex.: todas as sessões de todos os dispositivos ativos já passaram por lá pelo menos
   uma vez), o documento único deixa de ser escrito. Mantido só como backup de leitura por um
   tempo, depois removido.
4. Este plano é **por entidade**, não tudo de uma vez — a ordem natural segue a mesma sequência
   já usada nas decisões anteriores desta série: `Pessoa`/`ParticipacaoPG` primeiro (é o que o
   ARQ-003 já pressupõe), Setores em seguida (já são conceitualmente separados desde o ADR-001,
   menor esforço de extração), PG/Mural por último (maior volume, mais telas tocam neles).

---

## Riscos

| Risco | Mitigação |
|---|---|
| Custo de leitura pode aumentar (várias consultas pequenas em vez de 1 leitura grande) | Mitigável com os índices/consultas certas (`where personId ==`, `where pgId ==`) — Firestore foi desenhado para esse padrão, ao contrário do padrão atual |
| Período de escrita dupla é, ele mesmo, uma janela de "duas fontes podem divergir" | Mesmo risco já aceito e navegado com sucesso em toda migração aditiva anterior do projeto (ex.: tombstone, C3) — não é um risco novo, é o mesmo padrão já validado |
| Maior número de coleções para uma pessoa não-técnica acompanhar no Console do Firebase | Real, mas documentação (`ARCHITECTURE.md`) já compensa isso para os conceitos atuais; mesma disciplina se estende |

## Pontos Indefinidos

- Estudos/Missões: ficam dentro de `ParticipacaoPG` (visão "por participação nesse PG") ou
  dentro de `Pessoa` (visão "profundidade da pessoa, independente do PG")? Ambas têm uso —
  decisão de produto, não puramente técnica, melhor tomada quando o Épico 4 (Inteligência
  Pastoral) for retomado.
- Se o Mural (Gratidão/Oração) vira subcoleção do PG ou coleção própria com `pgId` como campo —
  afeta só a forma da consulta, não o modelo conceitual; decisão de implementação, não
  arquitetural.

## Recomendação Final

Aprovar o modelo de "uma coleção por entidade" como direção de destino, com o plano de migração
em 4 fases (seção 5), começando por `Pessoa`/`ParticipacaoPG` — a mesma ordem já estabelecida
pela decisão de identidade (ARQ-002.1/ARQ-003). O achado da seção 0 (documento único, teto de
500 KB já ativo) é, na prática, um **risco de continuidade em si mesmo** — mesmo sem qualquer
outra mudança, o app se aproxima desse teto conforme a base cresce; vale considerar esta
migração não só pela limpeza arquitetural, mas como mitigação de um risco operacional que já
tem um alarme (`fbWarnTooLarge`) ativo em produção.

**Este documento é exclusivamente diagnóstico/de projeto — nenhum código foi escrito, nenhuma
coleção nova foi criada, nenhuma migração foi executada.**

---

## Dívida arquitetural — DIV-001: escrita destrutiva da lista inteira

**Registrada em:** 2026-08-18 · **Origem:** vulnerabilidade encontrada ao dimensionar a expansão
de 50 para 70 slots de PG.

### O modelo atual

Toda gravação monta o payload como `PEQUENOS_GRUPOS.map(...)` e substitui o campo `dados` inteiro
do documento. Isto significa, na prática:

> **"A minha lista local inteira substitui a lista da nuvem."**

Consequência: aquilo que o aparelho local **não conhece** é indistinguível, para a nuvem, daquilo
que o aparelho local **decidiu apagar**. Uma versão do app que conhece 50 slots, ao gravar sobre uma
nuvem que já tem 70, apaga 20 PGs reais — sem erro, sem aviso, sem conflito de concorrência.
Comprovado em teste em 18/08/2026 sobre o código então em produção: payload de 50, 20 PGs perdidos.

### O que foi feito agora (mitigação, não correção)

`registrarGruposDesconhecidos()` + preservação em `fbGruposPreservados`, devolvidos em toda
gravação, mais uma validação pré-gravação que cancela a escrita se algum PG já visto na nuvem
sumiria do payload. Isso **protege o sintoma conhecido** (PG inteiro desconhecido) e não custa
nada ao fluxo normal.

### O que continua em aberto

A mitigação protege o registro de PG inteiro. Ela **não** protege campos ou entidades dentro de um
PG que uma versão futura venha a criar e uma versão antiga não conheça — porque `applyGruposData`
e o payload de `trySaveGrupos` listam campo a campo, e um campo novo que a versão antiga não copia
continua sendo apagado na regravação. É a mesma família do problema já registrado em
"campo novo do grupo precisa ser listado em 5 funções".

### Direção-alvo

Evoluir de "substituo a lista inteira" para **"atualizo apenas o que realmente mudou"** — escrita
por delta/por documento, e não por substituição de coleção serializada. Isso é a mesma direção da
seção 1 deste documento (de "1 documento" para "N coleções"): com uma coleção por PG, uma gravação
toca um documento só, e desconhecer um PG deixa de ser capaz de apagá-lo, por construção.

**Não implementar junto com mudanças de capacidade ou de regra de negócio.** Esta dívida é a causa
raiz de uma classe de perda de dados; merece RC própria, com homologação dedicada.
