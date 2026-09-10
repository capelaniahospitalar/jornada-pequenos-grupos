# AUDIT-05-IDENTIDADE — Identidade, armazenamento local e reentrada

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 5 — Identidade e `localStorage`
**Data de execução:** 2026-08-31
**Baseline de código:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Baseline de dados:** instantâneo de produção de 31/08/2026 09:51:54Z
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

---

## Resposta em uma frase

**A identidade da pessoa neste aplicativo é um número aleatório guardado numa única gaveta do
navegador. Perdeu a gaveta, virou outra pessoa — e o único jeito de voltar a ser você mesmo é
aceitar um convite novo.**

E há uma inversão de prioridades no coração disso:

> ### 🔴 F-51 — O progresso é protegido por três camadas; a identidade, por uma só
>
> | O que | Onde é guardado | Camadas |
> |---|---|---|
> | **Progresso** (`ST`: nome, XP, estudos, `welcomeDone`) | `localStorage` → `sessionStorage` → **cookie de 1 ano** | **3** |
> | **Identidade** (`memberId`) | `localStorage` | **1** |
>
> O app se esforça para não perder o XP e não faz esforço nenhum para não perder **quem você é**.
>
> A consequência é o pior estado possível: numa perda parcial de armazenamento, o app abre
> **normalmente** — nome certo, XP certo, direto na tela inicial, sem pedir nada — **com uma
> identidade nova**. Nada na tela indica que a ligação com a nuvem foi rompida. E ela **nunca se
> reconstrói sozinha**.

---

# 1. As seis identidades e como elas se ligam

```
┌─ USER IDENTITY ──────────────────────────────────────────────┐
│  memberId : UUID v4                                          │
│  chave    : jdpg_member_id_v1        (localStorage, 1 camada)│
│  nasce    : na 1ª chamada de getMyMemberId()                 │
└───────────────┬──────────────────────────────────────────────┘
                │ carimbado em
                ▼
┌─ PARTICIPANT IDENTITY ───────────────────────────────────────┐
│  p.memberId · p.ts · p.nome · p.wa                           │
│  vive DENTRO de g.participantes[], no Firestore              │
│  4 chaves concorrentes — 8 réguas diferentes o procuram      │
└───────────────┬──────────────────────────────────────────────┘
                │ referenciado por
                ▼
┌─ INVITE IDENTITY ────────────────────────────────────────────┐
│  inviteId (UUID) · deId (memberId do emissor)                │
│  usadoPor (memberId de quem usou — GRAVADO E NUNCA LIDO)     │
└───────────────┬──────────────────────────────────────────────┘
                │ aponta para
                ▼
┌─ PG IDENTITY ────────────────────────────────────────────────┐
│  g.num (slot, 1–70)   ← usado por TODO o app                 │
│  g.pgId (UUID)        ← existe, quase não é usado            │
└──────────────────────────────────────────────────────────────┘

        localStorage  ←──── espelho, cache e ÚNICA fonte da identidade
        Firestore     ←──── fonte da verdade de TUDO, menos da identidade
```

**O ponto de ruptura está na primeira seta.** `memberId` é criado no aparelho e só existe no
aparelho até ser carimbado num registro de participante. Se o aparelho perde a chave, o carimbo na
nuvem continua lá, apontando para uma identidade que não existe mais em lugar nenhum.

---

# 2. O identificador do usuário — as dez perguntas

### 2.1 Qual é o identificador?

`memberId` — UUID v4 aleatório, gerado por `uuid()` (`index.html:10634`).

Declarado no código (`index.html:9724`) como *"a identidade permanente da PESSOA, não do
aparelho"*. **Na prática é do navegador**, e a diferença é a origem de quase tudo nesta fase.

Existe também `getDeviceId()` (`index.html:10642`), com a mesma mecânica, **usado em um único
lugar**: o log local de conflitos. Não participa de nenhuma decisão.

### 2.2 Quando é criado?

```js
function getMyMemberId() {
  try {
    let id = localStorage.getItem(MEMBER_ID_KEY);
    if (!id) { id = uuid(); localStorage.setItem(MEMBER_ID_KEY, id); }
    return id;
  } catch { return 'mem-unknown'; }
}
```

**Preguiçosamente, na primeira chamada** — sem cerimônia, sem confirmação, sem registro. A função
é chamada no boot, ao abrir um convite, ao gerar convite, ao sincronizar progresso. **A primeira
que chegar cria.**

Não há "cadastro". Não há momento em que o app pergunte "você é novo ou já usava?". A identidade
simplesmente aparece.

### 2.3 Onde é armazenado?

Uma chave, um lugar:

| Chave | `jdpg_member_id_v1` (prefixada com `teste_` em modo de teste) |
|---|---|
| Meio | `localStorage` |
| Cópia em `sessionStorage` | ❌ não |
| Cópia em cookie | ❌ não |
| Cópia na nuvem indexada por pessoa | ❌ não |

Comparação com as 21 chaves de armazenamento do app:

| Chave | Conteúdo | Redundância |
|---|---|---|
| `amj3` (`ST`) | nome, XP, estudos, `welcomeDone`, `grupoNum`, `tutorPanelAuth` | **3 camadas** |
| **`jdpg_member_id_v1`** | **a identidade** | **1 camada** |
| `jdpg_meus_vinculos_v1` | a quais PGs pertenço | 1 camada |
| `jdpg_grupos_v1` | cópia local dos PGs | 1 camada (a nuvem reconstrói) |
| `jdpg_convites_v1` | espelho dos convites | 1 camada (a nuvem reconstrói) |
| demais 16 | preferências, telemetria, campanhas | 1 camada |

**A única coisa que a nuvem não consegue reconstruir é justamente a que tem menos proteção.**

### 2.4 Quando é recuperado?

Sempre por `getMyMemberId()`, que **nunca consulta a nuvem**. Não existe "buscar minha identidade
no servidor" — o servidor não tem índice por pessoa; os `memberId` estão enterrados dentro de
`dados.participantes[]`.

### 2.5 Quando pode mudar?

Existem **apenas dois lugares** em todo o arquivo onde a identidade é reatribuída:

| Onde | Linha | O que faz | Alcança quem hoje? |
|---|---|---|---|
| `migrateToVinculos` | `9831` | adota o `memberId` do registro da nuvem como sendo o meu | ❌ Legado: só roda se existir o formato antigo `jdpg_meu_grupo_v1`, uma única vez |
| `aceitarConvite` (ramo IDENT-01) | `10204` | `p.memberId = memberId` — carimba a identidade **nova** no registro antigo | ✅ **É o único caminho vivo** |

> ### 🔴 F-52 — Só existe uma porta de reconciliação, e ela é o convite
>
> Não há tela de "recuperar acesso", não há login, não há código por WhatsApp, não há
> "já usei este app antes". `confirmarInscricao()` está morto desde a FUNC-02d e a porta
> institucional é terminal por desenho.
>
> **A única forma de um aparelho voltar a ser reconhecido como uma pessoa já cadastrada é
> alguém emitir um convite novo e ela aceitá-lo** — o que, pelas Fases 2 e 3, gasta um convite,
> pode sobrescrever o progresso local (F-23) e falha se o nome não for digitado exatamente igual
> (F-11).

### 2.6 Quando pode estar ausente?

| Situação | `getMyMemberId()` devolve |
|---|---|
| Primeiro acesso | UUID novo |
| `localStorage` limpo | UUID novo |
| `localStorage` **bloqueado** (aba privada de alguns navegadores, política de privacidade, cota estourada) | **`'mem-unknown'`** |

> ### 🔴 F-55 — `'mem-unknown'` é uma identidade **compartilhada**
>
> Quando o armazenamento lança exceção, a função devolve a **string literal** `'mem-unknown'` —
> a mesma para todo mundo, em todo aparelho, para sempre.
>
> Se uma pessoa nessa condição aceitar um convite, o registro dela é gravado com
> `memberId = 'mem-unknown'`. A partir daí, **qualquer outra pessoa no mesmo estado, no mesmo PG,
> seria reconhecida por `aceitarConvite` como sendo ela** — e assumiria o cadastro, o nome e o XP
> alheios. `getDeviceId()` tem o mesmo defeito com `'dev-unknown'`.
>
> **Verificação em produção: 0 registros com `mem-unknown` e 0 convites com `deId`/`usadoPor`
> iguais a isso.** A bomba está armada e nunca disparou. Registrado como risco latente, não como
> incidente.

### 2.7 Quando pode estar **stale** (desatualizado)?

Este é o estado mais perigoso, porque **não parece um erro**.

```
localStorage perde jdpg_member_id_v1, mas o cookie amj3 sobrevive
        ↓
load() recupera ST do cookie → welcomeDone = true, nome e XP intactos
        ↓
initApp → ST.welcomeDone → vai DIRETO para a tela inicial
        ↓
getMyMemberId() não acha nada → gera UUID NOVO
        ↓
o app funciona: nome certo, XP certo, PG certo
        ↓
mas o registro na nuvem ainda tem o memberId ANTIGO
```

A partir daí, as oito réguas da Fase 3 divergem: as que caem para comparação por **nome**
continuam achando a pessoa; as que exigem **`memberId`** não acham mais.

> ### 🔴 F-53 — A divergência é detectada, usada e **nunca consertada**
>
> `syncProgressoParaFirebase` (`index.html:5947`) chama `findMeuParticipante`, que casa por
> `memberId` **ou por nome**:
> ```js
> return (g.participantes || []).find(p => p.memberId === meuId)
>     || (g.participantes || []).find(p => p.nome && p.nome.trim().toLowerCase() === meuNome);
> ```
> Quando cai no segundo ramo, o app **sabe** que achou a pessoa por nome porque o `memberId` não
> bateu. E **não corrige `p.memberId`.** Grava o progresso e segue.
>
> A divergência vira permanente: o progresso continua subindo (por nome), mas
> **`aceitarConvite` — que casa só por `memberId` — nunca mais reconhece essa pessoa**. A próxima
> vez que ela aceitar um convite, cai em `buscarCadastroExistente` (nome + WhatsApp exatos) ou
> vira duplicata.
>
> Uma linha — `p.memberId = meuId` — resolveria. Ela não existe.

### 2.8 Limpar o navegador quebra a reentrada?

**Depende do que for limpado** — e as três respostas são diferentes:

| O que foi limpado | O que acontece |
|---|---|
| **Tudo** (localStorage + cookies) | Volta à porta institucional. Precisa de convite novo. Recupera **se** nome e WhatsApp baterem exatamente. Caso limpo — o app pelo menos **admite** que não conhece a pessoa |
| **Só o `localStorage`** (cookie sobrevive) | ❌ **O pior caso.** Abre normalmente com identidade nova e silenciosa (§2.7). Ninguém percebe nada |
| **Só cookies** | Nada muda: `localStorage` é lido primeiro |

**A limpeza total é menos danosa que a parcial**, porque produz um estado honesto.

### 2.9 Trocar de dispositivo quebra a reentrada?

**Sim, sempre.** Nenhuma das 21 chaves viaja entre aparelhos. Aparelho novo = pessoa nova, sem
exceção.

O caminho projetado para isso é o IDENT-01 (`buscarCadastroExistente`), e ele funciona **sob três
condições simultâneas**:

1. a pessoa recebe e abre um convite novo;
2. digita o nome **exatamente** como está gravado (comparação estrita, sem tolerância a acento,
   abreviação ou sobrenome faltando);
3. o cadastro na nuvem **tem** um WhatsApp gravado.

Falhando qualquer uma: **cadastro duplicado e XP perdido**.

**Em produção: 9 dos 258 participantes ativos não têm WhatsApp gravado.** Para essas 9 pessoas a
condição 3 já está quebrada — **a troca de aparelho delas resultará em duplicata, com certeza.**

### 2.10 Abrir o convite no WhatsApp cria uma identidade diferente?

**Pode criar, e essa é a resposta que mais importa em campo.**

O mecanismo é o mesmo dos itens anteriores: `localStorage` é isolado por **origem × contexto de
navegador**. Cada contexto distinto tem sua própria gaveta e, portanto, seu próprio `memberId`.

| Contexto onde o link é aberto | Gaveta |
|---|---|
| Navegador padrão do aparelho | A |
| Navegador embutido do aplicativo de mensagens | pode ser A, pode ser B |
| Outro navegador instalado | C |
| Aba anônima / privada | D (descartada ao fechar) |
| App instalado na tela inicial | pode ser A, pode ser E |

O aplicativo **não tem como saber em qual gaveta está** e não faz nenhuma verificação a respeito.

**O padrão de campo é este:** o convite chega pelo WhatsApp, é aberto no navegador embutido dele
(gaveta possivelmente nova), a pessoa entra e tudo funciona. Depois ela abre o app pelo atalho ou
pelo navegador normal — **outra gaveta, outra identidade** — e o app não a reconhece.

Não afirmo qual contexto compartilha armazenamento com qual: isso depende do sistema, da versão do
aplicativo de mensagens e de configurações do usuário, e **não é verificável por leitura de
código**. O que é verificável, e vale como fato desta auditoria: **existe evidência de campo já
registrada de que o atalho de tela inicial no iPhone perde o vínculo do participante**, o que
confirma que ao menos um par de contextos não compartilha armazenamento neste app.

**Recomendação que decorre disso (não é correção de código):** orientar a pessoa a abrir o link no
navegador que ela usará sempre, e a salvar o endereço — não criar atalho na tela inicial.

---

# 3. Os três cenários pedidos

## 3.1 Mesmo usuário · mesmo aparelho · mesmo navegador

```
localStorage intacto → memberId estável → régua 2 casa por memberId
```

✅ **Funciona.** É o caminho feliz e o único que não depende de nome nem de WhatsApp.

**Riscos residuais:** cota de armazenamento estourada (`save()` só emite um aviso no console);
limpeza automática de dados por inatividade, que alguns navegadores aplicam a sites não visitados
por alguns dias — nesse caso a pessoa cai no cenário 3.2 **sem ter trocado de nada**.

## 3.2 Mesmo usuário · outro aparelho

```
localStorage vazio → memberId NOVO → régua 2 falha
   → precisa de convite → buscarCadastroExistente(nome estrito + wa tolerante)
        achou  → recupera (e SOBRESCREVE o progresso local — F-23)
        não achou → DUPLICATA silenciosa
```

⚠️ **Funciona sob condições.** É o cenário para o qual o IDENT-01 foi construído, e o único com
uma rede de segurança de verdade.

**A rede tem três buracos:** nome comparado com igualdade estrita; cadastro sem WhatsApp
(9 pessoas); e a restauração que sobrescreve em vez de comparar.

## 3.3 Mesmo usuário · outro navegador (mesmo aparelho)

```
outro navegador = outro localStorage = memberId NOVO
```

❌ **Idêntico à troca de aparelho, e mais traiçoeiro** — porque a pessoa não trocou de nada
aparente. É o mesmo celular, na mão dela, e o app não a reconhece.

Aqui entra o subcaso mais grave, que é **um híbrido dos três**: o mesmo navegador com
`localStorage` perdido e cookie preservado (§2.7). O app **não** manda a pessoa para a tela de
convite — abre direto na tela inicial, com o nome dela, com o XP dela, e com uma identidade que a
nuvem não conhece. **É o único dos cenários em que nem a pessoa nem o app percebem que algo
quebrou.**

## Quadro comparativo

| | 3.1 mesmo tudo | 3.2 outro aparelho | 3.3 outro navegador | 3.3b `localStorage` perdido, cookie vivo |
|---|---|---|---|---|
| `memberId` | estável | novo | novo | **novo** |
| `ST` (nome, XP) | intacto | vazio | vazio | **intacto (cookie)** |
| `welcomeDone` | true | false | false | **true** |
| Tela ao abrir | inicial | porta institucional | porta institucional | **inicial** |
| A pessoa percebe? | — | ✅ sim | ✅ sim | ❌ **não** |
| O app percebe? | — | ✅ sim | ✅ sim | ❌ **não** |
| Reconciliação | — | convite | convite | **nenhuma; some sozinho** |

---

# 4. Evidência em produção

## 4.1 Integridade dos identificadores

| Medida | Valor |
|---|---|
| Registros de participante | 279 |
| Com `memberId` | 278 |
| **Sem `memberId`** | **1** (PG 10, já removido, sem WhatsApp, sem XP) |
| `memberId` distintos | 277 |
| `memberId` usado por 2 registros | **1** — PG 49 (removido) + PG 54 (ativo) |

O caso do `memberId` repetido é **saudável**: é uma pessoa que saiu de um PG e entrou noutro,
mantendo a identidade. **É o único exemplo, em toda a base, de reentrada funcionando como
projetado.**

## 4.2 Deriva de identidade — medida

Testei todos os 492 convites: o `deId` do emissor ainda existe como participante do PG?

| Resultado | Convites |
|---|---|
| Emissor presente | 418 |
| **Emissor ausente** | **74** (15%) |

Dos 74 ausentes, separei os que são **deriva de identidade** (o nome do emissor continua ativo no
PG, mas com **outro** `memberId`) dos que são saída real:

| | |
|---|---|
| **Deriva de identidade confirmada** | **4 convites · 1 pessoa · PG 15** |
| Saída real do PG | 70 convites |

**A deriva existe, está medida, e é rara.** O único caso é o já documentado do PG 15, em que o
coordenador passou a ter um `memberId` novo e os convites emitidos sob a identidade antiga ficaram
impossíveis de validar por `deId`. Os 4 convites continuam na base.

> **Isto corrige uma expectativa minha:** eu esperava que a deriva de identidade fosse comum e
> explicasse boa parte das falhas. **Não é.** 70 dos 74 casos são simplesmente pessoas que saíram
> do grupo — o que reforça o **F-35** (autoridade avaliada no momento do aceite) como o problema
> real, e não a instabilidade do `memberId`.

## 4.3 Convites zumbis

> ### 🔴 F-54 — 11 convites pendentes não aparecem na lista de ninguém
>
> `renderMeusConvitesEnviados` (`index.html:10558`) filtra por `c.deId === meuId`. Quando a
> identidade do emissor muda ou ele sai do PG, **seus convites pendentes deixam de aparecer para
> qualquer pessoa**: ninguém pode copiar o link, ninguém pode revogar.
>
> **Em produção: 11 dos 90 pendentes** estão nesse estado. São convites válidos, ativos,
> aceitáveis — e invisíveis para toda a administração do sistema. Só desaparecem quando vencem
> (e, por F-30, nem então: continuam no documento para sempre).

---

# 5. Achados novos da Fase 5

| # | Achado | Sev. |
|---|---|---|
| **F-51** | O progresso tem 3 camadas de armazenamento; a identidade tem 1. Perda parcial produz um estado silencioso e irreversível | **A** |
| **F-52** | Só existe uma porta de reconciliação de identidade — aceitar um convite. Sem tela de recuperação, sem login | **A** |
| **F-53** | `findMeuParticipante` acha por nome quando o `memberId` não bate, usa o resultado e **não corrige** o `memberId`. Uma linha resolveria | **A** |
| **F-54** | 11 convites pendentes órfãos do emissor: invisíveis na lista, impossíveis de copiar ou revogar | B |
| **F-55** | `'mem-unknown'` / `'dev-unknown'` são identidades compartilhadas por todos os aparelhos com armazenamento bloqueado. 0 casos hoje | B |
| **F-56** | `getDeviceId()` existe e é usado só no log local de conflitos — não participa de nenhuma decisão de identidade | C |

---

# 6. Onde a identidade se rompe — resumo visual

```
                          ┌── funciona ────────────────────────────┐
mesmo navegador ──────────┤                                        │
                          └── localStorage perdido ────────────────┼── SILÊNCIO (F-51/F-53)
                                                                   │   ← pior estado
outro navegador ──────────── memberId novo ── convite ── nome+wa ──┤
                                                                   ├── recupera OU duplica
outro aparelho ───────────── memberId novo ── convite ── nome+wa ──┘

navegador embutido do
aplicativo de mensagens ──── gaveta possivelmente distinta ─────────── idem
```

**Três dos quatro caminhos passam pelo mesmo gargalo:** `buscarCadastroExistente`, com nome
estrito e WhatsApp obrigatório. **O quarto não passa por gargalo nenhum — porque ninguém percebe
que ele aconteceu.**

---

# 7. O que isto significa para as prioridades

Cruzando com as fases anteriores, três correções pequenas resolveriam a maior parte do problema de
identidade — e **nenhuma delas exige mudar a arquitetura**:

| Correção | Onde | Efeito |
|---|---|---|
| Reparar o `memberId` quando a pessoa for achada por nome | `findMeuParticipante` (`5947`) — **1 linha** | Fecha a divergência silenciosa (F-53) antes que ela se torne permanente |
| Usar `nomesCorrespondem()` na recuperação | `buscarCadastroExistente` (`12012`) | Fecha o gargalo dos três caminhos de reentrada (F-11) |
| Comparar antes de sobrescrever o progresso | `aceitarConvite` (`10245`) | Deixa de destruir o trabalho de quem estudou offline (F-23) |

A quarta — **guardar o `memberId` também no cookie**, junto com `ST` — eliminaria por completo o
cenário 3.3b, que é o único invisível. É uma linha em `save()` e uma em `getMyMemberId()`.

Nenhuma dessas quatro foi aplicada. Esta fase apenas as identifica.

---

# 8. Limites desta fase

- **Nada foi executado.** Nenhuma função rodou, nenhum navegador foi aberto, nenhuma escrita
  ocorreu. Tudo é leitura de código e aritmética sobre o instantâneo.
- **O comportamento dos navegadores embutidos não é verificável por código.** Qual contexto
  compartilha `localStorage` com qual depende do sistema operacional, da versão do aplicativo de
  mensagens e de configurações do usuário. Só um teste em aparelho real responde — e ele **não**
  foi feito.
- **O cenário 3.3b é indimensionável.** Quem está nele não deixa rastro distinguível na nuvem: o
  registro parece normal, apenas com um `memberId` que nenhum aparelho reivindica. Não há como
  contá-lo sem consultar os aparelhos.
- **As 9 pessoas sem WhatsApp foram contadas, não investigadas.** Não se sabe se é digitação
  recusada em silêncio (F-45), importação antiga ou outra rota.
- **`mem-unknown` tem 0 ocorrências hoje**, mas isso não prova que nunca ocorreu: um registro
  assim pode ter sido sobrescrito ou removido antes deste instantâneo.
