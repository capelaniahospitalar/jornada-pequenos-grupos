# AUDIT-02-CONVITES — Auditoria do ciclo de vida do convite

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 2 — Convites: geração, reenvio e aceite repetido
**Data de execução:** 2026-08-31
**Baseline de código:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Baseline de dados:** instantâneo de produção de 31/08/2026 09:51:54Z, capturado na Fase 0
**Método:** análise estática do código + análise **somente leitura** de 492 convites reais
**Alterações de código nesta fase:** **nenhuma** · **Escritas em produção:** **nenhuma**

**Reclamação investigada:**
> *"Mandaram novamente o mesmo convite e a pessoa não conseguiu entrar."*

---

## Resposta direta à reclamação

**O convite não é o problema.** Em nenhum dos casos de reenvio encontrados em produção o convite
estava inválido, vencido, revogado ou impossível de aceitar. Pelo contrário: existe hoje uma
pessoa segurando **12 links válidos e simultâneos** para o mesmo Pequeno Grupo, criados ao longo
de 9 dias, e ela continua fora do grupo.

O que a auditoria estabeleceu:

| Pergunta | Resposta |
|---|---|
| O reenvio reaproveita o convite? | **Não.** Cada toque no botão cria um convite **novo** |
| O reenvio invalida o anterior? | **Não.** O anterior continua válido e pendente |
| Quantos links válidos uma pessoa pode acumular? | Sem limite. O recorde em produção é **12** |
| O app percebe que são para a mesma pessoa? | **Não.** 396 dos 492 convites nem registram o destino |
| Um convite pode nascer impossível de aceitar? | Sim, mas **não aconteceu**: 0 casos em 492 |
| Reabrir o próprio link depois de entrar funciona? | **Não.** Diz "já utilizado por outra pessoa" |

**Conclusão:** quando alguém "manda de novo o mesmo convite", ou ele está encaminhando o link
antigo (que continua válido) ou está gerando um link novo (que também é válido). Nos dois casos o
convite funciona. **A falha está depois do convite** — na tela que o recebe, no navegador que o
abre, ou no aplicativo de mensagens que o entrega.

---

# 2.1 — GERAÇÃO

## Como o convite é criado

Duas portas, ambas terminando na mesma função:

| Porta | Função de entrada | Linha |
|---|---|---|
| Coordenador convida colaborador · Tutor convida coordenador | `gerarECompartilhar(funcao, grupoNum)` | `index.html:10472` |
| Convite automático ao criar um PG | `gerarConvidarCoordenadorAutoEExibir(...)` | `index.html:3299` |

Ambas chamam `gerarConvite()` (`index.html:10118`), que confere autoridade, monta o objeto com
`criarConviteObj()` (`index.html:9917`) e grava pelo laço seguro `commitConviteChange()`.

## As sete perguntas

### ✅ Existe ID único?

**Sim.** `inviteId: uuid()` — UUID v4, 36 caracteres, gerado no aparelho de quem convida.
Em produção: **492 convites, 492 identificadores distintos, zero colisões.**

### ⚠️ Existe token?

**O ID *é* o token.** Não há um segredo separado. O link é `?conv=<inviteId>` e nada mais — nem
nome, nem grupo, nem função viajam na URL. Toda a verdade é buscada na base.

Isto é uma decisão de desenho **correta** (o link não vaza dado pessoal), com uma consequência que
precisa ser dita: **quem tiver o link entra.** Não há confirmação de que quem abriu é a pessoa
convidada. O campo `paraWa` é apenas uma sugestão de destino — nunca é comparado com o WhatsApp
que a pessoa digita ao entrar.

### ✅ O token é determinístico?

**Não — e isso está certo.** `uuid()` é aleatório. Duas consequências:

1. Um convite **não pode ser adivinhado** a partir do grupo, da data ou do telefone.
2. **Não é reproduzível.** Gerar de novo para a mesma pessoa, no mesmo grupo, no mesmo segundo,
   produz um identificador diferente — é por isso que o reenvio não pode reaproveitar nada
   automaticamente (ver 2.2).

### ✅ Existe validade?

**Sim: 7 dias.** `CONVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000` (`index.html:9870`), gravado como
`expiraEm` no momento da criação.

A validade é conferida **duas vezes**, nas duas comparando com o relógio diretamente
(`index.html:10012` e `10372`). **Um convite vencido nunca é aceito** — isso funciona.

### ✅ Existe status?

**Sim: quatro estados gravados**, com máquina de estados explícita
(`transicaoConviteValida`, `index.html:9877`):

```
                    ┌──→ utilizado  ┐
     pendente ──────┼──→ cancelado  ├──→ (terminais, absorventes)
                    └──→ expirado   ┘
```

Nunca volta a `pendente`. A resolução de conflito entre aparelhos (`resolverConvite`,
`index.html:9884`) só aceita o mais recente **se a transição for válida** — um aparelho atrasado
não consegue ressuscitar um convite já usado.

**Em produção, porém, o estado `expirado` não existe:**

| Estado | Quantidade |
|---|---|
| utilizado | 207 |
| cancelado | 195 |
| pendente | 90 |
| **expirado** | **0** |

Confirma o achado **F-30** da Fase 1: `expirarConvitesVencidos()` (`index.html:9955`) nunca é
chamada. Consequência medida agora: **34 dos 90 pendentes já passaram do prazo** e continuam
marcados como pendentes. O mais antigo foi criado em **13/07** — 49 dias atrás, sete vezes a
validade.

Como `podarConvites()` só remove convites em estado terminal, esses 34 **nunca serão removidos do
documento**. Eles são inofensivos para a segurança (o relógio os barra no aceite) e caros para o
tamanho (ver §4).

### ❌ Existe contador de uso?

**Não.** Verificado nos 492 convites: **nenhum campo de contagem**. Os 15 campos são:

```
inviteId · versaoConvite · tipo · funcao · grupoNum · grupoNome
deId · deNome · paraWa · status · criadoEm · expiraEm · updatedAt
usadoPor · usadoEm
```

O uso é registrado como **fato binário**: `status` vira `utilizado`, `usadoPor` recebe o
`memberId` de quem usou, `usadoEm` recebe o horário. Não há "usado 3 vezes", não há histórico de
tentativas, não há registro de tentativa **falhada**.

> ### 🔴 F-31 — `usadoPor` é gravado e **nunca lido**
>
> Varredura no arquivo inteiro: `usadoPor` aparece em exatamente dois lugares — a criação
> (`index.html:9929`, valor `null`) e o aceite (`index.html:10224`, recebe o `memberId`).
> **Nenhuma leitura. Nenhuma comparação. Em lugar nenhum.**
>
> O aplicativo sabe quem usou cada convite e nunca usa essa informação. A consequência aparece
> em 2.3: quando a própria pessoa reabre o próprio link, o app não tem como reconhecê-la — e
> a acusa de que o convite foi usado *por outra pessoa*.
>
> (O campo já provou seu valor fora do app: foi por `usadoPor` que se recuperou o `memberId` real
> do coordenador do PG 22 em 30/07. Ele é útil — só não é usado pelo próprio aplicativo.)

---

# 2.2 — REENVIO

## O cenário, resolvido

```
Convite A criado           → status: pendente · inviteId: X
       ↓ enviado
participante não entra     → NADA muda. O convite A continua pendente e válido.
       ↓
"Convite A é enviado novamente"
```

A partir daqui, **o comportamento depende de qual das três coisas o coordenador fez** — e as três
são chamadas de "mandar de novo" na conversa:

| O que a pessoa faz | O que o app faz |
|---|---|
| **(a)** Encaminha a mensagem antiga do WhatsApp | Nada. Mesmo link, mesmo `inviteId`. É literalmente o convite A |
| **(b)** Usa "📋 Copiar link" na lista de pendentes | Nada. Copia o link do convite A. Mesmo `inviteId` |
| **(c)** Toca de novo no botão de convidar | **Cria um convite B, novo e independente.** A continua válido |

### Respostas às seis perguntas

| Pergunta | (a) encaminhar | (b) copiar link | (c) botão de novo |
|---|---|---|---|
| **Reutiliza o convite?** | Sim | Sim | **Não** |
| **Cria outro convite?** | Não | Não | **Sim** |
| **Invalida o anterior?** | Não | Não | **Não** — os dois ficam válidos |
| **Altera algum campo?** | **Nenhum** | **Nenhum** | Nenhum no A; cria B do zero |
| **Mantém o mesmo token?** | Sim | Sim | **Não** — UUID novo |
| **Gera conflito?** | Não | Não | Não. Mas ver abaixo |

### Nos caminhos (a) e (b), literalmente nada é gravado

Este ponto merece ênfase porque contraria a intuição: **reenviar um link não toca no convite.**
Não há campo de "reenviado em", não há contador, não há `updatedAt` alterado. A base não registra
que houve reenvio. Do ponto de vista do sistema, os caminhos (a) e (b) **não existem** — são
apenas alguém copiando um texto.

Corolário: **se o convite A funcionava antes, ele funciona depois do reenvio** (dentro do prazo).
Se não funcionava, reenviar não muda absolutamente nada. É por isso que "mandei de novo e não
adiantou" é o resultado esperado, não um defeito.

### No caminho (c), o "conflito" que existe não é de gravação

Não há colisão técnica: o laço `commitConviteChange` grava com pré-condição e mescla as listas.
O conflito é **de acúmulo**:

> ### 🔴 F-32 — Não existe reenvio; existe multiplicação
>
> Cada toque no botão cria um convite novo e **deixa todos os anteriores válidos**. Não há
> verificação de "já existe um convite pendente para este destino neste grupo". A única
> deduplicação do app inteiro está no convite automático de criação de PG
> (`index.html:3305-3310`) — e ela não cobre o caminho normal de convidar participante.
>
> Resultado medido em produção: **5 pessoas seguram hoje mais de um link válido ao mesmo tempo**,
> uma delas com **12**.

### Uma exceção: o único reaproveitamento que existe

`gerarConvidarCoordenadorAutoEExibir` (`index.html:3305`) procura um convite pendente do mesmo
grupo e função antes de criar outro. Mas:

- lê do **cache local** (`loadConvites()`), não do remoto — em aparelho novo, o cache está vazio;
- exige `c.grupoNome === gAtual.nome` com **igualdade estrita** — se o PG foi renomeado desde a
  emissão, o convite antigo não é reconhecido e um novo é criado;
- não filtra por quem emitiu — pode reaproveitar convite gerado por outra pessoa.

**F-36** — reaproveitamento parcial, frágil e restrito a uma única tela.

## O que a base mostra sobre reenvio

Dos 492 convites, **apenas 96 registram o destino** (`paraWa` preenchido). Só neles é possível
saber que dois convites foram para a mesma pessoa.

> ### 🔴 F-33 — 396 dos 492 convites (80%) não registram para quem foram
>
> O campo `paraWa` é opcional. Quando o coordenador não digita o número — e na maioria das vezes
> não digita —, **o app perde para sempre a informação de quem era o destinatário**.
>
> Consequências: não há como deduplicar; não há como saber se a pessoa já recebeu convite; não há
> como responder "por que esta pessoa não entrou?"; e a lista "Convites pendentes que você enviou"
> mostra linhas sem identificação alguma, que o coordenador não consegue distinguir entre si.
>
> A própria auditoria esbarrou nisso: **80% do problema é invisível na base.** Todos os números
> desta seção descrevem os 20% mensuráveis, e são portanto um **piso**, não um retrato completo.

### Repetição medida (nos 96 convites com destino)

| Medida | Valor |
|---|---|
| Destinos que receberam mais de um convite | **17** |
| Convites envolvidos nessas repetições | **70** de 96 (73%) |
| Pares consecutivos com menos de 60 segundos entre si | **34** |
| Pares consecutivos com mais de 1 dia entre si | **13** |

Os dois padrões são **fenômenos diferentes** e não devem ser confundidos:

- **34 pares em menos de 1 minuto** = a pessoa tocando no botão repetidamente porque *nada
  aconteceu na tela*. É o defeito de abertura do WhatsApp (F-09), não reenvio deliberado.
- **13 pares com mais de 1 dia** = "mandei de novo" de verdade. É a reclamação auditada.

### Os casos concretos

Sem telefone e sem nome — identificados por PG e janela de tempo:

| # | PG | Convites | Janela | Situação hoje |
|---|---|---|---|---|
| 1 | 7 | **14** | 20 minutos (21/08) | Todos cancelados. **A pessoa está no grupo** |
| 2 | 30 | **13** | **9 dias** (17→26/08) | **12 links válidos agora. A pessoa NÃO está no grupo** |
| 3 | 30 | 7 | 11 dias (13→24/08) | 4 links válidos. A pessoa NÃO está no grupo |
| 4 | 7 | 6 | 5 dias | 3 links válidos. A pessoa está no grupo |
| 5 | 7 | 4 | 5 dias | Entrou (1 utilizado) |
| 6 | 7 | 4 | 5 dias | 3 links válidos. A pessoa NÃO está no grupo |

**O caso 2 é a reclamação, documentada.** Treze convites para a mesma pessoa, no mesmo grupo, ao
longo de nove dias. Doze deles **estão válidos neste momento**. A pessoa continua fora.

Rodei a simulação do aceite sobre esses 12 convites: **todos passam**. Grupo existe, prazo
vigente, status pendente, autoridade do emissor confirmada. Não há nada de errado com eles.

**Portanto: o convite número 14 também não vai funcionar.** O obstáculo não está no convite.

### Concentração de pendentes

| PG | Pendentes | dos quais vencidos |
|---|---|---|
| 30 | 28 | 7 |
| 7 | 17 | 7 |
| 27 | 6 | 1 |
| 34 | 4 | 4 |
| demais 23 PGs | 35 | 15 |

**Dois PGs concentram metade de todos os convites pendentes do sistema.** São os dois com
histórico conhecido de "não consigo convidar" — o que confirma que o acúmulo é o *sintoma* de
tentativas repetidas, não a causa.

### As correções de 24, 26 e 27/08 funcionaram?

Datas das rajadas de toque repetido (menos de 60 s entre convites ao mesmo destino):

| Data | Rajadas | PG |
|---|---|---|
| 13/08 | 3 | 30 |
| 17/08 | 1 | 30 |
| 21/08 | 14 | 7 |
| 24/08 | 5 | 30 |
| 25/08 | 2 | 7 |
| 26/08 | 8 | 30 |
| **27/08** | **1** | 50 |
| **28/08** | **0** | — |

**Indício favorável, mas não prova.** As rajadas caem para 1 em 27/08 (dia da correção do
"Copiar link") e zero em 28/08. Só que **em 28/08 foram criados apenas 5 convites em todo o
sistema** — a amostra é pequena demais para concluir. A pergunta em aberto sobre uma possível
regressão da correção de 26/08 **continua em aberto**; estes dados não a fecham nos dois sentidos.

---

# 2.3 — ACEITE REPETIDO

## Cliques sucessivos no mesmo convite A

### Caso A → primeiro clique

O caminho normal, mapeado na Fase 1. Dois desfechos:

- **Sucesso:** `status` → `utilizado`, `usadoPor` → seu `memberId`, participante criado ou
  recuperado, entrada concluída.
- **Falha:** o convite **continua pendente**. Nada foi gravado. O laço `commitConviteChange` só
  aplica o estado local depois do `ok` do servidor — se falhou, falhou inteiro.

### Caso A → segundo clique

**Depende inteiramente do que aconteceu no primeiro.**

| Primeiro clique | Segundo clique |
|---|---|
| Falhou antes de gravar (sem internet, tela fechada, link perdido) | ✅ **Funciona normalmente.** O convite nunca saiu de `pendente` |
| Falhou por autoridade / prazo / grupo | ❌ Mesma recusa. Nada mudou |
| **Deu certo** | ❌ **"Convite já utilizado por outra pessoa."** |

> ### 🔴 F-31 (consequência) — o app acusa você de ser outra pessoa
>
> `renderTelaConvite` (`index.html:10370`) e `validarConviteParaAceite` (`index.html:10012`)
> verificam apenas `inv.status !== 'pendente'`. **Nenhuma das duas compara `inv.usadoPor` com
> `getMyMemberId()`** — a informação está gravada e não é consultada.
>
> Quem entrou com sucesso e reabre o próprio link — porque salvou a mensagem, porque o atalho da
> tela inicial perdeu o vínculo, porque recarregou a página e a URL foi apagada (**F-10**) — lê:
>
> > *"Convite já utilizado — Este convite já foi utilizado por outra pessoa."*
>
> A mensagem está **factualmente errada** e é acusatória. A pessoa conclui que alguém roubou o
> convite dela, e o coordenador conclui que precisa gerar outro — alimentando o ciclo do F-32.
>
> Bastaria comparar `usadoPor` com o `memberId` local para dizer *"Você já faz parte deste
> Pequeno Grupo"* e levá-la para dentro. O dado necessário já está gravado desde sempre.

### Caso A → terceiro clique (e todos os seguintes)

**Idêntico ao segundo.** Estado terminal é absorvente: `utilizado` nunca volta a `pendente`, e a
mensagem é sempre a mesma. **Não há degradação, não há bloqueio progressivo, não há registro das
tentativas.** Clicar cem vezes produz cem vezes o mesmo texto e zero linhas na base.

Isto tem um lado bom (nenhum dano) e um lado ruim: **tentativas frustradas são invisíveis**.
Nenhuma das dezenas de "não consegui entrar" relatadas em campo deixou rastro no sistema. Não é
possível auditar quantas houve — só quantos convites foram criados em resposta a elas.

## Aceite conforme o estado do participante

### A → participante **já existente** (mesmo aparelho)

`aceitarConvite` acha o registro por `memberId` (`index.html:10195`).
Atualiza `nome`, `tipo` e `papel`. **Não cria duplicata.**

⚠️ Mas o convite é consumido. Se a pessoa já era membro e abriu um convite novo só para "voltar
para dentro do app", ela gasta um convite e não ganha nada. E `wa` não é atualizado nunca.

### A → participante **removido** (tombstone)

Este é o caso mais delicado, e o comportamento é **inconsistente entre as duas verificações**:

| Verificação | Trata tombstone? |
|---|---|
| `getMeuGrupoAtivo` (DB-01, se já tem outro PG) | **Sim** — ignora removidos (corrigido em `1aafe63`) |
| `aceitarConvite` → `find(x => x.memberId === memberId)` (`index.html:10195`) | **Não** — acha o registro removido |

Consequência: quem foi removido e recebe um convite novo para o **mesmo** PG **encontra o próprio
registro com tombstone** e o reaproveita — sem que `removed` seja apagado.

> ### 🔴 F-37 — O aceite não limpa o tombstone
>
> `index.html:10209-10213` (ramo "participante já existe") atualiza `nome`, `tipo` e `papel`.
> **Não toca em `p.removed`.** O registro volta a ser "o seu", mas continua marcado como removido.
>
> A partir daí o comportamento diverge conforme quem pergunta: `participantesAtivos()` e
> `applyGruposData` filtram `removed` e não veem a pessoa; `aceitarConvite` a vê. **A pessoa
> aceita o convite com sucesso, recebe a tela de boas-vindas, e não aparece na lista do grupo.**
>
> E há um relógio: `podarParticipantesRemovidos` (`index.html:9655`) apaga definitivamente os
> registros com tombstone depois de **30 dias**. Passado esse prazo, o registro some, e o próximo
> aceite cai no caminho de recuperação por nome + WhatsApp (F-11) ou cria uma duplicata.
>
> **Em produção há 21 registros com tombstone**, todos sujeitos a este caminho.

Medição do efeito espelho, nos convites já utilizados:

| O usuário do convite hoje | Quantidade |
|---|---|
| Ativo no PG | 181 |
| **Com tombstone (removido depois)** | **14** |
| **Não existe mais no PG** | **12** |

**26 pessoas** (12,6% dos aceites bem-sucedidos) usaram um convite e hoje não constam como ativas
no grupo. Se qualquer uma delas reabrir o próprio link, recebe *"já utilizado por outra pessoa"*
e não entra — **exatamente a reclamação auditada**.

### A → participante **em outro PG**

Rota DB-01 (`index.html:10440-10450`): modal de troca → `removerDoGrupoAtual` → reentrada
recursiva. Funciona, com duas ressalvas já catalogadas:

- **F-15** — a remoção identifica a pessoa por `p.ts === meuGrupo.ts`. Se `loadMeuGrupo()`
  devolveu o objeto reconstruído de `ST` (sem `ts`), o tombstone pode não ser marcado.
  **Verificação em produção: 0 dos 258 participantes ativos estão sem `ts`.** O ramo perigoso
  (marcar tombstone na pessoa errada) **não tem combustível hoje**; o ramo "não marca nada"
  continua possível.
- **F-21** — duas gravações concorrentes sem coordenação.

Tutor é isento da regra (`inv.funcao !== 'tutor'`) e pode acumular vínculos.

### A → participante **parcialmente cadastrado**

Levantamento dos 258 participantes ativos:

| Campo ausente | Quantidade |
|---|---|
| `memberId` | 0 |
| `ts` | 0 |
| `nome` | 0 |
| **`wa` (vazio ou ausente)** | **9** |

> **F-04 confirmado com número.** Nove pessoas ativas não têm WhatsApp gravado. Para elas,
> `buscarCadastroExistente` retorna `null` de imediato (`index.html:12016`) — **a recuperação de
> cadastro em aparelho novo é impossível**. Se qualquer uma trocar de celular, limpar os dados ou
> usar outro navegador, aceitar um convite vai criar uma **duplicata**, e o XP não volta.
>
> São 9 duplicações futuras já contratadas, esperando a troca de aparelho.

---

# 4. Peso dos convites no documento

| Campo | Bytes no envelope | Participação |
|---|---|---|
| **`convites`** (492 registros) | **221 807** | **54,2 %** |
| `dados` (70 PGs, 279 participantes) | 183 374 | 44,8 % |
| demais campos | 3 552 | 0,9 % |
| **Total** | **409 130** | de um limite de 1 MiB |

O registro de convites pesa **mais que todos os Pequenos Grupos somados**. E a guarda de tamanho
de `fbWriteGrupos` (`index.html:11066`) mede **apenas `dados`** — `convites` cresce sem vigilância
(**F-27**).

Composição do que está lá:

- 402 convites em estado terminal — serão podados 30 dias após o último toque;
- **90 pendentes, dos quais 34 já vencidos** — e que, por F-30, **nunca** serão podados;
- desses 90, pelo menos 21 são duplicatas para pessoas que já seguram outro link válido.

**Nenhum convite pendente jamais sai do documento por conta própria.** A limpeza manual de 136
convites em 26/08 não foi uma escolha operacional — foi o suprimento à mão de uma rotina que
existe no código e nunca roda.

---

# 5. Correções à Fase 1

Duas hipóteses da Fase 1 foram testadas contra os 492 convites reais. Uma se confirmou, **a outra
não**.

### ❌ F-06 (convite que nasce morto) — **zero ocorrências**

A Fase 1 apontou que emissão e aceite usam réguas de nome diferentes (tolerante × estrita) e
previu convites impossíveis de aceitar. Simulei a autoridade de `validarConviteParaAceite` sobre
os 492 convites:

| Status | Passariam | Falhariam por autoridade | **Falhariam pela régua de nome (F-06)** |
|---|---|---|---|
| pendente (90) | 88 | 2 | **0** |
| cancelado (195) | 170 | 25 | **0** |
| utilizado (207) | 201 | 6 | **0** |

**Nenhum convite, em toda a história do sistema, tem a assinatura do F-06.** O defeito é real e
está no código, mas **não tem vítima conhecida**. A Fase 1 o classificou como severidade A e o
apresentou como um dos três achados principais — **isso estava desproporcional**. Ele desce para
severidade C: defeito latente, sem urgência, a corrigir por higiene.

Os 2 pendentes que falhariam por autoridade não caem na régua de nome (o emissor simplesmente não
é mais reconhecível no grupo) e **ambos já estão vencidos** — seriam recusados pelo prazo de
qualquer forma.

### ✅ Confirmado, e mais grave do que parecia: a autoridade é avaliada no momento do aceite

Os **6 convites `utilizado` que hoje falhariam** por autoridade são a prova: eles foram aceitos
quando o emissor tinha autoridade, e hoje não teriam. A verificação usa o **estado atual do
grupo**, não o estado de quando o convite foi emitido.

> ### 🔴 F-35 — Um convite válido pode deixar de funcionar sem que nada aconteça com ele
>
> Se o coordenador que emitiu sair do PG, for removido, tiver o `papel` limpo numa troca, ou se
> `g.coordenador` for editado, **todos os convites pendentes que ele emitiu param de funcionar na
> mesma hora**. Quem recebeu lê *"Quem enviou este convite não é mais responsável pelo grupo"*.
>
> Isto é defensável como política de segurança — e é indefensável como experiência, porque **não
> há aviso para quem emitiu**. O coordenador anterior não sabe; o novo não sabe que precisa
> reemitir; e as pessoas com o link antigo simplesmente não entram.
>
> Interage diretamente com o risco R-05 (o `papel` do coordenador anterior não é limpo na troca):
> hoje o defeito R-05 está **mascarando** o F-35 — se R-05 fosse corrigido isoladamente, os
> convites pendentes do coordenador anterior morreriam todos de uma vez.
> **As duas correções precisam ser pensadas juntas.**

---

# 6. Achados novos da Fase 2

| # | Achado | Sev. |
|---|---|---|
| **F-31** | `usadoPor` é gravado e nunca lido; a própria pessoa é acusada de que "outra pessoa" usou o convite dela | **A** |
| **F-32** | Não existe reenvio: o botão multiplica convites e nenhum anterior é invalidado (recorde: 12 válidos) | **A** |
| **F-33** | 80% dos convites não registram destino; a maior parte do problema é invisível na base | **A** |
| **F-34** | `renderMeusConvitesEnviados` filtra por `deId === meuId`: em aparelho novo o coordenador perde a lista dos próprios convites, não copia link nem revoga | B |
| **F-35** | A aceitabilidade muda com o tempo sem nada acontecer com o convite; ninguém é avisado | **A** |
| **F-36** | O único reaproveitamento existente lê do cache local e compara nome de grupo por igualdade estrita | C |
| **F-37** | O aceite não limpa `removed`: a pessoa entra com sucesso e não aparece no grupo | **A** |
| **F-06** | *(rebaixado de A para C — zero ocorrências em 492 convites)* | C |

---

# 7. Veredito sobre a reclamação

> *"Mandaram novamente o mesmo convite e a pessoa não conseguiu entrar."*

**O reenvio nunca poderia ter ajudado**, e por três razões independentes:

1. **Se foi encaminhamento do mesmo link** (caminhos a/b), nada mudou na base. Um convite que não
   funcionava continua não funcionando; um que funcionava já funcionava antes.
2. **Se foi um convite novo** (caminho c), o antigo continuou válido — a pessoa passou a ter dois
   links igualmente bons. Ter mais links não resolve um problema que não é de link.
3. **Se a pessoa já tinha entrado** e reabriu o link, o app diz que *outra pessoa* usou o convite
   dela (F-31). Aí o coordenador manda outro, e o ciclo recomeça.

**Onde a falha realmente está**, em ordem de probabilidade, conforme os achados das duas fases:

| Causa provável | Achado | Como se manifesta |
|---|---|---|
| Leitura da nuvem falhou ao abrir o link | **F-01** | "Convite indisponível" quando o problema é internet |
| A URL é apagada antes de renderizar; recarregar perde o convite | **F-10** | Abriu, apareceu, sumiu e não volta |
| A pessoa já tinha entrado e reabriu o link | **F-31** | "Já utilizado por outra pessoa" |
| Entrou, mas tinha tombstone e não apareceu no grupo | **F-37** | "Entrei e ninguém me vê" |
| O aplicativo de mensagens não entregou o link inteiro | F-07/F-09 | Link truncado ou que não abre |

**Nenhuma delas se resolve mandando outro convite.** As cinco se resolvem no aparelho de quem
recebe — ou no código que atende esse aparelho.

## Recomendação operacional imediata (não é correção de código)

Para os **5 destinos que hoje seguram mais de um link válido** — especialmente o do caso 2, com
12 —, mandar um convite novo é a pior ação disponível. O que responde a pergunta é descobrir **o
que aparece na tela da pessoa** quando ela abre um dos links que já tem. As cinco causas acima
produzem mensagens **diferentes**, e a mensagem identifica a causa.

---

# 8. Limites desta fase

- **Nada foi executado.** Nenhuma função do app rodou; nenhum convite foi aberto, aceito ou
  cancelado. Toda a simulação de aceite foi aritmética sobre o instantâneo.
- **A simulação de autoridade usa o estado atual do grupo**, não o estado de quando cada convite
  foi emitido — é justamente o que revelou o F-35, mas impede afirmar por que um convite
  histórico falhou *naquele dia*.
- **80% dos convites não têm destino registrado (F-33).** Todos os números de repetição são um
  **piso**. O volume real de reenvio é maior, em proporção desconhecida.
- **Tentativas frustradas não deixam rastro.** Não há como medir quantas vezes alguém abriu um
  link e não conseguiu entrar — só quantos convites foram criados depois.
- **A pergunta sobre regressão da correção de 26/08 continua aberta.** Os dados de 27–28/08 são
  favoráveis, mas a amostra (5 convites em 28/08) é pequena demais para concluir.
